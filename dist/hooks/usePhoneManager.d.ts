import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry } from '../types';
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
export declare function usePhoneManager(config: PhoneConfig, options?: UsePhoneManagerOptions): UsePhoneManagerReturn;
export default usePhoneManager;
//# sourceMappingURL=usePhoneManager.d.ts.map