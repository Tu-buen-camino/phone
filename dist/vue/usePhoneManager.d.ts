import { ref, readonly } from 'vue';
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
    status: ReturnType<typeof readonly<ReturnType<typeof ref<PhoneStatus>>>>;
    /** Current phone number being called or in the input */
    callNumber: ReturnType<typeof ref<string>>;
    /** Set the phone number */
    setCallNumber: (number: string) => void;
    /** Call history */
    callHistory: ReturnType<typeof readonly<ReturnType<typeof ref<CallHistoryEntry[]>>>>;
    /** Clear call history */
    clearCallHistory: () => void;
    /** Current call duration in seconds */
    currentCallDuration: ReturnType<typeof readonly<ReturnType<typeof ref<number>>>>;
    /** Start a call to the given number */
    startCall: (number: string) => void;
    /** End the current call */
    endCall: () => void;
    /** Whether the phone is registered and ready to make calls */
    isReady: ReturnType<typeof readonly<ReturnType<typeof ref<boolean>>>>;
    /** Current connection status */
    connectionStatus: ReturnType<typeof readonly<ReturnType<typeof ref<ConnectionStatus>>>>;
    /** The raw JsSIP UA instance (for advanced usage) */
    ua: ReturnType<typeof ref<any>>;
}
/**
 * Vue composable to manage a SIP phone connection.
 * This composable wraps the framework-agnostic PhoneManager class.
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePhoneManager } from '@tbisoftware/phone/vue';
 *
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
 * </script>
 * ```
 */
export declare function usePhoneManager(config: PhoneConfig, options?: UsePhoneManagerOptions): UsePhoneManagerReturn;
export default usePhoneManager;
//# sourceMappingURL=usePhoneManager.d.ts.map