# @tbisoftware/phone

A reusable SIP phone component for React applications built with Tailwind CSS and JsSIP.

## Installation

```bash
npm install @tbisoftware/phone
```

## Features

- 📞 Full SIP/WebRTC phone functionality
- 🎨 Beautiful UI built with Tailwind CSS
- 🪝 Headless mode with `usePhoneManager` hook for custom UIs
- 📱 Call history with localStorage persistence
- 🌐 Internationalization support with custom labels
- ⚡ Singleton pattern for reliable WebSocket connections

## Usage

### Option 1: Ready-to-use Component

The simplest way to add a phone to your app:

```tsx
import { Phone } from "@tbisoftware/phone";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

function App() {
  return (
    <Phone 
      config={config}
      onCallStart={(number) => console.log('Calling:', number)}
      onCallEnd={(number, duration, status) => {
        console.log(`Call to ${number} ${status}. Duration: ${duration}s`);
      }}
    />
  );
}
```

### Option 2: Headless Hook for Custom UI

Use `usePhoneManager` to build your own phone interface:

```tsx
import { usePhoneManager, formatDuration } from "@tbisoftware/phone";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

function CustomPhone() {
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
  } = usePhoneManager(config, {
    onCallStart: (number) => console.log('Starting call to:', number),
    onCallEnd: (number, duration, status) => {
      console.log(`Call ended: ${number}, ${duration}s, ${status}`);
    },
    onStatusChange: (status) => console.log('Status:', status),
    onConnectionChange: (status) => console.log('Connection:', status),
  });

  return (
    <div className="p-4 border rounded-lg">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span className="text-sm text-gray-500">
          {connectionStatus === 'connected' ? 'Ready' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 
           'Disconnected'}
        </span>
      </div>

      {/* Idle state - show input */}
      {status === 'disconnected' && (
        <div className="flex gap-2">
          <input
            type="tel"
            value={callNumber}
            onChange={(e) => setCallNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startCall(callNumber)}
            placeholder="Enter phone number"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={() => startCall(callNumber)}
            disabled={!isReady || callNumber.length < 9}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Call
          </button>
        </div>
      )}

      {/* Calling state */}
      {status === 'progress' && (
        <div className="text-center">
          <p className="text-lg">Calling {callNumber}...</p>
          <button
            onClick={endCall}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* In call */}
      {status === 'confirmed' && (
        <div className="text-center">
          <p className="text-lg font-bold">{callNumber}</p>
          <p className="text-2xl font-mono text-green-600">
            {formatDuration(currentCallDuration)}
          </p>
          <button
            onClick={endCall}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Hang Up
          </button>
        </div>
      )}

      {/* Call history */}
      {status === 'disconnected' && callHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Recent Calls</h3>
          <ul className="space-y-1">
            {callHistory.slice(0, 5).map((entry) => (
              <li 
                key={entry.id}
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={() => {
                  setCallNumber(entry.number);
                  startCall(entry.number);
                }}
              >
                <span>{entry.number}</span>
                <span className={
                  entry.status === 'completed' ? 'text-green-500' :
                  entry.status === 'failed' ? 'text-red-500' :
                  'text-yellow-500'
                }>
                  {entry.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Option 3: Using Provider and usePhone Hook

For more complex scenarios where you need to access phone state from multiple components:

```tsx
import { PhoneProvider, usePhone } from "@tbisoftware/phone";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

// Wrap your app with the provider
function App() {
  return (
    <PhoneProvider config={config}>
      <PhoneDialer />
      <CallStatus />
    </PhoneProvider>
  );
}

// Access phone state from any child component
function PhoneDialer() {
  const { callNumber, setCallNumber, startCall, isReady } = usePhone();
  
  return (
    <div>
      <input
        value={callNumber}
        onChange={(e) => setCallNumber(e.target.value)}
      />
      <button onClick={() => startCall(callNumber)} disabled={!isReady}>
        Call
      </button>
    </div>
  );
}

