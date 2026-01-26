<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, PhoneLabels, ConnectionStatus } from '../types';
import { defaultLabels } from '../types';
import { formatDuration } from '../utils/formatDuration';
import { cn } from '../utils/cn';

// ============================================
// Props
// ============================================

interface Props {
    config: PhoneConfig;
    className?: string;
    labels?: Partial<PhoneLabels>;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
    onIncomingCall?: (callerNumber: string, callerName?: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
    className: '',
    labels: () => ({}),
});

const emit = defineEmits<{
    (e: 'callStart', number: string): void;
    (e: 'callEnd', number: string, duration: number, status: 'completed' | 'failed'): void;
    (e: 'statusChange', status: PhoneStatus): void;
    (e: 'incomingCall', callerNumber: string, callerName?: string): void;
}>();

// ============================================
// UA Manager
// ============================================

interface UAInstance {
    ua: JsSIP.UA;
    audio: HTMLAudioElement;
    isStarted: boolean;
    listeners: Set<UAEventListener>;
}

interface UAEventListener {
    onConnecting?: () => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onRegistered?: () => void;
    onUnregistered?: () => void;
    onRegistrationFailed?: (cause?: string) => void;
    onNewSession?: (session: any) => void;
    onIncomingSession?: (session: any, callerNumber: string, callerName?: string) => void;
}

let globalUA: UAInstance | null = null;
let currentConfigKey: string | null = null;

function getConfigKey(config: PhoneConfig): string {
    return `${config.websocketUrl}|${config.sipUri}|${config.authorizationUser}`;
}

function initializeUA(config: PhoneConfig): UAInstance {
    const configKey = getConfigKey(config);

    if (globalUA && currentConfigKey === configKey) {
        return globalUA;
    }

    if (globalUA && currentConfigKey !== configKey) {
        try {
            globalUA.ua.stop();
        } catch (e) {
            // Ignore
        }
        globalUA = null;
    }

    currentConfigKey = configKey;

    const socket = new JsSIP.WebSocketInterface(config.websocketUrl);
    const uaConfig = {
        sockets: [socket],
        uri: config.sipUri,
        password: config.password,
        registrar_server: config.registrarServer,
        display_name: config.displayName,
        authorization_user: config.authorizationUser,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
    };

    const ua = new JsSIP.UA(uaConfig);
    const audio = document.createElement('audio');
    audio.autoplay = true;

    const instance: UAInstance = {
        ua,
        audio,
        isStarted: false,
        listeners: new Set(),
    };

    ua.on('connecting', () => {
        instance.listeners.forEach(l => l.onConnecting?.());
    });

    ua.on('connected', () => {
        instance.listeners.forEach(l => l.onConnected?.());
    });

    ua.on('disconnected', () => {
        instance.listeners.forEach(l => l.onDisconnected?.());
    });

    ua.on('registered', () => {
        instance.listeners.forEach(l => l.onRegistered?.());
    });

    ua.on('unregistered', () => {
        instance.listeners.forEach(l => l.onUnregistered?.());
    });

    ua.on('registrationFailed', (e: any) => {
        instance.listeners.forEach(l => l.onRegistrationFailed?.(e?.cause));
    });

    ua.on('newRTCSession', (data: any) => {
        const session = data.session;

        // Handle incoming calls
        if (session.direction === 'incoming') {
            const remoteIdentity = session.remote_identity;
            const callerNumber = remoteIdentity?.uri?.user || 'Unknown';
            const callerName = remoteIdentity?.display_name || undefined;
            
            instance.listeners.forEach(l => l.onIncomingSession?.(session, callerNumber, callerName));

            // Set up audio handling for incoming calls
            session.on('peerconnection', () => {
                session.connection.addEventListener('addstream', (e: any) => {
                    if (!e.streams?.length) return;
                    const audioEl = document.createElement('audio');
                    audioEl.srcObject = e.streams[0];
                    audioEl.play();
                });

                session.connection.addEventListener('track', (e: any) => {
                    const audioEl = document.createElement('audio');
                    audioEl.srcObject = e.streams[0];
                    audioEl.play();
                });
            });
            return;
        }

        instance.listeners.forEach(l => l.onNewSession?.(session));

        if (session.connection) {
            session.connection.addEventListener('addstream', (e: any) => {
                if (!e.streams?.length) return;
                const audioEl = document.createElement('audio');
                audioEl.srcObject = e.streams[0];
                audioEl.play();
            });

            session.connection.addEventListener('track', (e: any) => {
                const audioEl = document.createElement('audio');
                audioEl.srcObject = e.streams[0];
                audioEl.play();
            });
        }
    });

    globalUA = instance;
    return instance;
}

