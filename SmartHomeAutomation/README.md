# Smart Home Backend API

ASP.NET Core 9 Web API powering the Smart Home Automation system with AI-driven analytics, device management, and real-time automation.

## Tech Stack

- **.NET 9** ASP.NET Core Web API
- **MySQL** — database (via Pomelo.EntityFrameworkCore.MySql)
- **JWT Bearer** — authentication
- **Swagger / OpenAPI** — API documentation
- **Ollama** — local AI model integration (Gemma 3:4B)
- **BCrypt** — password hashing
- **Memory Cache** — performance optimization

## Quick Start

### Prerequisites

- .NET 9 SDK
- MySQL Server (local or remote)
- (Optional) Ollama with Gemma 3:4B for AI features

### Setup Secrets

```bash
dotnet user-secrets set "Jwt:Key" "YourSecretKeyHere"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=SmartHomeAutomationDB;user=root;password=yourpassword;"
```

Or run the provided script:

```bash
setup-secrets.bat
```

### Run

```bash
dotnet run
```

The API starts on `https://localhost:7292`. Swagger UI available at `/swagger` in development.

## Configuration

| Config Key | Default | Description |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | MySQL connection string | Database |
| `Jwt:Key` | — | JWT signing key (min 32 chars) |
| `Jwt:Issuer` | `SmartHomeAutomationAPI` | Token issuer |
| `Jwt:Audience` | `SmartHomeAutomationClient` | Token audience |
| `Ollama:BaseUrl` | `http://localhost:11434` | Ollama API endpoint |
| `Ollama:Model` | `gemma3:4b` | AI model name |
| `App:BaseUrl` | `http://localhost:5173` | Allowed CORS origin |

Override any setting via environment variables (`.NET` convention: `ConnectionStrings__DefaultConnection`).

## Project Structure

```
SmartHomeAutomation/
├── Controllers/     # API endpoints
├── Data/            # DbContext, migrations
├── Helpers/         # JwtService, etc.
├── Models/          # Entity models and DTOs
├── Services/        # Business logic: AI, automation, energy, security, etc.
└── Program.cs       # App bootstrap, DI, middleware
```

## Key Services

- **OllamaService** — local LLM for suggestions, insights, chat
- **AutomationRuleService** — conditional triggers and scheduling
- **AutomationSchedulerService** — background job execution
- **EnergyAnomalyService** — detects unusual consumption patterns
- **PredictiveMaintenanceService** — device health forecasting
- **SecurityRiskService** — threat detection and security scoring
- **MemoryService** — persistent context for AI conversations
- **WeatherService** — forecast and current conditions
- **ReportService** — monthly PDF-style reports

## API Endpoints

### Auth
- `POST /api/auth/login` — authenticate user
- `POST /api/auth/register` — create account
- `POST /api/auth/forgot-password` — reset password

### Devices
- `GET/POST /api/devices` — list / create devices
- `PUT /api/devices/{id}` — update device
- `PATCH /api/devices/{id}/status` — toggle device status

### AI
- `POST /api/ai/suggest` — get AI suggestions
- `POST /api/ai/chat` — conversational AI
- `POST /api/ai/insights` — smart home insights

### Energy
- `GET /api/energy/dashboard` — energy overview
- `GET /api/energy/prediction` — bill forecast
- `GET /api/energy/recommendations` — savings tips

### Security
- `GET /api/security/dashboard` — security overview
- `GET /api/security/events` — security event log

Full API documentation available via Swagger at `/swagger`.
