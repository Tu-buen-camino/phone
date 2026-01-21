import { ref, onMounted, onUnmounted, readonly, watch } from 'vue';
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

    const status = ref<PhoneStatus>('disconnected');
    const callNumber = ref('');
    const callHistory = ref<CallHistoryEntry[]>([]);
    const currentCallDuration = ref(0);
    const isReady = ref(false);
    const connectionStatus = ref<ConnectionStatus>('connecting');
    const ua = ref<any>(null);

    let manager: PhoneManager | null = null;

    onMounted(() => {
        manager = new PhoneManager(
            config,
            {
                onStatusChange: (newStatus) => {
                    status.value = newStatus;
                    onStatusChange?.(newStatus);
                },
                onConnectionChange: (newStatus) => {
                    connectionStatus.value = newStatus;
                    if (manager) {
                        isReady.value = manager.state.isReady;
                    }
                    onConnectionChange?.(newStatus);
                },
                onCallStart,
                onCallEnd,
                onDurationUpdate: (duration) => {
                    currentCallDuration.value = duration;
                },
                onHistoryUpdate: (history) => {
                    callHistory.value = history;
                },
                onRegistered: () => {
                    isReady.value = true;
                },
                onUnregistered: () => {
                    isReady.value = false;
                },
            },
            {
                persistHistory,
                historyKey,
            }
        );

        manager.initialize();

        // Sync initial state
        status.value = manager.state.status;
        callNumber.value = manager.state.callNumber;
        callHistory.value = manager.state.callHistory;
        isReady.value = manager.state.isReady;
        connectionStatus.value = manager.state.connectionStatus;
        ua.value = manager.ua;
    });

    onUnmounted(() => {
        if (manager) {
            manager.destroy();
            manager = null;
        }
    });

    const setCallNumber = (number: string) => {
        callNumber.value = number;
        manager?.setCallNumber(number);
    };

    const startCall = (number: string) => {
        manager?.startCall(number);
    };

    const endCall = () => {
        manager?.endCall();
    };

    const clearCallHistory = () => {
        manager?.clearHistory();
        callHistory.value = [];
    };

    return {
        status: readonly(status),
        callNumber,
        setCallNumber,
        callHistory: readonly(callHistory),
        clearCallHistory,
        currentCallDuration: readonly(currentCallDuration),
        startCall,
        endCall,
        isReady: readonly(isReady),
        connectionStatus: readonly(connectionStatus),
        ua,
    };
}

export default usePhoneManager;
