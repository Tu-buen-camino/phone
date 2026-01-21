import type { InjectionKey, Ref } from 'vue';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, ConnectionStatus } from '../types';
export interface PhoneContextValue {
    status: Ref<PhoneStatus>;
    callNumber: Ref<string>;
    setCallNumber: (number: string) => void;
    callHistory: Ref<CallHistoryEntry[]>;
    currentCallDuration: Ref<number>;
    startCall: (number: string) => void;
    endCall: () => void;
    isReady: Ref<boolean>;
    connectionStatus: Ref<ConnectionStatus>;
}
export declare const PhoneKey: InjectionKey<PhoneContextValue>;
export interface UsePhoneProviderOptions {
    config: PhoneConfig;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
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
export declare function usePhoneProvider(options: UsePhoneProviderOptions): PhoneContextValue;
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
export declare function usePhone(): PhoneContextValue;
//# sourceMappingURL=usePhone.d.ts.map