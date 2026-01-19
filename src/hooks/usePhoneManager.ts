import { useState, useEffect, useCallback, useRef } from 'react';
import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry } from '../types';

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
// Types for the hook
// ============================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface UsePhoneManagerOptions {
    /** Callback when a call starts */
    onCallStart?: (number: string) => void;
    /** Callback when a call ends */
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    /** Callback when call status changes */
    onStatusChange?: (status: PhoneStatus) => void;
    /** Callback when connection status changes */
    onConnectionChange?: (status: ConnectionStatus) => void;
    /** Enable call history persistence in localStorage */
    persistHistory?: boolean;
    /** localStorage key for call history */
    historyKey?: string;
}

export interface UsePhoneManagerReturn {
    /** Current call status */
    status: PhoneStatus;
    /** Current phone number being called or in the input */
    callNumber: string;
    /** Set the phone number */
    setCallNumber: (number: string) => void;
    /** Call history */
    callHistory: CallHistoryEntry[];
    /** Clear call history */
    clearCallHistory: () => void;
    /** Current call duration in seconds */
    currentCallDuration: number;
    /** Start a call to the given number */
    startCall: (number: string) => void;
    /** End the current call */
    endCall: () => void;
    /** Whether the phone is registered and ready to make calls */
    isReady: boolean;
    /** Current connection status */
    connectionStatus: ConnectionStatus;
    /** The raw JsSIP UA instance (for advanced usage) */
    ua: JsSIP.UA | null;
}

/**
 * Hook to manage a SIP phone connection.
 * This hook manages the JsSIP User Agent and provides all the necessary
 * state and functions to build your own phone UI.
 * 
 * @example
 * ```tsx
 * const {
 *   status,
 *   callNumber,
 *   setCallNumber,
 *   startCall,
 *   endCall,
 *   isReady,
 *   connectionStatus,
 * } = usePhoneManager({
 *   websocketUrl: 'wss://sip-server.com:8989',
 *   sipUri: 'sip:user@domain.com',
 *   password: 'password',
 *   registrarServer: 'sip:domain.com',
 *   displayName: 'User',
 *   authorizationUser: 'user',
 * });
 * ```
 */
