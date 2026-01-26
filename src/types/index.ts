export interface CallHistoryEntry {
    id: string;
    number: string;
    timestamp: number;
    duration: number;
    status: 'completed' | 'failed' | 'missed';
}

export type PhoneStatus = 'disconnected' | 'progress' | 'confirmed' | 'failed' | 'ended' | 'ringing';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface PhoneConfig {
    /** WebSocket URL for the SIP connection */
    websocketUrl: string;
    /** SIP URI (e.g., 'sip:user@domain.com') */
    sipUri: string;
    /** SIP password */
    password: string;
    /** Registrar server (e.g., 'sip:domain.com') */
    registrarServer: string;
    /** Display name for the caller */
    displayName: string;
    /** Authorization user */
    authorizationUser: string;
}

export interface PhoneProps {
    /** Configuration for the SIP connection */
    config: PhoneConfig;
    /** Custom class name for the phone container */
    className?: string;
    /** Callback when a call starts */
    onCallStart?: (number: string) => void;
    /** Callback when a call ends */
    onCallEnd?: (number: string, duration: number, status: 'completed' | 'failed') => void;
    /** Callback when status changes */
    onStatusChange?: (status: PhoneStatus) => void;
    /** Callback when an incoming call is received */
    onIncomingCall?: (callerNumber: string, callerName?: string) => void;
    /** Custom labels for internationalization */
    labels?: Partial<PhoneLabels>;
}

export interface PhoneLabels {
    calling: string;
    waitingResponse: string;
    cancel: string;
    hangUp: string;
    callEnded: string;
    duration: string;
    inactive: string;
    inCall: string;
    placeholder: string;
    callHistory: string;
    noCallsRegistered: string;
    callsRegistered: string;
    noCalls: string;
    startingCall: string;
    callInProgress: string;
    turnOn: string;
    incomingCall: string;
    answer: string;
    reject: string;
}

export const defaultLabels: PhoneLabels = {
    calling: 'Llamando',
    waitingResponse: 'Esperando respuesta...',
    cancel: 'Cancelar',
    hangUp: 'Colgar',
    callEnded: 'Llamada finalizada',
    duration: 'Duración',
    inactive: 'Inactivo',
    inCall: 'En llamada',
    placeholder: 'Número a llamar',
    callHistory: 'Historial de llamadas',
    noCallsRegistered: 'No hay llamadas registradas',
    callsRegistered: 'llamada(s) registrada(s)',
    noCalls: 'No hay llamadas',
    startingCall: 'Iniciando llamada a',
    callInProgress: 'Ya hay una llamada en curso',
    turnOn: 'Encender teléfono',
    incomingCall: 'Llamada entrante',
    answer: 'Contestar',
    reject: 'Rechazar',
};
