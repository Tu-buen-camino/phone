import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, ConnectionStatus } from '../types';

// ============================================
// Types
// ============================================

export interface PhoneManagerEvents {
    onConnecting?: () => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onRegistered?: () => void;
    onUnregistered?: () => void;
    onRegistrationFailed?: (cause?: string) => void;
    onStatusChange?: (status: PhoneStatus) => void;
    onConnectionChange?: (status: ConnectionStatus) => void;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onDurationUpdate?: (duration: number) => void;
    onHistoryUpdate?: (history: CallHistoryEntry[]) => void;
}

export interface PhoneManagerState {
    status: PhoneStatus;
    callNumber: string;
    callHistory: CallHistoryEntry[];
    currentCallDuration: number;
    isReady: boolean;
    connectionStatus: ConnectionStatus;
}

export interface PhoneManagerOptions {
    persistHistory?: boolean;
    historyKey?: string;
    maxHistoryItems?: number;
}

// ============================================
// UA Manager - Singleton pattern
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
}

// Single global UA instance
let globalUA: UAInstance | null = null;
let currentConfigKey: string | null = null;

function getConfigKey(config: PhoneConfig): string {
    return `${config.websocketUrl}|${config.sipUri}|${config.authorizationUser}`;
}

function createUAInstance(config: PhoneConfig): UAInstance {
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

    // Set up UA event handlers
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

        if (session.direction !== 'outgoing') return;

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

    return instance;
}

function getOrCreateUA(config: PhoneConfig): UAInstance {
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
    globalUA = createUAInstance(config);

    return globalUA;
}

// ============================================
// PhoneManager Class
// ============================================

/**
 * Framework-agnostic Phone Manager class.
 * Handles all SIP communication logic and can be used with any UI framework.
 */
export class PhoneManager {
    private uaInstance: UAInstance | null = null;
    private currentSession: any = null;
    private callStartedTS: number | null = null;
    private durationInterval: ReturnType<typeof setInterval> | null = null;
    private startCallEventListener: ((event: Event) => void) | null = null;

    private _state: PhoneManagerState = {
        status: 'disconnected',
        callNumber: '',
        callHistory: [],
        currentCallDuration: 0,
        isReady: false,
        connectionStatus: 'connecting',
    };

    private events: PhoneManagerEvents = {};
    private options: Required<PhoneManagerOptions>;
    private listener: UAEventListener;

    constructor(
        private config: PhoneConfig,
        events: PhoneManagerEvents = {},
        options: PhoneManagerOptions = {}
    ) {
        this.events = events;
        this.options = {
            persistHistory: options.persistHistory ?? true,
            historyKey: options.historyKey ?? 'tbi-phone-call-history',
            maxHistoryItems: options.maxHistoryItems ?? 50,
        };

        this.listener = {
            onConnecting: () => {
                this.updateState({ connectionStatus: 'connecting' });
                this.events.onConnecting?.();
                this.events.onConnectionChange?.('connecting');
            },
            onConnected: () => {
                this.updateState({ connectionStatus: 'connected' });
                this.events.onConnected?.();
                this.events.onConnectionChange?.('connected');
            },
            onDisconnected: () => {
                this.updateState({ connectionStatus: 'disconnected', isReady: false });
                this.events.onDisconnected?.();
                this.events.onConnectionChange?.('disconnected');
            },
            onRegistered: () => {
                this.updateState({ isReady: true, connectionStatus: 'connected' });
                this.events.onRegistered?.();
                this.events.onConnectionChange?.('connected');
            },
            onUnregistered: () => {
                this.updateState({ isReady: false });
                this.events.onUnregistered?.();
            },
            onRegistrationFailed: (cause) => {
                console.error('Registration failed:', cause);
                this.updateState({ isReady: false, connectionStatus: 'failed' });
                this.events.onRegistrationFailed?.(cause);
                this.events.onConnectionChange?.('failed');
            },
            onNewSession: (session) => {
                this.currentSession = session;
            },
        };
    }

    /**
     * Get the current state
     */
    get state(): Readonly<PhoneManagerState> {
        return this._state;
    }

