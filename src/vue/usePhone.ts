import { inject, provide, ref, readonly, onMounted, onUnmounted } from 'vue';
import type { InjectionKey, Ref } from 'vue';
import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, ConnectionStatus } from '../types';

// ============================================
// Types
// ============================================

export interface IncomingCallInfo {
    session: any;
    callerNumber: string;
    callerName?: string;
}

export interface PhoneContextValue {
    status: Ref<PhoneStatus>;
    callNumber: Ref<string>;
    setCallNumber: (number: string) => void;
    callHistory: Ref<CallHistoryEntry[]>;
    currentCallDuration: Ref<number>;
    startCall: (number: string) => void;
    endCall: () => void;
    answerCall: () => void;
    rejectCall: () => void;
    isReady: Ref<boolean>;
    connectionStatus: Ref<ConnectionStatus>;
    incomingCall: Ref<IncomingCallInfo | null>;
}

// Injection key for Vue provide/inject
export const PhoneKey: InjectionKey<PhoneContextValue> = Symbol('Phone');

// ============================================
// UA Manager (same as React version)
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
// Composables
// ============================================

export interface UsePhoneProviderOptions {
    config: PhoneConfig;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
    onIncomingCall?: (callerNumber: string, callerName?: string) => void;
}

/**
 * Composable that provides phone functionality to child components.
 * Similar to React's PhoneProvider context.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePhoneProvider } from '@tbisoftware/phone/vue';
 *
 * usePhoneProvider({
 *   config: {
 *     websocketUrl: 'wss://sip-server.com:8989',
 *     sipUri: 'sip:user@domain.com',
 *     password: 'password',
 *     registrarServer: 'sip:domain.com',
 *     displayName: 'User',
 *     authorizationUser: 'user',
 *   },
 *   onCallStart: (number) => console.log('Calling', number),
 * });
 * </script>
 * ```
 */
