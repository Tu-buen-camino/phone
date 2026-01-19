import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry } from '../types';

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
}

const PhoneContext = createContext<PhoneContextValue | null>(null);

interface PhoneProviderProps {
    config: PhoneConfig;
    children: React.ReactNode;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
}

// Singleton map to store UA instances by config key
const uaInstances = new Map<string, {
    ua: JsSIP.UA;
    refCount: number;
    audio: HTMLAudioElement | null;
}>();

function getConfigKey(config: PhoneConfig): string {
    return `${config.websocketUrl}|${config.sipUri}|${config.authorizationUser}`;
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

    const uaRef = useRef<JsSIP.UA | null>(null);
    const currentSessionRef = useRef<any>(null);
    const callStartedTSRef = useRef<number | null>(null);
    const configKeyRef = useRef<string>('');

    // Keep ref in sync with state
    useEffect(() => {
        callStartedTSRef.current = callStartedTS;
    }, [callStartedTS]);

    // Initialize JsSIP UA with singleton pattern
    useEffect(() => {
        const configKey = getConfigKey(config);
        configKeyRef.current = configKey;

        let instance = uaInstances.get(configKey);

        if (instance) {
            // Reuse existing instance
            instance.refCount++;
            uaRef.current = instance.ua;

            // Check current state
            if (instance.ua.isRegistered()) {
                setIsReady(true);
                setConnectionStatus('connected');
            } else if (instance.ua.isConnected()) {
                setConnectionStatus('connected');
            }
        } else {
            // Create new instance
            setConnectionStatus('connecting');

            try {
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

                instance = { ua, refCount: 1, audio };
                uaInstances.set(configKey, instance);
                uaRef.current = ua;

                ua.on('connecting', () => {
                    setConnectionStatus('connecting');
                });

                ua.on('connected', () => {
                    setConnectionStatus('connected');
                });

                ua.on('disconnected', () => {
                    setConnectionStatus('disconnected');
                    setIsReady(false);
                });

                ua.on('registered', () => {
                    setIsReady(true);
                    setConnectionStatus('connected');
                });

                ua.on('unregistered', () => {
                    setIsReady(false);
                });

                ua.on('registrationFailed', (e: any) => {
                    console.error('Registration failed:', e?.cause);
                    setIsReady(false);
                    setConnectionStatus('failed');
                });

                ua.on('newRTCSession', (data: any) => {
                    const session = data.session;

                    if (session.direction !== 'outgoing') return;

                    currentSessionRef.current = session;

                    session.on('peerconnection', () => {
                        session.connection.addEventListener('track', (e: RTCTrackEvent) => {
                            if (e.streams && e.streams[0]) {
                                const inst = uaInstances.get(configKey);
                                if (inst?.audio) {
                                    inst.audio.srcObject = e.streams[0];
                                    inst.audio.play().catch(console.error);
                                }
                            }
                        });
                    });
                });

                ua.start();
            } catch (error) {
                console.error('Failed to create JsSIP UA:', error);
                setConnectionStatus('failed');
                return;
            }
        }

        return () => {
            const key = configKeyRef.current;
            const inst = uaInstances.get(key);

            if (inst) {
                inst.refCount--;

                // Only cleanup when no more references
                if (inst.refCount <= 0) {
                    if (inst.audio) {
                        inst.audio.srcObject = null;
                    }
                    try {
                        inst.ua.stop();
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                    uaInstances.delete(key);
                }
            }

            uaRef.current = null;
        };
    }, [config.websocketUrl, config.sipUri, config.password, config.registrarServer, config.displayName, config.authorizationUser]);

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
        if (!number.trim() || !uaRef.current) return;

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
            const session = uaRef.current.call(number, options);
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
