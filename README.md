# @tbisoftware/phone

A reusable SIP phone component for **React** and **Vue** applications built with Tailwind CSS and JsSIP.

## Installation

```bash
npm install @tbisoftware/phone
```

## Features

- Multi-framework support: **React** and **Vue 3**
- Full SIP/WebRTC phone functionality
- Beautiful UI built with Tailwind CSS
- Headless mode with `usePhoneManager` hook/composable for custom UIs
- Call history with localStorage persistence
- Internationalization support with custom labels
- Singleton pattern for reliable WebSocket connections
- Framework-agnostic core for custom integrations

## Entry Points

| Import Path | Description |
|-------------|-------------|
| `@tbisoftware/phone` | Default React exports (backward compatible) |
| `@tbisoftware/phone/react` | Explicit React exports |
| `@tbisoftware/phone/vue` | Vue 3 exports |
| `@tbisoftware/phone/core` | Framework-agnostic core (PhoneManager class) |

---

# React Usage

## Option 1: Ready-to-use Component

The simplest way to add a phone to your React app:

```tsx
import { Phone } from "@tbisoftware/phone";
// or explicitly: import { Phone } from "@tbisoftware/phone/react";

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

## Option 2: Headless Hook for Custom UI

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
  });

  return (
    <div className="p-4 border rounded-lg">
      {status === 'disconnected' && (
        <div className="flex gap-2">
          <input
            type="tel"
            value={callNumber}
            onChange={(e) => setCallNumber(e.target.value)}
            placeholder="Enter phone number"
          />
          <button
            onClick={() => startCall(callNumber)}
            disabled={!isReady || callNumber.length < 9}
          >
            Call
          </button>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="text-center">
          <p>{callNumber}</p>
          <p>{formatDuration(currentCallDuration)}</p>
          <button onClick={endCall}>Hang Up</button>
        </div>
      )}
    </div>
  );
}
```

## Option 3: Using Provider and usePhone Hook

For complex scenarios where you need to access phone state from multiple components:

```tsx
import { PhoneProvider, usePhone } from "@tbisoftware/phone";

const config = { /* ... */ };

function App() {
  return (
    <PhoneProvider config={config}>
      <PhoneDialer />
      <CallStatus />
    </PhoneProvider>
  );
}

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

---

# Vue 3 Usage

## Option 1: Ready-to-use Component

```vue
<script setup lang="ts">
import { Phone } from "@tbisoftware/phone/vue";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

function handleCallStart(number: string) {
  console.log('Calling:', number);
}

function handleCallEnd(number: string, duration: number, status: string) {
  console.log(`Call to ${number} ${status}. Duration: ${duration}s`);
}
</script>

<template>
  <Phone
    :config="config"
    @call-start="handleCallStart"
    @call-end="handleCallEnd"
  />
</template>
```

## Option 2: Headless Composable for Custom UI

Use `usePhoneManager` to build your own phone interface:

```vue
<script setup lang="ts">
import { usePhoneManager } from "@tbisoftware/phone/vue";
import { formatDuration } from "@tbisoftware/phone/core";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

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
});
</script>

<template>
  <div class="p-4 border rounded-lg">
    <div v-if="status === 'disconnected'" class="flex gap-2">
      <input
        type="tel"
        :value="callNumber"
        @input="setCallNumber(($event.target as HTMLInputElement).value)"
        placeholder="Enter phone number"
      />
      <button
        @click="startCall(callNumber)"
        :disabled="!isReady || callNumber.length < 9"
      >
        Call
      </button>
    </div>

    <div v-if="status === 'confirmed'" class="text-center">
      <p>{{ callNumber }}</p>
      <p>{{ formatDuration(currentCallDuration) }}</p>
      <button @click="endCall">Hang Up</button>
    </div>
  </div>
