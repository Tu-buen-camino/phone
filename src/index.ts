// Main exports
export { default as Phone } from './components/phone';
export { PhoneProvider, usePhone } from './context/PhoneContext';

// Types
export type { PhoneProps, CallHistoryEntry, PhoneStatus, PhoneConfig } from './types';

// Utilities
export { formatDuration } from './utils/formatDuration';
