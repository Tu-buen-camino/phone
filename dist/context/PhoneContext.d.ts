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
interface PhoneProviderProps {
    config: PhoneConfig;
    children: React.ReactNode;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onStatusChange?: (status: PhoneStatus) => void;
}
export declare function PhoneProvider({ config, children, onCallStart, onCallEnd, onStatusChange }: PhoneProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function usePhone(): PhoneContextValue;
export {};
//# sourceMappingURL=PhoneContext.d.ts.map