// Core exports - Framework agnostic
export { PhoneManager } from './PhoneManager';
export type {
    PhoneManagerEvents,
    PhoneManagerState,
    PhoneManagerOptions,
} from './PhoneManager';

// Re-export types
export type {
    PhoneConfig,
    PhoneStatus,
    ConnectionStatus,
    CallHistoryEntry,
    PhoneLabels,
} from '../types';

export { defaultLabels } from '../types';

// Re-export utilities
export { formatDuration } from '../utils/formatDuration';
export { cn } from '../utils/cn';
