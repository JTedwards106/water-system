# Backend-Frontend Integration Strategy

This document outlines the strategy for ensuring seamless integration between the Spring Boot backend, the React Web dashboard, and the React Native mobile application.

## 1. API Contract Mapping

| Feature | Backend Endpoint (Spring Boot) | Frontend Consumer (React/Mobile) |
|---------|--------------------------------|----------------------------------|
| Real-time Monitoring | `GET /api/v1/water/latest/{deviceId}` | `Dashboard.jsx`, `UsageScreen.jsx` |
| Historical Analytics | `GET /api/v1/water/history/{deviceId}` | `UsageScreen.jsx` |
| Valve Control | `POST /api/v1/water/valve` | `Dashboard.jsx`, `HomeScreen.jsx` |
| Account Mgmt | `GET /api/v1/user/account/{deviceId}` | `ProfileScreen.jsx`, `Dashboard.jsx` |
| Target Setting | `POST /api/v1/user/target` | `Dashboard.jsx`, `LinkMeterScreen.jsx` |

## 2. Cross-Platform Consistency

### Environment Configuration
- All frontends must point to the same `BACKEND_URL`. 
- **Important**: Frontend apps should use the shared `localtunnel` or `ngrok` URL to ensure external connectivity for the hardware and mobile devices.

### IoT Ingestion Flow
1. **Source**: ESP32 (`CodeLogic.ino`) posts to `/api/v1/water/ingest`.
2. **Process**: Backend saves to DB and broadcasts to Kafka.
3. **Display**: Web/Mobile poll every 1-5 seconds to show the latest usage.

## 3. Immediate Actions

1. **[WEB] Update App.jsx**: Replace the Vite boilerplate with the `Dashboard.jsx` component that includes real-time graphs and controls.
2. **[MOBILE] Audit API IDs**: Ensure the `deviceId` used in the mobile screens matches the one seeded in the database (`home-hw-001`).
3. **[BACKEND] CORS Check**: Ensure `SecurityConfig` allows origins from both the web URL and mobile local IP addresses.