    /**
     * Get the raw JsSIP UA instance (for advanced usage)
     */
    get ua(): JsSIP.UA | null {
        return this.uaInstance?.ua ?? null;
    }

    /**
     * Initialize and start the phone manager
     */
    initialize(): void {
        // Initialize or get existing UA
        this.uaInstance = getOrCreateUA(this.config);

        // Check current state
        if (this.uaInstance.ua.isRegistered()) {
            this.updateState({ isReady: true, connectionStatus: 'connected' });
        } else if (this.uaInstance.ua.isConnected()) {
            this.updateState({ connectionStatus: 'connected' });
        }

        // Add listener
        this.uaInstance.listeners.add(this.listener);

        // Start UA if not started
        if (!this.uaInstance.isStarted) {
            this.uaInstance.ua.start();
            this.uaInstance.isStarted = true;
        }

        // Load history from localStorage
        this.loadHistory();

        // Listen for external StartCallEvent
        this.startCallEventListener = (event: Event) => {
            const customEvent = event as CustomEvent;
            const numberToCall = customEvent.detail.number;
            if (this._state.status === 'disconnected') {
                // If UA is not initialized or not ready, initialize first and wait for registration
                if (!this.uaInstance || !this._state.isReady) {
                    this.initializeAndCall(numberToCall);
                } else {
                    this.startCall(numberToCall);
                }
            }
        };
        window.addEventListener('StartCallEvent', this.startCallEventListener);
    }

    /**
     * Cleanup and destroy the phone manager
     */
    destroy(): void {
        // Remove listener
        if (this.uaInstance) {
            this.uaInstance.listeners.delete(this.listener);
        }

        // Remove event listener
        if (this.startCallEventListener) {
            window.removeEventListener('StartCallEvent', this.startCallEventListener);
            this.startCallEventListener = null;
        }

        // Stop duration interval
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
    }

    /**
     * Set the call number
     */
    setCallNumber(number: string): void {
        this.updateState({ callNumber: number });
    }

    /**
     * Start a call to the given number
     */
    startCall(number: string): void {
        if (!number.trim() || !this.uaInstance) return;

        if (!this._state.isReady) {
            console.warn('Phone is not ready yet. Please wait for registration.');
            return;
        }

        this.updateState({ callNumber: number });
        this.events.onCallStart?.(number);

        const eventHandlers = {
            progress: () => {
                this.updateState({ status: 'progress' });
                this.events.onStatusChange?.('progress');
            },
            failed: (e: any) => {
                console.error('Call failed:', e?.cause);
                this.updateState({ status: 'failed' });
                this.events.onStatusChange?.('failed');
                this.addToHistory(number, 0, 'failed');
                this.events.onCallEnd?.(number, 0, 'failed');
                this.currentSession = null;
                setTimeout(() => {
                    this.updateState({ status: 'disconnected' });
                    this.events.onStatusChange?.('disconnected');
                }, 3000);
            },
            ended: () => {
                this.updateState({ status: 'ended' });
                this.events.onStatusChange?.('ended');
                const duration = this.callStartedTS
                    ? Math.floor((Date.now() - this.callStartedTS) / 1000)
                    : 0;
                this.addToHistory(number, duration, 'completed');
                this.events.onCallEnd?.(number, duration, 'completed');
                this.currentSession = null;
                this.stopDurationTimer();
                setTimeout(() => {
                    this.updateState({ status: 'disconnected' });
                    this.events.onStatusChange?.('disconnected');
                    this.callStartedTS = null;
                }, 2000);
            },
            confirmed: () => {
                this.callStartedTS = Date.now();
                this.updateState({ status: 'confirmed' });
                this.events.onStatusChange?.('confirmed');
                this.startDurationTimer();
            },
        };

        const callOptions = {
            eventHandlers,
            mediaConstraints: { audio: true, video: false },
        };

        this.updateState({ status: 'progress' });
        this.events.onStatusChange?.('progress');

        try {
            const session = this.uaInstance.ua.call(number, callOptions);
            this.currentSession = session;
        } catch (error) {
            console.error('Failed to start call:', error);
            this.updateState({ status: 'failed' });
            this.events.onStatusChange?.('failed');
            this.addToHistory(number, 0, 'failed');
            setTimeout(() => {
                this.updateState({ status: 'disconnected' });
                this.events.onStatusChange?.('disconnected');
            }, 3000);
        }
    }

