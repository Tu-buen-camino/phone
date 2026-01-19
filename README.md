# @tbisoftware/phone

A reusable SIP phone component for React applications built with Tailwind CSS and JsSIP.

## Installation

npm install @tbisoftware/phone

## Usage

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
  return <Phone config={config} />;
}
```

## Props

- config: PhoneConfig (required)
- className: string
- onCallStart: (number: string) => void
- onCallEnd: (number, duration, status) => void
- labels: Custom labels for i18n

## License

MIT
