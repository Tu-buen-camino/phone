import JsSIP from 'jssip';
import type { PhoneConfig, PhoneStatus, CallHistoryEntry, ConnectionStatus } from '../types';
export interface PhoneManagerEvents {
    onConnecting?: () => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onRegistered?: () => void;
    onUnregistered?: () => void;
    onRegistrationFailed?: (cause?: string) => void;
    onStatusChange?: (status: PhoneStatus) => void;
    onConnectionChange?: (status: ConnectionStatus) => void;
    onCallStart?: (number: string) => void;
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    onDurationUpdate?: (duration: number) => void;
    onHistoryUpdate?: (history: CallHistoryEntry[]) => void;
}
export interface PhoneManagerState {
    status: PhoneStatus;
    callNumber: string;
    callHistory: CallHistoryEntry[];
    currentCallDuration: number;
    isReady: boolean;
    connectionStatus: ConnectionStatus;
}
export interface PhoneManagerOptions {
    persistHistory?: boolean;
    historyKey?: string;
    maxHistoryItems?: number;
}
/**
 * Framework-agnostic Phone Manager class.
 * Handles all SIP communication logic and can be used with any UI framework.
 */
export declare class PhoneManager {
    private config;
    private uaInstance;
    private currentSession;
    private callStartedTS;
    private durationInterval;
    private startCallEventListener;
    private _state;
    private events;
    private options;
    private listener;
    constructor(config: PhoneConfig, events?: PhoneManagerEvents, options?: PhoneManagerOptions);
    /**
     * Get the current state
     */
    get state(): Readonly<PhoneManagerState>;
    /**
     * Get the raw JsSIP UA instance (for advanced usage)
     */
    get ua(): JsSIP.UA | null;
    /**
     * Initialize and start the phone manager
     */
    initialize(): void;
    /**
     * Cleanup and destroy the phone manager
     */
    destroy(): void;
    /**
     * Set the call number
     */
    setCallNumber(number: string): void;
    /**
     * Start a call to the given number
     */
    startCall(number: string): void;
    /**
     * End the current call
     */
    endCall(): void;
    /**
     * Clear the call history
     */
    clearHistory(): void;
    /**
     * Update events handlers
     */
    setEvents(events: Partial<PhoneManagerEvents>): void;
    private updateState;
    private loadHistory;
    private saveHistory;
    private addToHistory;
    private startDurationTimer;
    private stopDurationTimer;
}
export default PhoneManager;
//# sourceMappingURL=PhoneManager.d.ts.map