import { useState } from 'react';
import { cn } from '../utils/cn';
import { formatDuration } from '../utils/formatDuration';
import type { PhoneProps, CallHistoryEntry } from '../types';
import { defaultLabels } from '../types';
import { PhoneProvider, usePhone } from '../context/PhoneContext';

// Icons as SVG components to avoid external dependencies
const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
);

const PhoneRingIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.05 5A7 7 0 0 1 19 8.95M15.05 1A11 11 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
);

const PhoneInTalkIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/>
    </svg>
);

const PhoneHangupIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
    </svg>
);

const PhoneMissedIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.5 5.5 12 11l7-7-1-1-6 6-4.5-4.5H11V3H5v6h1.5V5.5zm17.21 11.17C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.71s.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9v-3.1c1.45-.48 3-.73 4.6-.73 1.6 0 3.15.25 4.6.72v3.1c0 .39.23.74.56.9.98.49 1.87 1.12 2.67 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71s-.12-.52-.3-.7z"/>
    </svg>
);

const PhoneCheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        <path d="M16 3l-5 5-2-2-1.5 1.5L11 11l6.5-6.5z"/>
    </svg>
);

const PhoneCancelIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        <path d="M19 6.41L17.59 5 15 7.59 12.41 5 11 6.41 13.59 9 11 11.59 12.41 13 15 10.41 17.59 13 19 11.59 16.41 9z"/>
    </svg>
);

const HistoryIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
    </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
);

// Internal Phone UI Component
function PhoneUI({ className, labels: customLabels }: { className?: string; labels?: Partial<typeof defaultLabels> }) {
    const {
        status,
        callNumber,
        setCallNumber,
        callHistory,
        currentCallDuration,
        startCall,
        endCall,
        isReady,
        connectionStatus,
    } = usePhone();

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const labels = { ...defaultLabels, ...customLabels };

    const getStatusInfo = () => {
        switch (status) {
            case 'progress':
                return { text: `${labels.calling}...`, color: 'text-yellow-500', Icon: PhoneRingIcon };
            case 'confirmed':
                return { text: `${labels.inCall} - ${formatDuration(currentCallDuration)}`, color: 'text-green-500', Icon: PhoneInTalkIcon };
            case 'failed':
                return { text: labels.callEnded, color: 'text-red-500', Icon: PhoneMissedIcon };
            case 'ended':
                return { text: labels.callEnded, color: 'text-gray-500', Icon: PhoneHangupIcon };
            default:
                return { text: labels.inactive, color: 'text-gray-300', Icon: PhoneIcon };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className={cn(
            'tbi-phone w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-2',
            className
        )}>
            {/* Disconnected - Input Mode */}
            {status === 'disconnected' && (
                <div className="flex gap-2 items-center">
                    {/* History Button */}
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        type="button"
                    >
                        <HistoryIcon className="w-4 h-4" />
                    </button>

                    {/* Phone Input */}
                    <input
                        type="text"
                        value={callNumber}
                        onChange={(e) => setCallNumber(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                startCall(callNumber);
                            }
                        }}
                        placeholder={labels.placeholder}
                        className="flex-1 h-8 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />

                    {/* Call Button */}
                    <button
                        onClick={() => startCall(callNumber)}
                        disabled={callNumber.length < 9 || !isReady}
                        className="h-8 w-8 flex items-center justify-center rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors"
                        type="button"
                        title={!isReady ? 'Connecting...' : 'Call'}
                    >
                        {connectionStatus === 'connecting' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <PhoneIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
            )}

            {/* Progress - Calling */}
            {status === 'progress' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <div className="relative">
                        <statusInfo.Icon className="w-12 h-12 text-yellow-500 animate-pulse" />
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-500/30 animate-ping" />
                    </div>
                    <div className="text-center">
                        <p className="text-base font-semibold">{labels.calling} {callNumber}</p>
                        <p className="text-sm text-gray-500">{labels.waitingResponse}</p>
                    </div>
                    <button
                        onClick={endCall}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                        type="button"
                    >
                        <PhoneHangupIcon className="w-4 h-4" />
                        {labels.cancel}
                    </button>
                </div>
            )}

            {/* Confirmed - In Call */}
            {status === 'confirmed' && (
                <div className="flex flex-col items-center gap-4 py-6">
                    <div className="relative">
                        <statusInfo.Icon className="w-12 h-12 text-green-500" />
                        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xl font-bold">{callNumber}</p>
                        <p className="text-2xl font-mono text-green-600 tabular-nums">
                            {formatDuration(currentCallDuration)}
                        </p>
                    </div>
                    <button
                        onClick={endCall}
                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                        type="button"
                    >
                        <PhoneHangupIcon className="w-4 h-4" />
                        {labels.hangUp}
                    </button>
                </div>
            )}

            {/* Failed or Ended */}
            {(status === 'failed' || status === 'ended') && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <statusInfo.Icon
                        className={cn(
                            'w-12 h-12',
                            status === 'failed' ? 'text-red-500' : 'text-gray-500'
                        )}
                    />
                    <div className="text-center">
                        <p className="text-base font-semibold">{statusInfo.text}</p>
                    </div>
                </div>
            )}

            {/* History Sheet/Modal */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50" 
                        onClick={() => setIsHistoryOpen(false)} 
                    />
                    
                    {/* Sheet */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <div>
                                    <h2 className="text-lg font-semibold">{labels.callHistory}</h2>
                                    <p className="text-sm text-gray-500">
                                        {callHistory.length === 0 
                                            ? labels.noCallsRegistered 
                                            : `${callHistory.length} ${labels.callsRegistered}`
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                                    type="button"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {callHistory.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <PhoneHangupIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>{labels.noCalls}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {callHistory.map((entry, index) => (
                                            <HistoryEntry
                                                key={entry.id}
                                                entry={entry}
                                                index={index}
                                                onCall={() => {
                                                    setCallNumber(entry.number);
                                                    setIsHistoryOpen(false);
                                                    startCall(entry.number);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// History Entry Component
function HistoryEntry({ 
    entry, 
    index, 
    onCall 
}: { 
    entry: CallHistoryEntry; 
    index: number; 
    onCall: () => void;
}) {
    const getStatusIcon = () => {
        switch (entry.status) {
            case 'completed':
                return <PhoneCheckIcon className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <PhoneCancelIcon className="w-4 h-4 text-red-600" />;
            case 'missed':
                return <PhoneMissedIcon className="w-4 h-4 text-yellow-600" />;
        }
    };

    const getStatusBg = () => {
        switch (entry.status) {
            case 'completed':
                return 'bg-green-100';
            case 'failed':
                return 'bg-red-100';
            case 'missed':
                return 'bg-yellow-100';
        }
    };

    return (
        <div
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                getStatusBg()
            )}>
                {getStatusIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.number}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                        {new Date(entry.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                    {entry.duration > 0 && (
                        <>
                            <span>•</span>
                            <span className="font-mono tabular-nums">
                                {formatDuration(entry.duration)}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={onCall}
                className="h-8 w-8 flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
                type="button"
            >
                <PhoneIcon className="w-4 h-4" />
            </button>
        </div>
    );
}

// Main Phone Component
export default function Phone({ config, className, onCallStart, onCallEnd, onStatusChange, labels }: PhoneProps) {
    return (
        <PhoneProvider 
            config={config} 
            onCallStart={onCallStart} 
            onCallEnd={onCallEnd} 
            onStatusChange={onStatusChange}
        >
            <PhoneUI className={className} labels={labels} />
        </PhoneProvider>
    );
}
