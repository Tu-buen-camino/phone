// Main entry point - exports React components by default for backward compatibility
// For Vue, use: import { Phone } from '@tbisoftware/phone/vue'
// For core only, use: import { PhoneManager } from '@tbisoftware/phone/core'

// React exports (default for backward compatibility)
export { Phone, PhoneProvider, usePhone, usePhoneManager } from './react';
export type { UsePhoneManagerOptions, UsePhoneManagerReturn, ConnectionStatus } from './react';

// Re-export types for convenience
export type {
    PhoneProps,
    PhoneConfig,
    PhoneStatus,
    CallHistoryEntry,
    PhoneLabels,
} from './types';

export { defaultLabels } from './types';

// Utilities
export { formatDuration } from './utils/formatDuration';
export { cn } from './utils/cn';

// Default export is the React Phone component
import { Phone } from './react';
export default Phone;