export function usePhoneProvider(options: UsePhoneProviderOptions): PhoneContextValue {
    const { config, onCallStart, onCallEnd, onStatusChange, onIncomingCall } = options;

    const status = ref<PhoneStatus>('disconnected');
    const callNumber = ref('');
    const callHistory = ref<CallHistoryEntry[]>([]);
    const currentCallDuration = ref(0);
    const isReady = ref(false);
    const connectionStatus = ref<ConnectionStatus>('connecting');
    const incomingCall = ref<IncomingCallInfo | null>(null);

    let uaInstance: UAInstance | null = null;
    let currentSession: any = null;
    let callStartedTS: number | null = null;
    let durationInterval: ReturnType<typeof setInterval> | null = null;

    const setCallNumber = (number: string) => {
        callNumber.value = number;
    };

    const addToHistory = (number: string, duration: number, callStatus: 'completed' | 'failed' | 'missed') => {
        const entry: CallHistoryEntry = {
            id: Date.now().toString(),
            number,
            timestamp: Date.now(),
            duration,
            status: callStatus,
        };
        callHistory.value = [entry, ...callHistory.value].slice(0, 50);
        localStorage.setItem('tbi-phone-call-history', JSON.stringify(callHistory.value));
    };

    const endCall = () => {
        if (currentSession) {
            currentSession.terminate();
            currentSession = null;
        }
        incomingCall.value = null;
    };

    const answerCall = () => {
        if (!incomingCall.value) return;

        const { session, callerNumber } = incomingCall.value;

        const answerOptions = {
            mediaConstraints: { audio: true, video: false },
        };

        try {
            session.answer(answerOptions);
            currentSession = session;
            onCallStart?.(callerNumber);
        } catch (error) {
            console.error('Failed to answer call:', error);
            status.value = 'failed';
            onStatusChange?.('failed');
            addToHistory(callerNumber, 0, 'missed');
            incomingCall.value = null;
            setTimeout(() => {
                status.value = 'disconnected';
                onStatusChange?.('disconnected');
            }, 3000);
        }
    };

    const rejectCall = () => {
        if (!incomingCall.value) return;

        const { session, callerNumber } = incomingCall.value;

        try {
            session.terminate({ status_code: 603, reason_phrase: 'Decline' });
        } catch (error) {
            console.error('Failed to reject call:', error);
        }

        addToHistory(callerNumber, 0, 'missed');
        incomingCall.value = null;
        status.value = 'disconnected';
        onStatusChange?.('disconnected');
    };

    const startCall = (number: string) => {
        if (!number.trim() || !uaInstance) return;

        if (!isReady.value) {
            console.warn('Phone is not ready yet. Please wait for registration.');
            return;
        }

        callNumber.value = number;
        onCallStart?.(number);

        const eventHandlers = {
            progress: () => {
                status.value = 'progress';
                onStatusChange?.('progress');
            },
            failed: (e: any) => {
                console.error('Call failed:', e?.cause);
                status.value = 'failed';
                onStatusChange?.('failed');
                addToHistory(number, 0, 'failed');
                onCallEnd?.(number, 0, 'failed');
                currentSession = null;
                setTimeout(() => {
                    status.value = 'disconnected';
                    onStatusChange?.('disconnected');
                }, 3000);
            },
            ended: () => {
                status.value = 'ended';
                onStatusChange?.('ended');
                const duration = callStartedTS ? Math.floor((Date.now() - callStartedTS) / 1000) : 0;
                addToHistory(number, duration, 'completed');
                onCallEnd?.(number, duration, 'completed');
                currentSession = null;
                if (durationInterval) {
                    clearInterval(durationInterval);
                    durationInterval = null;
                }
                setTimeout(() => {
                    status.value = 'disconnected';
                    onStatusChange?.('disconnected');
                    callStartedTS = null;
                    currentCallDuration.value = 0;
                }, 2000);
            },
            confirmed: () => {
                status.value = 'confirmed';
                onStatusChange?.('confirmed');
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
        onStatusChange?.('progress');

        try {
            const session = uaInstance.ua.call(number, callOptions);
            currentSession = session;
        } catch (error) {
            console.error('Failed to start call:', error);
            status.value = 'failed';
            onStatusChange?.('failed');
            addToHistory(number, 0, 'failed');
            setTimeout(() => {
                status.value = 'disconnected';
                onStatusChange?.('disconnected');
            }, 3000);
        }
    };

    onMounted(() => {
        // Initialize UA
        uaInstance = initializeUA(config);

        // Check current state
        if (uaInstance.ua.isRegistered()) {
            isReady.value = true;
            connectionStatus.value = 'connected';
        } else if (uaInstance.ua.isConnected()) {
            connectionStatus.value = 'connected';
        }

        // Create listener
        const listener: UAEventListener = {
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
            onIncomingSession: (session, callerNumber, callerName) => {
                // Only handle if not already in a call
                if (currentSession) {
                    session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
                    return;
                }

                incomingCall.value = { session, callerNumber, callerName };
                callNumber.value = callerNumber;
                status.value = 'ringing';
                onStatusChange?.('ringing');
                onIncomingCall?.(callerNumber, callerName);

                // Set up session event handlers for incoming calls
                session.on('failed', (e: any) => {
                    console.error('Incoming call failed:', e?.cause);
                    status.value = 'failed';
                    onStatusChange?.('failed');
                    addToHistory(callerNumber, 0, 'missed');
                    incomingCall.value = null;
                    currentSession = null;
                    setTimeout(() => {
                        status.value = 'disconnected';
                        onStatusChange?.('disconnected');
                    }, 3000);
                });

                session.on('ended', () => {
                    status.value = 'ended';
                    onStatusChange?.('ended');
                    const duration = callStartedTS ? Math.floor((Date.now() - callStartedTS) / 1000) : 0;
                    addToHistory(callerNumber, duration, 'completed');
                    onCallEnd?.(callerNumber, duration, 'completed');
                    incomingCall.value = null;
                    currentSession = null;
                    if (durationInterval) {
                        clearInterval(durationInterval);
                        durationInterval = null;
                    }
                    setTimeout(() => {
                        status.value = 'disconnected';
                        onStatusChange?.('disconnected');
                        callStartedTS = null;
                        currentCallDuration.value = 0;
                    }, 2000);
                });

                session.on('confirmed', () => {
                    status.value = 'confirmed';
                    onStatusChange?.('confirmed');
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

        // Cleanup on unmount is handled in onUnmounted
    });

    onUnmounted(() => {
        if (durationInterval) {
            clearInterval(durationInterval);
        }
    });

    const contextValue: PhoneContextValue = {
        status: readonly(status) as Ref<PhoneStatus>,
        callNumber,
        setCallNumber,
        callHistory: readonly(callHistory) as Ref<CallHistoryEntry[]>,
        currentCallDuration: readonly(currentCallDuration) as Ref<number>,
        startCall,
        endCall,
        answerCall,
        rejectCall,
        isReady: readonly(isReady) as Ref<boolean>,
        connectionStatus: readonly(connectionStatus) as Ref<ConnectionStatus>,
        incomingCall: readonly(incomingCall) as Ref<IncomingCallInfo | null>,
    };

    // Provide context to children
    provide(PhoneKey, contextValue);

    return contextValue;
}

/**
 * Composable to access phone functionality from child components.
 * Must be used within a component that has called usePhoneProvider.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePhone } from '@tbisoftware/phone/vue';
 *
 * const { status, callNumber, startCall, endCall } = usePhone();
 * </script>
 * ```
 */
export function usePhone(): PhoneContextValue {
    const context = inject(PhoneKey);
    if (!context) {
        throw new Error('usePhone must be used within a component that has called usePhoneProvider');
    }
    return context;
}