export function usePhoneManager(
    config: PhoneConfig,
    options: UsePhoneManagerOptions = {}
): UsePhoneManagerReturn {
    const {
        onCallStart,
        onCallEnd,
        onStatusChange,
        onConnectionChange,
        persistHistory = true,
        historyKey = 'tbi-phone-call-history',
    } = options;

    const [callNumber, setCallNumber] = useState('');
    const [status, setStatus] = useState<PhoneStatus>('disconnected');
    const [callStartedTS, setCallStartedTS] = useState<number | null>(null);
    const [currentCallDuration, setCurrentCallDuration] = useState(0);
    const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

    const currentSessionRef = useRef<any>(null);
    const callStartedTSRef = useRef<number | null>(null);
    const uaInstanceRef = useRef<UAInstance | null>(null);

    // Keep refs in sync
    useEffect(() => {
        callStartedTSRef.current = callStartedTS;
    }, [callStartedTS]);

    // Initialize UA
    useEffect(() => {
        const instance = getOrCreateUA(config);
        uaInstanceRef.current = instance;

        // Check current state
        if (instance.ua.isRegistered()) {
            setIsReady(true);
            setConnectionStatus('connected');
        } else if (instance.ua.isConnected()) {
            setConnectionStatus('connected');
        }

        const listener: UAEventListener = {
            onConnecting: () => {
                setConnectionStatus('connecting');
                onConnectionChange?.('connecting');
            },
            onConnected: () => {
                setConnectionStatus('connected');
                onConnectionChange?.('connected');
            },
            onDisconnected: () => {
                setConnectionStatus('disconnected');
                setIsReady(false);
                onConnectionChange?.('disconnected');
            },
            onRegistered: () => {
                setIsReady(true);
                setConnectionStatus('connected');
                onConnectionChange?.('connected');
            },
            onUnregistered: () => setIsReady(false),
            onRegistrationFailed: (cause) => {
                console.error('Registration failed:', cause);
                setIsReady(false);
                setConnectionStatus('failed');
                onConnectionChange?.('failed');
            },
            onNewSession: (session) => {
                currentSessionRef.current = session;
            },
        };

        instance.listeners.add(listener);

        if (!instance.isStarted) {
            instance.ua.start();
            instance.isStarted = true;
        }

        return () => {
            instance.listeners.delete(listener);
        };
    }, [config.websocketUrl, config.sipUri, config.password, config.registrarServer, config.displayName, config.authorizationUser, onConnectionChange]);

    // Notify status changes
    useEffect(() => {
        onStatusChange?.(status);
    }, [status, onStatusChange]);

    // Load call history from localStorage
    useEffect(() => {
        if (!persistHistory) return;
        
        const savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
            try {
                setCallHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Error loading call history', e);
            }
        }
    }, [persistHistory, historyKey]);

    // Save call history to localStorage
    useEffect(() => {
        if (!persistHistory) return;
        
        if (callHistory.length > 0) {
            localStorage.setItem(historyKey, JSON.stringify(callHistory));
        }
    }, [callHistory, persistHistory, historyKey]);

    // Update call duration timer
    useEffect(() => {
        if (status === 'confirmed' && callStartedTS) {
            const interval = setInterval(() => {
                setCurrentCallDuration(Math.floor((Date.now() - callStartedTS) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCurrentCallDuration(0);
        }
    }, [status, callStartedTS]);

    // Listen for external StartCallEvent
    useEffect(() => {
        const handleStartCallEvent = (event: CustomEvent) => {
            const numberToCall = event.detail.number;
            if (status === 'disconnected') {
                startCall(numberToCall);
            }
        };
        window.addEventListener('StartCallEvent', handleStartCallEvent as EventListener);
        return () => {
            window.removeEventListener('StartCallEvent', handleStartCallEvent as EventListener);
        };
    }, [status]);

    const addToHistory = useCallback((number: string, duration: number, callStatus: 'completed' | 'failed' | 'missed') => {
        const entry: CallHistoryEntry = {
            id: Date.now().toString(),
            number,
            timestamp: Date.now(),
            duration,
            status: callStatus,
        };
        setCallHistory(prev => [entry, ...prev].slice(0, 50));
    }, []);

    const clearCallHistory = useCallback(() => {
        setCallHistory([]);
        if (persistHistory) {
            localStorage.removeItem(historyKey);
        }
    }, [persistHistory, historyKey]);

    const endCall = useCallback(() => {
        if (currentSessionRef.current) {
            currentSessionRef.current.terminate();
            currentSessionRef.current = null;
        }
    }, []);

    const startCall = useCallback((number: string) => {
        const instance = uaInstanceRef.current;
        if (!number.trim() || !instance) return;

        if (!isReady) {
            console.warn('Phone is not ready yet. Please wait for registration.');
            return;
        }

        setCallNumber(number);
        onCallStart?.(number);

        const eventHandlers = {
            progress: () => {
                setStatus('progress');
            },
            failed: (e: any) => {
                console.error('Call failed:', e?.cause);
                setStatus('failed');
                addToHistory(number, 0, 'failed');
                onCallEnd?.(number, 0, 'failed');
                currentSessionRef.current = null;
                setTimeout(() => setStatus('disconnected'), 3000);
            },
            ended: () => {
                setStatus('ended');
                const startTS = callStartedTSRef.current;
                const duration = startTS ? Math.floor((Date.now() - startTS) / 1000) : 0;
                addToHistory(number, duration, 'completed');
                onCallEnd?.(number, duration, 'completed');
                currentSessionRef.current = null;
                setTimeout(() => {
                    setStatus('disconnected');
                    setCallStartedTS(null);
                }, 2000);
            },
            confirmed: () => {
                setStatus('confirmed');
                setCallStartedTS(Date.now());
            },
        };

        const callOptions = {
            eventHandlers,
            mediaConstraints: { audio: true, video: false },
        };

        setStatus('progress');

        try {
            const session = instance.ua.call(number, callOptions);
            currentSessionRef.current = session;
        } catch (error) {
            console.error('Failed to start call:', error);
            setStatus('failed');
            addToHistory(number, 0, 'failed');
            setTimeout(() => setStatus('disconnected'), 3000);
        }
    }, [addToHistory, onCallStart, onCallEnd, isReady]);

    return {
        status,
        callNumber,
        setCallNumber,
        callHistory,
        clearCallHistory,
        currentCallDuration,
        startCall,
        endCall,
        isReady,
        connectionStatus,
        ua: uaInstanceRef.current?.ua ?? null,
    };
}

export default usePhoneManager;
