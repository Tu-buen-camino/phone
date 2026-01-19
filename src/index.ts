// Main exports
export { default as Phone } from './components/phone';
export { PhoneProvider, usePhone } from './context/PhoneContext';

// Hooks for custom implementations
export { usePhoneManager } from './hooks/usePhoneManager';
export type { UsePhoneManagerOptions, UsePhoneManagerReturn, ConnectionStatus } from './hooks/usePhoneManager';

// Types
export type { PhoneProps, CallHistoryEntry, PhoneStatus, PhoneConfig, PhoneLabels } from './types';

// Utilities
export { formatDuration } from './utils/formatDuration';
export { cn } from './utils/cn';
