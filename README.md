# Where Is My Faculty

> Real-time faculty availability dashboard — synced with Microsoft Outlook calendars

A responsive React web application that gives students and staff a single, unified view of faculty availability, powered by Microsoft Graph API calendar sync and an institutional leave management system.

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for full stack with PostgreSQL)
- Microsoft Azure AD app registration (for live Outlook sync; not required for mock mode)

### Run in Mock Mode (no database, no Azure required)

```bash
# Frontend only — uses built-in mock data
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Run Full Stack with Docker

```bash
# Copy and fill in environment variables (Azure credentials optional for dev)
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Run Backend Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and Azure credentials
npm run dev
```

---

## Project Structure

```
where-is-my-faculty/
├── docs/                        # Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── ARCHITECTURE.md          # System architecture & design decisions
│   ├── SALESFORCE_INTEGRATION.md # Salesforce v2.0 integration guide
│   └── API_REFERENCE.md         # REST API reference
│
├── frontend/                    # React SPA (Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Route-level pages
│   │   ├── hooks/               # React Query hooks
│   │   ├── services/            # API client + mock data
│   │   ├── store/               # Zustand global state
│   │   └── types/               # TypeScript interfaces
│   └── Dockerfile
│
├── backend/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── routes/              # Express route handlers
│   │   ├── services/            # Microsoft Graph API service
│   │   ├── utils/               # Availability resolver, logger
│   │   ├── models/              # Prisma schema
│   │   └── config/              # Environment configuration
│   ├── .env.example
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Key Features

| Feature | Status |
|---|---|
| Real-time faculty availability dashboard | ✅ |
| Responsive grid (mobile, tablet, desktop) | ✅ |
| Microsoft Outlook / Graph API calendar sync | ✅ (with mock mode) |
| Out-of-office (OOF) detection | ✅ |
| Leave management with approval workflow | ✅ |
| Availability checker ("who's free at 2pm?") | ✅ |
| Faculty schedule detail view (weekly) | ✅ |
| Department filter + search | ✅ |
| Admin panel with department overview | ✅ |
| Salesforce-compatible REST API | ✅ |
| Docker / containerised deployment | ✅ |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | TanStack Query (server state), Zustand (UI state) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Calendar sync | Microsoft Graph API (MSAL Node) |
| Auth | Microsoft MSAL (OAuth 2.0) + JWT |
| Containers | Docker + Docker Compose |

---

## Documentation

| Document | Description |
|---|---|
| [PRD.md](docs/PRD.md) | Full product requirements, user stories, success metrics |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, ADRs, data flows |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | REST API endpoints and contracts |
| [SALESFORCE_INTEGRATION.md](docs/SALESFORCE_INTEGRATION.md) | Salesforce v2.0 integration guide |

---

## Microsoft Graph Setup (Production)

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App Registrations → New Registration
2. Set redirect URI if using delegated flow; leave blank for application (daemon) flow
3. Under **API Permissions**, add:
   - `Calendars.Read` (Application)
   - `User.Read.All` (Application)
   - `MailboxSettings.Read` (Application)
4. Create a client secret under **Certificates & Secrets**
5. Have your IT admin grant **Admin Consent** for the tenant
6. Copy `Tenant ID`, `Client ID`, and `Client Secret` to `backend/.env`

---

## Salesforce Integration (v2.0)

See [SALESFORCE_INTEGRATION.md](docs/SALESFORCE_INTEGRATION.md) for the complete guide to embedding this application inside a Salesforce org using:
- Named Credentials + External Services
- Custom objects (`Faculty__c`, `FacultyLeave__c`)
- Lightning Web Components (LWC)
- Platform Events for real-time updates

---

## License

MIT — See LICENSE file.