function CallStatus() {
  const { status, currentCallDuration, endCall } = usePhone();
  
  if (status === 'disconnected') return null;
  
  return (
    <div>
      <p>Status: {status}</p>
      {status === 'confirmed' && <p>Duration: {currentCallDuration}s</p>}
      <button onClick={endCall}>End Call</button>
    </div>
  );
}
```

## API Reference

### `<Phone />` Component Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `PhoneConfig` | Required. SIP configuration object |
| `className` | `string` | Optional. Additional CSS classes |
| `onCallStart` | `(number: string) => void` | Callback when a call starts |
| `onCallEnd` | `(number: string, duration: number, status: 'completed' \| 'failed') => void` | Callback when a call ends |
| `onStatusChange` | `(status: PhoneStatus) => void` | Callback when status changes |
| `labels` | `Partial<PhoneLabels>` | Custom labels for internationalization |

### `usePhoneManager(config, options)` Hook

Returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `status` | `PhoneStatus` | Current call status: `'disconnected' \| 'progress' \| 'confirmed' \| 'failed' \| 'ended'` |
| `callNumber` | `string` | Current phone number |
| `setCallNumber` | `(number: string) => void` | Set the phone number |
| `callHistory` | `CallHistoryEntry[]` | Array of past calls |
| `clearCallHistory` | `() => void` | Clear the call history |
| `currentCallDuration` | `number` | Duration of current call in seconds |
| `startCall` | `(number: string) => void` | Start a call |
| `endCall` | `() => void` | End the current call |
| `isReady` | `boolean` | Whether the phone is registered and ready |
| `connectionStatus` | `ConnectionStatus` | `'connecting' \| 'connected' \| 'disconnected' \| 'failed'` |
| `ua` | `JsSIP.UA \| null` | Raw JsSIP User Agent for advanced usage |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onCallStart` | `(number: string) => void` | - | Callback when call starts |
| `onCallEnd` | `(number, duration, status) => void` | - | Callback when call ends |
| `onStatusChange` | `(status: PhoneStatus) => void` | - | Callback on status change |
| `onConnectionChange` | `(status: ConnectionStatus) => void` | - | Callback on connection change |
| `persistHistory` | `boolean` | `true` | Save history to localStorage |
| `historyKey` | `string` | `'tbi-phone-call-history'` | localStorage key for history |

### `PhoneConfig` Type

```typescript
interface PhoneConfig {
  websocketUrl: string;      // WebSocket URL of SIP server
  sipUri: string;            // SIP URI (sip:user@domain.com)
  password: string;          // SIP password
  registrarServer: string;   // SIP registrar server
  displayName: string;       // Display name for caller ID
  authorizationUser: string; // Authorization username
}
```

### `PhoneLabels` Type

```typescript
interface PhoneLabels {
  placeholder: string;      // Default: "Ingresa un número"
  calling: string;          // Default: "Llamando"
  inCall: string;           // Default: "En llamada"
  callEnded: string;        // Default: "Llamada finalizada"
  inactive: string;         // Default: "Inactivo"
  waitingResponse: string;  // Default: "Esperando respuesta..."
  cancel: string;           // Default: "Cancelar"
  hangUp: string;           // Default: "Colgar"
  callHistory: string;      // Default: "Historial de llamadas"
  noCallsRegistered: string;// Default: "No hay llamadas registradas"
  callsRegistered: string;  // Default: "llamadas registradas"
  noCalls: string;          // Default: "No hay llamadas en el historial"
}
```

## Triggering Calls from Outside

You can trigger a call from anywhere in your app using a custom event:

```javascript
// Dispatch this event to start a call
window.dispatchEvent(new CustomEvent('StartCallEvent', { 
  detail: { number: '+1234567890' } 
}));
```

## Styling

The component uses Tailwind CSS classes. Make sure you have Tailwind CSS configured in your project. All components have the `tbi-phone` class for custom styling:

```css
.tbi-phone {
  /* Your custom styles */
}
```

## License

MIT
