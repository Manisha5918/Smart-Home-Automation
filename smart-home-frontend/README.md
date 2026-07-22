# Smart Home Frontend

React 19 application for intelligent home automation management with AI-powered insights, real-time device control, and energy analytics.

## Tech Stack

- **React 19** with Create React App
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — page transitions and micro-interactions
- **Recharts** — energy and device usage charts
- **Lucide React** — icon system
- **i18next** — multilingual support (English, Hindi, Tamil, Malayalam)
- **React Router v6** — client-side routing with protected/admin routes
- **Axios** — HTTP client for REST API

## Quick Start

```bash
npm install
npm start
```

The app runs on `http://localhost:5173` by default.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `https://localhost:7292/api` | Backend API base URL |
| `PORT` | `5173` | Dev server port |

Copy `.env` to configure (a `.env` is provided with defaults for local development).

## Project Structure

```
src/
├── components/       # Reusable UI: Layout, ErrorBoundary, Skeleton, EmptyState, etc.
├── pages/            # Route pages: Dashboard, Devices, AIChat, SmartInsights, etc.
│   └── admin/        # Admin-only pages: UserManagement, AdminDevices, etc.
├── context/          # React Context providers (AuthContext)
├── services/         # API client (api.js), AI services, voice parsing
├── i18n/             # Translations (en, hi, ta, ml)
├── utils/            # Shared helpers (markdownHelpers)
└── App.js            # Root with routes, auth provider, error boundary
```

## Features

- **Dashboard** — real-time device overview, energy consumption, quick controls
- **Device Management** — add, edit, toggle, monitor smart devices
- **Room Management** — organize devices by room with environment controls
- **AI Chat** — natural language queries about your smart home
- **Smart Insights** — AI-generated recommendations and energy analysis
- **Security Dashboard** — intrusion detection, security events, quick actions
- **Predictive Maintenance** — device health monitoring and service alerts
- **Voice Assistant** — hands-free control with speech recognition
- **Automation Rules** — conditional triggers and schedules
- **Weather** — local weather conditions and forecasts
- **Admin Panel** — user management, system-wide device control, energy analytics

## Build

```bash
npm run build
```

Produces an optimized production build in the `build/` directory.