</template>
```

## Option 3: Using Provider and usePhone Composable

For complex scenarios where you need to access phone state from multiple components:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { usePhoneProvider } from "@tbisoftware/phone/vue";
import PhoneDialer from './PhoneDialer.vue';
import CallStatus from './CallStatus.vue';

const config = { /* ... */ };

usePhoneProvider({ config });
</script>

<template>
  <PhoneDialer />
  <CallStatus />
</template>
```

```vue
<!-- PhoneDialer.vue -->
<script setup lang="ts">
import { usePhone } from "@tbisoftware/phone/vue";

const { callNumber, setCallNumber, startCall, isReady } = usePhone();
</script>

<template>
  <div>
    <input
      :value="callNumber"
      @input="setCallNumber(($event.target as HTMLInputElement).value)"
    />
    <button @click="startCall(callNumber)" :disabled="!isReady">
      Call
    </button>
  </div>
</template>
```

```vue
<!-- CallStatus.vue -->
<script setup lang="ts">
import { usePhone } from "@tbisoftware/phone/vue";

const { status, currentCallDuration, endCall } = usePhone();
</script>

<template>
  <div v-if="status !== 'disconnected'">
    <p>Status: {{ status }}</p>
    <p v-if="status === 'confirmed'">Duration: {{ currentCallDuration }}s</p>
    <button @click="endCall">End Call</button>
  </div>
</template>
```

---

# Core Usage (Framework-Agnostic)

For custom integrations or other frameworks, you can use the `PhoneManager` class directly:

```typescript
import { PhoneManager } from "@tbisoftware/phone/core";

const config = {
  websocketUrl: "wss://your-sip-server.com:8989",
  sipUri: "sip:user@domain.com",
  password: "your-password",
  registrarServer: "sip:domain.com",
  displayName: "User Name",
  authorizationUser: "auth-user",
};

const manager = new PhoneManager(
  config,
  {
    onStatusChange: (status) => console.log('Status:', status),
    onCallStart: (number) => console.log('Calling:', number),
    onCallEnd: (number, duration, status) => {
      console.log(`Call ended: ${number}, ${duration}s, ${status}`);
    },
    onConnectionChange: (status) => console.log('Connection:', status),
  },
  {
    persistHistory: true,
    historyKey: 'my-phone-history',
  }
);

// Initialize the phone
manager.initialize();

// Make a call
manager.startCall('+1234567890');

// End the call
manager.endCall();

// Access state
console.log(manager.state.status);
console.log(manager.state.isReady);
console.log(manager.state.callHistory);

// Clean up when done
manager.destroy();
```

---

# API Reference

## `<Phone />` Component Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `PhoneConfig` | Required. SIP configuration object |
| `className` | `string` | Optional. Additional CSS classes |
| `onCallStart` | `(number: string) => void` | Callback when a call starts |
| `onCallEnd` | `(number: string, duration: number, status: 'completed' \| 'failed') => void` | Callback when a call ends |
| `onStatusChange` | `(status: PhoneStatus) => void` | Callback when status changes |
| `labels` | `Partial<PhoneLabels>` | Custom labels for internationalization |

## `usePhoneManager(config, options)` Hook/Composable

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

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onCallStart` | `(number: string) => void` | - | Callback when call starts |
| `onCallEnd` | `(number, duration, status) => void` | - | Callback when call ends |
| `onStatusChange` | `(status: PhoneStatus) => void` | - | Callback on status change |
| `onConnectionChange` | `(status: ConnectionStatus) => void` | - | Callback on connection change |
| `persistHistory` | `boolean` | `true` | Save history to localStorage |
| `historyKey` | `string` | `'tbi-phone-call-history'` | localStorage key for history |

## `PhoneConfig` Type

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

## `PhoneLabels` Type

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

## Migration from v1 to v2

If you're upgrading from v1 (React-only), your code should continue to work without changes. The default export still provides React components.

For explicit React imports (recommended):
```diff
- import { Phone } from "@tbisoftware/phone";
+ import { Phone } from "@tbisoftware/phone/react";
```

## License

MIT