// ============================================
// State
// ============================================

interface IncomingCallInfo {
    session: any;
    callerNumber: string;
    callerName?: string;
}

const status = ref<PhoneStatus>('disconnected');
const callNumber = ref('');
const callHistory = ref<CallHistoryEntry[]>([]);
const currentCallDuration = ref(0);
const isReady = ref(false);
const connectionStatus = ref<ConnectionStatus>('connecting');
const isHistoryOpen = ref(false);
const incomingCall = ref<IncomingCallInfo | null>(null);

let uaInstance: UAInstance | null = null;
let currentSession: any = null;
let callStartedTS: number | null = null;
let durationInterval: ReturnType<typeof setInterval> | null = null;
let listener: UAEventListener | null = null;

// ============================================
// Computed
// ============================================

const labels = computed(() => ({ ...defaultLabels, ...props.labels }));

const statusInfo = computed(() => {
    switch (status.value) {
        case 'ringing':
            return { text: labels.value.incomingCall, color: 'text-blue-500', icon: 'ring' };
        case 'progress':
            return { text: `${labels.value.calling}...`, color: 'text-yellow-500', icon: 'ring' };
        case 'confirmed':
            return { text: `${labels.value.inCall} - ${formatDuration(currentCallDuration.value)}`, color: 'text-green-500', icon: 'inTalk' };
        case 'failed':
            return { text: labels.value.callEnded, color: 'text-red-500', icon: 'missed' };
        case 'ended':
            return { text: labels.value.callEnded, color: 'text-gray-500', icon: 'hangup' };
        default:
            return { text: labels.value.inactive, color: 'text-gray-300', icon: 'phone' };
    }
});

// ============================================
// Methods
// ============================================

function addToHistory(number: string, duration: number, callStatus: 'completed' | 'failed' | 'missed') {
    const entry: CallHistoryEntry = {
        id: Date.now().toString(),
        number,
        timestamp: Date.now(),
        duration,
        status: callStatus,
    };
    callHistory.value = [entry, ...callHistory.value].slice(0, 50);
    localStorage.setItem('tbi-phone-call-history', JSON.stringify(callHistory.value));
}

function endCall() {
    if (currentSession) {
        currentSession.terminate();
        currentSession = null;
    }
    incomingCall.value = null;
}

function answerCall() {
    if (!incomingCall.value) return;

    const { session, callerNumber: caller } = incomingCall.value;

    const answerOptions = {
        mediaConstraints: { audio: true, video: false },
    };

    try {
        session.answer(answerOptions);
        currentSession = session;
        props.onCallStart?.(caller);
        emit('callStart', caller);
    } catch (error) {
        console.error('Failed to answer call:', error);
        status.value = 'failed';
        props.onStatusChange?.('failed');
        emit('statusChange', 'failed');
        addToHistory(caller, 0, 'missed');
        incomingCall.value = null;
        setTimeout(() => {
            status.value = 'disconnected';
            props.onStatusChange?.('disconnected');
            emit('statusChange', 'disconnected');
        }, 3000);
    }
}

function rejectCall() {
    if (!incomingCall.value) return;

    const { session, callerNumber: caller } = incomingCall.value;

    try {
        session.terminate({ status_code: 603, reason_phrase: 'Decline' });
    } catch (error) {
        console.error('Failed to reject call:', error);
    }

    addToHistory(caller, 0, 'missed');
    incomingCall.value = null;
    status.value = 'disconnected';
    props.onStatusChange?.('disconnected');
    emit('statusChange', 'disconnected');
}