    /**
     * End the current call
     */
    endCall(): void {
        if (this.currentSession) {
            this.currentSession.terminate();
            this.currentSession = null;
        }
    }

    /**
     * Initialize the phone and start a call once registered
     */
    private initializeAndCall(number: string): void {
        // If already initialized and ready, just call
        if (this.uaInstance && this._state.isReady) {
            this.startCall(number);
            return;
        }

        // Initialize if not done yet
        if (!this.uaInstance) {
            this.uaInstance = getOrCreateUA(this.config);

            // Check current state
            if (this.uaInstance.ua.isRegistered()) {
                this.updateState({ isReady: true, connectionStatus: 'connected' });
            } else if (this.uaInstance.ua.isConnected()) {
                this.updateState({ connectionStatus: 'connected' });
            }

            // Add listener
            this.uaInstance.listeners.add(this.listener);

            // Load history from localStorage
            this.loadHistory();
        }

        // If already registered, start the call immediately
        if (this.uaInstance.ua.isRegistered()) {
            this.updateState({ isReady: true, connectionStatus: 'connected' });
            this.startCall(number);
            return;
        }

        // Create a one-time listener to wait for registration
        const pendingCallListener: UAEventListener = {
            onRegistered: () => {
                // Remove this temporary listener
                this.uaInstance?.listeners.delete(pendingCallListener);
                // Now start the call
                this.startCall(number);
            },
            onRegistrationFailed: (cause) => {
                console.error('Registration failed while trying to start call:', cause);
                this.uaInstance?.listeners.delete(pendingCallListener);
            },
        };

        this.uaInstance.listeners.add(pendingCallListener);

        // Start UA if not started
        if (!this.uaInstance.isStarted) {
            this.uaInstance.ua.start();
            this.uaInstance.isStarted = true;
        }
    }

    /**
     * Clear the call history
     */
    clearHistory(): void {
        this.updateState({ callHistory: [] });
        if (this.options.persistHistory) {
            localStorage.removeItem(this.options.historyKey);
        }
    }

    /**
     * Update events handlers
     */
    setEvents(events: Partial<PhoneManagerEvents>): void {
        this.events = { ...this.events, ...events };
    }

    // ============================================
    // Private methods
    // ============================================

    private updateState(partial: Partial<PhoneManagerState>): void {
        this._state = { ...this._state, ...partial };
    }

    private loadHistory(): void {
        if (!this.options.persistHistory) return;

        const savedHistory = localStorage.getItem(this.options.historyKey);
        if (savedHistory) {
            try {
                this.updateState({ callHistory: JSON.parse(savedHistory) });
            } catch (e) {
                console.error('Error loading call history', e);
            }
        }
    }

    private saveHistory(): void {
        if (!this.options.persistHistory) return;

        if (this._state.callHistory.length > 0) {
            localStorage.setItem(this.options.historyKey, JSON.stringify(this._state.callHistory));
        }
    }

    private addToHistory(number: string, duration: number, status: 'completed' | 'failed' | 'missed'): void {
        const entry: CallHistoryEntry = {
            id: Date.now().toString(),
            number,
            timestamp: Date.now(),
            duration,
            status,
        };
        const newHistory = [entry, ...this._state.callHistory].slice(0, this.options.maxHistoryItems);
        this.updateState({ callHistory: newHistory });
        this.saveHistory();
        this.events.onHistoryUpdate?.(newHistory);
    }

    private startDurationTimer(): void {
        this.stopDurationTimer();
        this.durationInterval = setInterval(() => {
            if (this.callStartedTS) {
                const duration = Math.floor((Date.now() - this.callStartedTS) / 1000);
                this.updateState({ currentCallDuration: duration });
                this.events.onDurationUpdate?.(duration);
            }
        }, 1000);
    }

    private stopDurationTimer(): void {
        if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
        }
        this.updateState({ currentCallDuration: 0 });
    }
}

export default PhoneManager;
