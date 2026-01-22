import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry } from '../types';

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
}

// Single global UA instance
let globalUA: UAInstance | null = null;
let currentConfigKey: string | null = null;

function getConfigKey(config: PhoneConfig): string {
    return `${config.websocketUrl}|${config.sipUri}|${config.authorizationUser}`;
}

function initializeUA(config: PhoneConfig): UAInstance {
    const configKey = getConfigKey(config);

    // If already initialized with same config, return existing
    if (globalUA && currentConfigKey === configKey) {
        return globalUA;
    }

    // If different config, stop existing UA
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

    // Set up UA event handlers that notify all listeners
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
                var audio = document.createElement('audio');
                if (e.streams === undefined) return;
                if (e.streams.length === 0) return;
                audio.srcObject = e.streams[0];
                audio.play();
            });

            session.connection.addEventListener('track', (e: any) => {
                var audio = document.createElement('audio');
                audio.srcObject = e.streams[0];
                audio.play();
            });
        }
    });

    globalUA = instance;

    return instance;
}

function startUA(instance: UAInstance): void {
    if (!instance.isStarted) {
        instance.ua.start();
        instance.isStarted = true;
    }
}

function addListener(instance: UAInstance, listener: UAEventListener): void {
    instance.listeners.add(listener);
}

function removeListener(instance: UAInstance, listener: UAEventListener): void {
    instance.listeners.delete(listener);
}

function getUAState(instance: UAInstance): { isReady: boolean; isConnected: boolean } {
    return {
        isReady: instance.ua.isRegistered(),
        isConnected: instance.ua.isConnected(),
    };
}

// ============================================
// React Context and Provider
// ============================================

interface PhoneContextValue {
    status: PhoneStatus;
    callNumber: string;
    setCallNumber: (number: string) => void;
    callHistory: CallHistoryEntry[];
    currentCallDuration: number;
    startCall: (number: string) => void;
    endCall: () => void;
    isReady: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
    isInitialized: boolean;
    initialize: () => void;
}

const PhoneContext = createContext<PhoneContextValue | null>(null);

interface PhoneProviderProps {
    config: PhoneConfig;
    children: React.ReactNode;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
}

export function PhoneProvider({
    config,
    children,
    onCallStart,
    onCallEnd,
    onStatusChange
}: PhoneProviderProps) {
    const [callNumber, setCallNumber] = useState('');
    const [status, setStatus] = useState<PhoneStatus>('disconnected');
    const [callStartedTS, setCallStartedTS] = useState<number | null>(null);
    const [currentCallDuration, setCurrentCallDuration] = useState(0);
    const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');
    const [isInitialized, setIsInitialized] = useState(false);

    const currentSessionRef = useRef<any>(null);
    const callStartedTSRef = useRef<number | null>(null);
    const uaInstanceRef = useRef<UAInstance | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        callStartedTSRef.current = callStartedTS;
    }, [callStartedTS]);

    // Initialize function to start the UA
    const initialize = useCallback(() => {
        if (isInitialized) return;
        setIsInitialized(true);
        setConnectionStatus('connecting');
    }, [isInitialized]);

    // Initialize UA (outside of React lifecycle)
    useEffect(() => {
        // Only initialize if the user has clicked the power button
        if (!isInitialized) return;

        // Initialize or get existing UA
        const instance = initializeUA(config);
        uaInstanceRef.current = instance;

        // Check current state
        const state = getUAState(instance);
        if (state.isReady) {
            setIsReady(true);
            setConnectionStatus('connected');
        } else if (state.isConnected) {
            setConnectionStatus('connected');
        }

        // Create listener for this component instance
        const listener: UAEventListener = {
            onConnecting: () => setConnectionStatus('connecting'),
            onConnected: () => setConnectionStatus('connected'),
            onDisconnected: () => {
                setConnectionStatus('disconnected');
                setIsReady(false);
            },
            onRegistered: () => {
                setIsReady(true);
                setConnectionStatus('connected');
            },
            onUnregistered: () => setIsReady(false),
            onRegistrationFailed: (cause) => {
                console.error('Registration failed:', cause);
                setIsReady(false);
                setConnectionStatus('failed');
            },
            onNewSession: (session) => {
                currentSessionRef.current = session;
            },
        };

        addListener(instance, listener);
        startUA(instance);

        return () => {
            removeListener(instance, listener);
            // Don't stop the UA on unmount - it's global
        };
    }, [isInitialized, config.websocketUrl, config.sipUri, config.password, config.registrarServer, config.displayName, config.authorizationUser]);

    // Notify status changes
    useEffect(() => {
        onStatusChange?.(status);
    }, [status, onStatusChange]);

    // Load call history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('tbi-phone-call-history');
        if (savedHistory) {
            try {
                setCallHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Error loading call history', e);
            }
        }
    }, []);

    // Save call history to localStorage
    useEffect(() => {
        if (callHistory.length > 0) {
            localStorage.setItem('tbi-phone-call-history', JSON.stringify(callHistory));
        }
    }, [callHistory]);

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

    const endCall = useCallback(() => {
        if (currentSessionRef.current) {
            currentSessionRef.current.terminate();
            currentSessionRef.current = null;
        }
    }, []);

    const startCall = useCallback((number: string) => {
        const instance = uaInstanceRef.current;
        if (!number.trim() || !instance) return;

        // Check if UA is ready (registered)
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
                // Use ref to get current timestamp value
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

        const options = {
            eventHandlers,
            mediaConstraints: { audio: true, video: false },
        };

        setStatus('progress');

        try {
            const session = instance.ua.call(number, options);
            currentSessionRef.current = session;
        } catch (error) {
            console.error('Failed to start call:', error);
            setStatus('failed');
            addToHistory(number, 0, 'failed');
            setTimeout(() => setStatus('disconnected'), 3000);
        }
    }, [addToHistory, onCallStart, onCallEnd, isReady]);

    const value: PhoneContextValue = {
        status,
        callNumber,
        setCallNumber,
        callHistory,
        currentCallDuration,
        startCall,
        endCall,
        isReady,
        connectionStatus,
        isInitialized,
        initialize,
    };

    return (
        <PhoneContext.Provider value={value}>
            {children}
        </PhoneContext.Provider>
    );
}

export function usePhone() {
    const context = useContext(PhoneContext);
    if (!context) {
        throw new Error('usePhone must be used within a PhoneProvider');
    }
    return context;
}
