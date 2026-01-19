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
    
    const uaRef = useRef<JsSIP.UA | null>(null);
    const currentSessionRef = useRef<any>(null);

    // Initialize JsSIP UA
    useEffect(() => {
        const socket = new JsSIP.WebSocketInterface(config.websocketUrl);
        const uaConfig = {
            sockets: [socket],
            uri: config.sipUri,
            password: config.password,
            registrar_server: config.registrarServer,
            display_name: config.displayName,
            authorization_user: config.authorizationUser,
        };

        const ua = new JsSIP.UA(uaConfig);
        uaRef.current = ua;

        ua.on('registered', () => setIsReady(true));
        ua.on('unregistered', () => setIsReady(false));
        ua.on('registrationFailed', () => setIsReady(false));

        ua.start();

        return () => {
            ua.stop();
        };
    }, [config]);

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

        setCallNumber(number);
        onCallStart?.(number);

        const eventHandlers = {
            progress: () => {
                setStatus('progress');
            },
            failed: () => {
                setStatus('failed');
                addToHistory(number, 0, 'failed');
                onCallEnd?.(number, 0, 'failed');
                endCall();
                setTimeout(() => setStatus('disconnected'), 3000);
            },
            ended: () => {
                setStatus('ended');
                const duration = callStartedTS ? Math.floor((Date.now() - callStartedTS) / 1000) : 0;
                addToHistory(number, duration, 'completed');
                onCallEnd?.(number, duration, 'completed');
                endCall();
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

        uaRef.current.on('newRTCSession', (data: any) => {
            const dataSession = data.session;
            currentSessionRef.current = dataSession;

            if (dataSession.connection) {
                dataSession.connection.addEventListener('addstream', (e: any) => {
                    if (!e.streams?.length) return;
                    const audio = document.createElement('audio');
                    audio.srcObject = e.streams[0];
                    audio.play();
                });

                dataSession.connection.addEventListener('track', (e: any) => {
                    const audio = document.createElement('audio');
                    audio.srcObject = e.streams[0];
                    audio.play();
                });
            }
        });

        setStatus('progress');
        const session = uaRef.current.call(number, options);
        currentSessionRef.current = session;
    }, [addToHistory, endCall, onCallStart, onCallEnd, callStartedTS]);

    const value: PhoneContextValue = {
        status,
        callNumber,
        setCallNumber,
        callHistory,
        currentCallDuration,
        startCall,
        endCall,
        isReady,
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