function startCall(number: string) {
    if (!number.trim() || !uaInstance) return;

    if (!isReady.value) {
        console.warn('Phone is not ready yet. Please wait for registration.');
        return;
    }

    callNumber.value = number;
    props.onCallStart?.(number);
    emit('callStart', number);

    const eventHandlers = {
        progress: () => {
            status.value = 'progress';
            props.onStatusChange?.('progress');
            emit('statusChange', 'progress');
        },
        failed: (e: any) => {
            console.error('Call failed:', e?.cause);
            status.value = 'failed';
            props.onStatusChange?.('failed');
            emit('statusChange', 'failed');
            addToHistory(number, 0, 'failed');
            props.onCallEnd?.(number, 0, 'failed');
            emit('callEnd', number, 0, 'failed');
            currentSession = null;
            setTimeout(() => {
                status.value = 'disconnected';
                props.onStatusChange?.('disconnected');
                emit('statusChange', 'disconnected');
            }, 3000);
        },
        ended: () => {
            status.value = 'ended';
            props.onStatusChange?.('ended');
            emit('statusChange', 'ended');
            const duration = callStartedTS ? Math.floor((Date.now() - callStartedTS) / 1000) : 0;
            addToHistory(number, duration, 'completed');
            props.onCallEnd?.(number, duration, 'completed');
            emit('callEnd', number, duration, 'completed');
            currentSession = null;
            if (durationInterval) {
                clearInterval(durationInterval);
                durationInterval = null;
            }
            setTimeout(() => {
                status.value = 'disconnected';
                props.onStatusChange?.('disconnected');
                emit('statusChange', 'disconnected');
                callStartedTS = null;
                currentCallDuration.value = 0;
            }, 2000);
        },
        confirmed: () => {
            status.value = 'confirmed';
            props.onStatusChange?.('confirmed');
            emit('statusChange', 'confirmed');
            callStartedTS = Date.now();
            durationInterval = setInterval(() => {
                if (callStartedTS) {
                    currentCallDuration.value = Math.floor((Date.now() - callStartedTS) / 1000);
                }
            }, 1000);
        },
    };

    const callOptions = {
        eventHandlers,
        mediaConstraints: { audio: true, video: false },
    };

    status.value = 'progress';
    props.onStatusChange?.('progress');
    emit('statusChange', 'progress');

    try {
        const session = uaInstance.ua.call(number, callOptions);
        currentSession = session;
    } catch (error) {
        console.error('Failed to start call:', error);
        status.value = 'failed';
        props.onStatusChange?.('failed');
        emit('statusChange', 'failed');
        addToHistory(number, 0, 'failed');
        setTimeout(() => {
            status.value = 'disconnected';
            props.onStatusChange?.('disconnected');
            emit('statusChange', 'disconnected');
        }, 3000);
    }
}

function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
        startCall(callNumber.value);
    }
}

function handleHistoryCall(entry: CallHistoryEntry) {
    callNumber.value = entry.number;
    isHistoryOpen.value = false;
    startCall(entry.number);
}

function getHistoryStatusIcon(entryStatus: 'completed' | 'failed' | 'missed'): string {
    switch (entryStatus) {
        case 'completed': return 'check';
        case 'failed': return 'cancel';
        case 'missed': return 'missed';
    }
}

function getHistoryStatusBg(entryStatus: 'completed' | 'failed' | 'missed'): string {
    switch (entryStatus) {
        case 'completed': return 'bg-green-100';
        case 'failed': return 'bg-red-100';
        case 'missed': return 'bg-yellow-100';
    }
}

function getHistoryStatusColor(entryStatus: 'completed' | 'failed' | 'missed'): string {
    switch (entryStatus) {
        case 'completed': return 'text-green-600';
        case 'failed': return 'text-red-600';
        case 'missed': return 'text-yellow-600';
    }
}

function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ============================================
// Lifecycle
// ============================================

