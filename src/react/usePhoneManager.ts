import { useState, useEffect, useCallback, useRef } from 'react';
import { PhoneManager } from '../core/PhoneManager';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, ConnectionStatus } from '../types';

export type { ConnectionStatus };

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
    ua: any | null;
}

/**
 * React hook to manage a SIP phone connection.
 * This hook wraps the framework-agnostic PhoneManager class.
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

    const [status, setStatus] = useState<PhoneStatus>('disconnected');
    const [callNumber, setCallNumber] = useState('');
    const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
    const [currentCallDuration, setCurrentCallDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

    const managerRef = useRef<PhoneManager | null>(null);

    // Initialize PhoneManager
    useEffect(() => {
        const manager = new PhoneManager(
            config,
            {
                onStatusChange: (newStatus) => {
                    setStatus(newStatus);
                    onStatusChange?.(newStatus);
                },
                onConnectionChange: (newStatus) => {
                    setConnectionStatus(newStatus);
                    if (newStatus === 'connected' || newStatus === 'disconnected' || newStatus === 'failed') {
                        setIsReady(manager.state.isReady);
                    }
                    onConnectionChange?.(newStatus);
                },
                onCallStart,
                onCallEnd,
                onDurationUpdate: setCurrentCallDuration,
                onHistoryUpdate: setCallHistory,
                onRegistered: () => setIsReady(true),
                onUnregistered: () => setIsReady(false),
            },
            {
                persistHistory,
                historyKey,
            }
        );

        manager.initialize();
        managerRef.current = manager;

        // Sync initial state
        setStatus(manager.state.status);
        setCallNumber(manager.state.callNumber);
        setCallHistory(manager.state.callHistory);
        setIsReady(manager.state.isReady);
        setConnectionStatus(manager.state.connectionStatus);

        return () => {
            manager.destroy();
            managerRef.current = null;
        };
    }, [
        config.websocketUrl,
        config.sipUri,
        config.password,
        config.registrarServer,
        config.displayName,
        config.authorizationUser,
        persistHistory,
        historyKey,
    ]);

    // Update callbacks when they change
    useEffect(() => {
        if (managerRef.current) {
            managerRef.current.setEvents({
                onCallStart,
                onCallEnd,
                onStatusChange: (newStatus) => {
                    setStatus(newStatus);
                    onStatusChange?.(newStatus);
                },
                onConnectionChange: (newStatus) => {
                    setConnectionStatus(newStatus);
                    onConnectionChange?.(newStatus);
                },
            });
        }
    }, [onCallStart, onCallEnd, onStatusChange, onConnectionChange]);

    const handleSetCallNumber = useCallback((number: string) => {
        setCallNumber(number);
        managerRef.current?.setCallNumber(number);
    }, []);

    const startCall = useCallback((number: string) => {
        managerRef.current?.startCall(number);
    }, []);

    const endCall = useCallback(() => {
        managerRef.current?.endCall();
    }, []);

    const clearCallHistory = useCallback(() => {
        managerRef.current?.clearHistory();
        setCallHistory([]);
    }, []);

    return {
        status,
        callNumber,
        setCallNumber: handleSetCallNumber,
        callHistory,
        clearCallHistory,
        currentCallDuration,
        startCall,
        endCall,
        isReady,
        connectionStatus,
        ua: managerRef.current?.ua ?? null,
    };
}

export default usePhoneManager;