onMounted(() => {
    // Initialize UA
    uaInstance = initializeUA(props.config);

    // Check current state
    if (uaInstance.ua.isRegistered()) {
        isReady.value = true;
        connectionStatus.value = 'connected';
    } else if (uaInstance.ua.isConnected()) {
        connectionStatus.value = 'connected';
    }

    // Create listener
    listener = {
        onConnecting: () => {
            connectionStatus.value = 'connecting';
        },
        onConnected: () => {
            connectionStatus.value = 'connected';
        },
        onDisconnected: () => {
            connectionStatus.value = 'disconnected';
            isReady.value = false;
        },
        onRegistered: () => {
            isReady.value = true;
            connectionStatus.value = 'connected';
        },
        onUnregistered: () => {
            isReady.value = false;
        },
        onRegistrationFailed: (cause) => {
            console.error('Registration failed:', cause);
            isReady.value = false;
            connectionStatus.value = 'failed';
        },
        onNewSession: (session) => {
            currentSession = session;
        },
        onIncomingSession: (session, callerNum, callerName) => {
            // Only handle if not already in a call
            if (currentSession) {
                session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
                return;
            }

            incomingCall.value = { session, callerNumber: callerNum, callerName };
            callNumber.value = callerNum;
            status.value = 'ringing';
            props.onStatusChange?.('ringing');
            emit('statusChange', 'ringing');
            props.onIncomingCall?.(callerNum, callerName);
            emit('incomingCall', callerNum, callerName);

            // Set up session event handlers for incoming calls
            session.on('failed', (e: any) => {
                console.error('Incoming call failed:', e?.cause);
                status.value = 'failed';
                props.onStatusChange?.('failed');
                emit('statusChange', 'failed');
                addToHistory(callerNum, 0, 'missed');
                incomingCall.value = null;
                currentSession = null;
                setTimeout(() => {
                    status.value = 'disconnected';
                    props.onStatusChange?.('disconnected');
                    emit('statusChange', 'disconnected');
                }, 3000);
            });

            session.on('ended', () => {
                status.value = 'ended';
                props.onStatusChange?.('ended');
                emit('statusChange', 'ended');
                const duration = callStartedTS ? Math.floor((Date.now() - callStartedTS) / 1000) : 0;
                addToHistory(callerNum, duration, 'completed');
                props.onCallEnd?.(callerNum, duration, 'completed');
                emit('callEnd', callerNum, duration, 'completed');
                incomingCall.value = null;
                currentSession = null;
                if (durationInterval) {
                    clearInterval(durationInterval);
                    durationInterval = null;
                }
                setTimeout(() => {
                    status.value = 'disconnected';
                    props.onStatusChange?.('disconnected');
                    emit('statusChange', 'disconnected');
                    callStartedTS = null;
                    currentCallDuration.value = 0;
                }, 2000);
            });

            session.on('confirmed', () => {
                status.value = 'confirmed';
                props.onStatusChange?.('confirmed');
                emit('statusChange', 'confirmed');
                callStartedTS = Date.now();
                incomingCall.value = null;
                durationInterval = setInterval(() => {
                    if (callStartedTS) {
                        currentCallDuration.value = Math.floor((Date.now() - callStartedTS) / 1000);
                    }
                }, 1000);
            });
        },
    };

    uaInstance.listeners.add(listener);

    if (!uaInstance.isStarted) {
        uaInstance.ua.start();
        uaInstance.isStarted = true;
    }

    // Load call history
    const savedHistory = localStorage.getItem('tbi-phone-call-history');
    if (savedHistory) {
        try {
            callHistory.value = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Error loading call history', e);
        }
    }

    // Listen for external StartCallEvent
    const handleStartCallEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const numberToCall = customEvent.detail.number;
        if (status.value === 'disconnected') {
            startCall(numberToCall);
        }
    };
    window.addEventListener('StartCallEvent', handleStartCallEvent);
});

onUnmounted(() => {
    if (durationInterval) {
        clearInterval(durationInterval);
    }
    if (uaInstance && listener) {
        uaInstance.listeners.delete(listener);
    }
});
</script>

<template>
    <div :class="cn('tbi-phone w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-2', className)">
        <!-- Disconnected - Input Mode -->
        <div v-if="status === 'disconnected'" class="flex gap-2 items-center">
            <!-- History Button -->
            <button
                @click="isHistoryOpen = true"
                class="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                type="button"
            >
                <!-- History Icon -->
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
            </button>

            <!-- Phone Input -->
            <input
                type="text"
                v-model="callNumber"
                @keydown="handleInputKeydown"
                :placeholder="labels.placeholder"
                class="flex-1 w-full h-8 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <!-- Call Button -->
            <button
                @click="startCall(callNumber)"
                :disabled="callNumber.length < 9 || !isReady"
                class="h-8 w-8 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors"
                type="button"
                :title="!isReady ? 'Connecting...' : 'Call'"
            >
                <div v-if="connectionStatus === 'connecting'" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
            </button>
        </div>

        <!-- Progress - Calling -->
        <div v-if="status === 'progress'" class="flex flex-col items-center gap-3 py-6">
            <div class="relative">
                <svg class="w-12 h-12 text-yellow-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.05 5A7 7 0 0 1 19 8.95M15.05 1A11 11 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div class="absolute inset-0 rounded-full border-4 border-yellow-500/30 animate-ping" />
            </div>
            <div class="text-center">
                <p class="text-base font-semibold">{{ labels.calling }} {{ callNumber }}</p>
                <p class="text-sm text-gray-500">{{ labels.waitingResponse }}</p>
            </div>
            <button
                @click="endCall"
                class="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                type="button"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
                {{ labels.cancel }}
            </button>
        </div>

        <!-- Ringing - Incoming Call -->
        <div v-if="status === 'ringing' && incomingCall" class="flex flex-col items-center gap-3 py-6">
            <div class="relative">
                <svg class="w-12 h-12 text-blue-500 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.05 5A7 7 0 0 1 19 8.95M15.05 1A11 11 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div class="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
            </div>
            <div class="text-center">
                <p class="text-sm text-gray-500">{{ labels.incomingCall }}</p>
                <p class="text-base font-semibold">{{ incomingCall.callerNumber }}</p>
                <p v-if="incomingCall.callerName" class="text-sm text-gray-600">{{ incomingCall.callerName }}</p>
            </div>
            <div class="flex gap-3">
                <button
                    @click="rejectCall"
                    class="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                    type="button"
                >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                    </svg>
                    {{ labels.reject }}
                </button>
                <button
                    @click="answerCall"
                    class="flex items-center gap-2 px-6 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                    type="button"
                >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    {{ labels.answer }}
                </button>
            </div>
        </div>

        <!-- Confirmed - In Call -->
        <div v-if="status === 'confirmed'" class="flex flex-col items-center gap-4 py-6">
            <div class="relative">
                <svg class="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
                </svg>
                <div class="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
            </div>
            <div class="text-center space-y-1">
                <p class="text-xl font-bold">{{ callNumber }}</p>
                <p class="text-2xl font-mono text-green-600 tabular-nums">
                    {{ formatDuration(currentCallDuration) }}
                </p>
            </div>
            <button
                @click="endCall"
                class="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                type="button"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                </svg>
                {{ labels.hangUp }}
            </button>
        </div>

        <!-- Failed or Ended -->
        <div v-if="status === 'failed' || status === 'ended'" class="flex flex-col items-center gap-3 py-6">
            <svg :class="cn('w-12 h-12', status === 'failed' ? 'text-red-500' : 'text-gray-500')" viewBox="0 0 24 24" fill="currentColor">
                <path v-if="status === 'failed'" d="M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z" />
                <path v-else d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
            <div class="text-center">
                <p class="text-base font-semibold">{{ statusInfo.text }}</p>
            </div>
        </div>

        <!-- History Sheet/Modal -->
        <Teleport to="body">
            <div v-if="isHistoryOpen" class="fixed inset-0 z-50 flex">
                <!-- Backdrop -->
                <div
                    class="fixed inset-0 bg-black/50"
                    @click="isHistoryOpen = false"
                />

                <!-- Sheet -->
                <div class="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" style="background-color: white;">
                    <div class="flex flex-col h-full">
                        <!-- Header -->
                        <div class="flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 class="text-lg font-semibold">{{ labels.callHistory }}</h2>
                                <p class="text-sm text-gray-500">
                                    {{ callHistory.length === 0 ? labels.noCallsRegistered : `${callHistory.length} ${labels.callsRegistered}` }}
                                </p>
                            </div>
                            <button
                                @click="isHistoryOpen = false"
                                class="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                type="button"
                            >
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 overflow-y-auto p-4">
                            <div v-if="callHistory.length === 0" class="text-center py-12 text-gray-500">
                                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                                </svg>
                                <p>{{ labels.noCalls }}</p>
                            </div>
                            <div v-else class="space-y-2">
                                <div
                                    v-for="(entry, index) in callHistory"
                                    :key="entry.id"
                                    class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    :style="{ animationDelay: `${index * 30}ms` }"
                                >
                                    <div :class="cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', getHistoryStatusBg(entry.status))">
                                        <svg :class="cn('w-4 h-4', getHistoryStatusColor(entry.status))" viewBox="0 0 24 24" fill="currentColor">
                                            <template v-if="entry.status === 'completed'">
                                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                <path d="M16 3l-5 5-2-2-1.5 1.5L11 11l6.5-6.5z" />
                                            </template>
                                            <template v-else-if="entry.status === 'failed'">
                                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                                <path d="M19 6.41L17.59 5 15 7.59 12.41 5 11 6.41 13.59 9 11 11.59 12.41 13 15 10.41 17.59 13 19 11.59 16.41 9z" />
                                            </template>
                                            <template v-else>
                                                <path d="M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z" />
                                            </template>
                                        </svg>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium text-sm truncate">{{ entry.number }}</p>
                                        <div class="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{{ formatTimestamp(entry.timestamp) }}</span>
                                            <template v-if="entry.duration > 0">
                                                <span>•</span>
                                                <span class="font-mono tabular-nums">{{ formatDuration(entry.duration) }}</span>
                                            </template>
                                        </div>
                                    </div>
                                    <button
                                        @click="handleHistoryCall(entry)"
                                        class="h-8 w-8 flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
                                        type="button"
                                    >
                                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
