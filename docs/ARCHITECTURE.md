# System Architecture
# Where Is My Faculty — Faculty Availability Dashboard

**Version**: 1.0  
**Date**: May 2026  
**Status**: Baseline Architecture

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [High-Level System Diagram](#2-high-level-system-diagram)
3. [Component Architecture](#3-component-architecture)
4. [Frontend Architecture (React)](#4-frontend-architecture-react)
5. [Backend Architecture (Node.js)](#5-backend-architecture-nodejs)
6. [Database Schema & ERD](#6-database-schema--erd)
7. [Microsoft Graph API Integration](#7-microsoft-graph-api-integration)
8. [Authentication & Authorization Flow](#8-authentication--authorization-flow)
9. [Data Flow — Availability Resolution](#9-data-flow--availability-resolution)
10. [Calendar Sync Engine](#10-calendar-sync-engine)
11. [Caching Strategy](#11-caching-strategy)
12. [API Design](#12-api-design)
13. [Salesforce Integration Architecture](#13-salesforce-integration-architecture)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Technology Stack Decisions](#15-technology-stack-decisions)
16. [Architectural Decision Records (ADRs)](#16-architectural-decision-records-adrs)

---

## 1. Architecture Overview

The system is a **three-tier web application** with a dedicated background sync engine:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Browser (React SPA)  ·  Mobile Browser  ·  Salesforce LWC │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│              Node.js / Express REST API                      │
│        ┌──────────────┐   ┌──────────────────────┐         │
│        │  API Server  │   │  Calendar Sync Engine │         │
│        │  (Express)   │   │  (Background Worker)  │         │
│        └──────────────┘   └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                    │                    │
        ┌───────────┘           ┌────────┘
        │                       │
┌───────────────┐    ┌─────────────────────┐    ┌─────────────┐
│   Database    │    │    External APIs     │    │    Cache    │
│  PostgreSQL   │    │  Microsoft Graph API │    │    Redis    │
│  (Prisma ORM) │    │  (Outlook / M365)   │    │  (Optional) │
└───────────────┘    └─────────────────────┘    └─────────────┘
```

### Key Design Principles
1. **Calendar as Single Source of Truth**: Outlook calendar is never duplicated permanently; only a rolling 14-day cache is maintained.
2. **Graceful Degradation**: If Microsoft Graph is down, the last-cached data is served with a staleness indicator.
3. **Leave Overrides Calendar**: A database-approved leave always takes precedence over calendar events.
4. **API-First**: Every feature is exposed via REST API before any UI is built on top of it.
5. **Salesforce-Ready**: Data contracts and API design follow conventions compatible with Salesforce Named Credentials and External Services.

---

## 2. High-Level System Diagram

```
                              ┌──────────────────────────────┐
                              │       Microsoft 365          │
                              │  ┌──────────┐  ┌─────────┐  │
                              │  │ Exchange │  │  Azure  │  │
                              │  │ Calendar │  │   AD    │  │
                              │  └────┬─────┘  └────┬────┘  │
                              └───────┼──────────────┼───────┘
                                      │ Graph API    │ MSAL OAuth
                                      │              │
┌─────────────────────────────────────▼──────────────▼──────────┐
│                        BACKEND (Node.js)                        │
│                                                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   REST API Server   │    │    Calendar Sync Engine      │   │
│  │                     │    │                              │   │
│  │  GET /faculty       │    │  scheduleJob(every 5 min)    │   │
│  │  GET /faculty/:id   │    │  ┌────────────────────────┐  │   │
│  │  GET /availability  │    │  │ For each active faculty │  │   │
│  │  POST /leaves       │    │  │  1. Fetch Graph events  │  │   │
│  │  GET /leaves        │    │  │  2. Fetch OOF status    │  │   │
│  │  PUT /leaves/:id    │    │  │  3. Upsert cache DB     │  │   │
│  │  POST /sync/:id     │    │  │  4. Emit WS update      │  │   │
│  │  GET /departments   │    │  └────────────────────────┘  │   │
│  └──────────┬──────────┘    └──────────────────────────────┘   │
└─────────────┼────────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────┐
   │  PostgreSQL + Prisma │
   │                      │
   │  • Faculty           │
   │  • Department        │
   │  • CalendarEvent     │
   │  • Leave             │
   │  • SyncLog           │
   │  • User              │
   └──────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                           │
│                                                                    │
│  Pages: Dashboard · AvailabilityChecker · AdminPanel              │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Dashboard   │  │ Availability │  │     Admin Panel        │  │
│  │              │  │  Checker     │  │  • Faculty CRUD        │  │
│  │ FacultyGrid  │  │              │  │  • Leave Approvals     │  │
│  │ FacultyCard  │  │ DatePicker   │  │  • Sync Controls       │  │
│  │ FilterBar    │  │ ResultList   │  │  • Dept Management     │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                    │
│  State: Zustand + React Query (TanStack Query)                    │
│  Routing: React Router v6                                         │
│  Styling: Tailwind CSS                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### System Components

| Component | Technology | Responsibility |
|---|---|---|
| React SPA | React 18 + Vite | User interface; real-time dashboard |
| API Server | Node.js + Express + TypeScript | REST API; business logic |
| Sync Engine | Node.js + node-cron | Background calendar polling |
| Database | PostgreSQL 15 | Persistent storage |
| ORM | Prisma | Type-safe DB access; migrations |
| Auth | MSAL.js (frontend) + MSAL Node (backend) | Microsoft OAuth 2.0 |
| Cache | Redis (optional) | API response caching; rate limit state |

### Component Interactions

```
React SPA
  ├── calls → REST API (JSON over HTTPS)
  ├── listens → WebSocket (optional real-time push)
  └── auth → MSAL.js (Microsoft SSO)

REST API
  ├── reads/writes → PostgreSQL (via Prisma)
  ├── calls → Microsoft Graph API (on demand, for admin sync)
  └── emits → WebSocket events (on leave status change)

Sync Engine (runs in same process, separate module)
  ├── reads → PostgreSQL (faculty list)
  ├── calls → Microsoft Graph API (calendar + OOF)
  ├── writes → PostgreSQL (CalendarEvent cache, SyncLog)
  └── emits → WebSocket events (after each sync cycle)
```

---

## 4. Frontend Architecture (React)

### 4.1 Directory Structure

```
frontend/src/
├── main.tsx                    # App entry point
├── App.tsx                     # Router, providers
├── index.css                   # Tailwind base
│
├── types/
│   └── index.ts                # All TypeScript types / interfaces
│
├── constants/
│   └── index.ts                # Status colors, config constants
│
├── services/
│   ├── api.ts                  # Axios instance + all API calls
│   ├── microsoftGraph.ts       # MSAL config + Graph API helpers
│   └── mockData.ts             # Development mock data
│
├── store/
│   └── facultyStore.ts         # Zustand global store
│
├── hooks/
│   ├── useFaculty.ts           # React Query hooks for faculty
│   ├── useAvailability.ts      # Availability checker hooks
│   └── useLeaves.ts            # Leave management hooks
│
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          # Shell: header + content
│   │   ├── Header.tsx          # Top navigation + search + sync status
│   │   └── Sidebar.tsx         # Department filter sidebar
│   │
│   ├── Dashboard/
│   │   ├── Dashboard.tsx       # Main dashboard container
│   │   ├── FacultyGrid.tsx     # Responsive grid of cards
│   │   └── DashboardFilters.tsx# Filter bar (status, dept, search)
│   │
│   ├── FacultyCard/
│   │   ├── FacultyCard.tsx     # Individual faculty card
│   │   └── AvailabilityBadge.tsx # Status badge component
│   │
│   ├── FacultyDetail/
│   │   ├── FacultyDetailModal.tsx # Modal/drawer for detail view
│   │   ├── WeekSchedule.tsx    # 5-day schedule view
│   │   └── TimeSlotBlock.tsx   # Individual time block
│   │
│   ├── AvailabilityChecker/
│   │   └── AvailabilityChecker.tsx # "Who's free at X time?" tool
│   │
│   ├── LeaveManagement/
│   │   ├── LeaveList.tsx       # Table of leave requests
│   │   └── LeaveForm.tsx       # Submit leave form
│   │
│   └── Common/
│       ├── Badge.tsx           # Generic badge
│       ├── LoadingSpinner.tsx  # Loading states
│       ├── SyncStatus.tsx      # Last sync indicator
│       └── EmptyState.tsx      # Empty search/filter results
│
└── pages/
    ├── DashboardPage.tsx       # Main page
    ├── AvailabilityPage.tsx    # Checker page
    └── AdminPage.tsx           # Admin panel page
```

### 4.2 State Management

**Zustand** is used for global client state:

```typescript
// facultyStore.ts
interface FacultyStore {
  selectedDepartment: string | null;
  searchQuery: string;
  statusFilter: AvailabilityStatus[];
  selectedFacultyId: string | null;
  lastSyncTime: Date | null;
  setSelectedDepartment: (dept: string | null) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: AvailabilityStatus[]) => void;
  setSelectedFacultyId: (id: string | null) => void;
}
```

**React Query (TanStack Query)** is used for all server state:

```typescript
// Data is cached for 5 minutes; background refetch every 5 minutes
const { data: faculty } = useQuery({
  queryKey: ['faculty', filters],
  queryFn: () => api.getFaculty(filters),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
});
```

### 4.3 Routing

```typescript
<Router>
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<DashboardPage />} />
      <Route path="availability" element={<AvailabilityPage />} />
      <Route path="admin" element={<AdminPage />} />         {/* admin role only */}
      <Route path="admin/leaves" element={<AdminPage tab="leaves" />} />
      <Route path="admin/faculty" element={<AdminPage tab="faculty" />} />
    </Route>
  </Routes>
</Router>
```

---

## 5. Backend Architecture (Node.js)

### 5.1 Directory Structure

```
backend/src/
├── index.ts                    # Server entry point
│
├── config/
│   └── index.ts                # Environment config, MS Graph config
│
├── routes/
│   ├── faculty.routes.ts       # /api/faculty
│   ├── availability.routes.ts  # /api/availability
│   ├── leave.routes.ts         # /api/leaves
│   ├── sync.routes.ts          # /api/sync
│   └── department.routes.ts    # /api/departments
│
├── services/
│   ├── faculty.service.ts      # Faculty CRUD + availability resolution
│   ├── microsoftGraph.service.ts # Graph API wrapper (auth + calls)
│   ├── leave.service.ts        # Leave CRUD + status transitions
│   └── sync.service.ts         # Calendar sync orchestration
│
├── jobs/
│   └── calendarSync.job.ts     # node-cron scheduled job
│
├── models/
│   └── schema.prisma           # Prisma schema
│
├── middleware/
│   ├── auth.middleware.ts      # JWT / MSAL token validation
│   ├── rbac.middleware.ts      # Role-based access control
│   └── errorHandler.ts        # Centralized error handling
│
└── utils/
    ├── availability.ts         # Availability resolution logic
    └── logger.ts               # Winston logger
```

### 5.2 API Layer Design

```
POST /api/auth/login            → Microsoft MSAL redirect / token exchange
GET  /api/auth/me               → Current user profile

GET  /api/faculty               → List faculty (with current availability)
GET  /api/faculty/:id           → Single faculty with this week's events
POST /api/faculty               → Create faculty [admin]
PUT  /api/faculty/:id           → Update faculty [admin]
DELETE /api/faculty/:id         → Deactivate faculty [admin]

GET  /api/availability          → Check availability for time range
GET  /api/availability/:id      → Single faculty availability for date

GET  /api/leaves                → List leaves [admin: all; faculty: own]
POST /api/leaves                → Submit leave request
GET  /api/leaves/:id            → Single leave detail
PUT  /api/leaves/:id/approve    → Approve leave [admin]
PUT  /api/leaves/:id/reject     → Reject leave [admin]
DELETE /api/leaves/:id          → Cancel leave

GET  /api/departments           → List departments
POST /api/sync/trigger          → Trigger full sync [admin]
POST /api/sync/trigger/:id      → Trigger sync for one faculty [admin]
GET  /api/sync/status           → Last sync times per faculty [admin]

GET  /api/health                → Health check (DB, Graph API connectivity)
```

### 5.3 Availability Resolution Service

```typescript
// The core logic in faculty.service.ts
async function resolveCurrentAvailability(
  facultyId: string,
  checkTime: Date = new Date()
): Promise<AvailabilityResult> {

  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });

  // 1. Check working hours
  if (isOutsideWorkingHours(checkTime, faculty)) {
    return { status: 'offline', until: nextWorkingHoursStart(faculty) };
  }

  // 2. Check approved leave (highest priority override)
  const activeLeave = await prisma.leave.findFirst({
    where: {
      facultyId,
      status: 'approved',
      startDate: { lte: checkTime },
      endDate: { gte: checkTime },
    }
  });
  if (activeLeave) {
    return { status: 'on_leave', leaveType: activeLeave.leaveType, until: activeLeave.endDate };
  }

  // 3. Check cached Outlook calendar events
  const activeEvent = await prisma.calendarEvent.findFirst({
    where: {
      facultyId,
      startTime: { lte: checkTime },
      endTime: { gt: checkTime },
      isCancelled: false,
    },
    orderBy: { startTime: 'asc' }
  });

  if (activeEvent) {
    if (activeEvent.showAs === 'out_of_office') return { status: 'out_of_office', event: activeEvent };
    if (activeEvent.showAs === 'busy') return { status: 'busy', event: activeEvent };
    if (activeEvent.showAs === 'tentative') return { status: 'in_meeting', event: activeEvent };
    return { status: 'in_meeting', event: activeEvent };
  }

  // 4. Find next event for "free until" message
  const nextEvent = await prisma.calendarEvent.findFirst({
    where: { facultyId, startTime: { gt: checkTime }, isCancelled: false },
    orderBy: { startTime: 'asc' }
  });

  return { status: 'available', nextEventAt: nextEvent?.startTime };
}
```

---

## 6. Database Schema & ERD

### Prisma Schema

```prisma
// Conceptual — full schema in backend/src/models/schema.prisma

model Faculty {
  id                String    @id @default(uuid())
  name              String
  email             String    @unique
  departmentId      String
  designation       String
  phone             String?
  officeLocation    String
  avatarUrl         String?
  azureAdObjectId   String?   @unique
  workingHoursStart String    @default("09:00")
  workingHoursEnd   String    @default("17:00")
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  department        Department      @relation(fields: [departmentId], references: [id])
  calendarEvents    CalendarEvent[]
  leaves            Leave[]
  syncLogs          SyncLog[]
}

model CalendarEvent {
  id              String    @id @default(uuid())
  facultyId       String
  outlookEventId  String    @unique
  subject         String?
  startTime       DateTime
  endTime         DateTime
  showAs          ShowAs    @default(busy)
  isPrivate       Boolean   @default(false)
  isAllDay        Boolean   @default(false)
  location        String?
  isCancelled     Boolean   @default(false)
  lastSyncedAt    DateTime  @default(now())
  faculty         Faculty   @relation(fields: [facultyId], references: [id])
}

enum ShowAs { free tentative busy out_of_office working_elsewhere }

model Leave {
  id             String      @id @default(uuid())
  facultyId      String
  leaveType      LeaveType
  startDate      DateTime
  endDate        DateTime
  isHalfDay      Boolean     @default(false)
  halfDayPeriod  HalfDayPeriod?
  reason         String?
  status         LeaveStatus @default(pending)
  submittedAt    DateTime    @default(now())
  reviewedBy     String?
  reviewedAt     DateTime?
  adminNote      String?
  faculty        Faculty     @relation(fields: [facultyId], references: [id])
}

enum LeaveType    { casual earned medical conference other }
enum LeaveStatus  { pending approved rejected cancelled }
enum HalfDayPeriod { morning afternoon }
```

### ERD (Text Representation)

```
Department ──< Faculty >──< CalendarEvent
                  │
                  └──< Leave
                  └──< SyncLog
```

---

## 7. Microsoft Graph API Integration

### 7.1 Authentication Flow (Application Permissions)

```
Azure AD App Registration
        │
        │  Client Credentials Grant (client_id + client_secret)
        ▼
  MSAL Token Endpoint
  POST /token
  grant_type=client_credentials
  scope=https://graph.microsoft.com/.default
        │
        │  Access Token (expires 1 hour)
        ▼
  Microsoft Graph API
  GET /users/{userPrincipalName}/calendarView
      ?startDateTime=2026-05-08T00:00:00Z
      &endDateTime=2026-05-15T23:59:59Z
      &$select=id,subject,start,end,showAs,isPrivate,location,isCancelled
```

### 7.2 Key Graph API Endpoints

| Purpose | Endpoint | Scope Required |
|---|---|---|
| List calendar events | `GET /users/{id}/calendarView` | `Calendars.Read` |
| Get OOF status | `GET /users/{id}/mailboxSettings` | `MailboxSettings.Read` |
| Get user profile | `GET /users/{id}` | `User.Read.All` |
| Get presence | `GET /users/{id}/presence` | `Presence.Read.All` |
| List all users | `GET /users?$filter=...` | `User.Read.All` |

### 7.3 Event Sync Strategy

```
SYNC CYCLE (every 5 minutes):
  1. Fetch faculty list from DB (only isActive = true)
  2. For each faculty (parallel, max 10 concurrent):
     a. Build window: now - 1 day → now + 7 days
     b. GET /users/{azureAdObjectId}/calendarView?window&$select=...
     c. UPSERT CalendarEvent records (outlookEventId is unique key)
     d. Mark events not returned by Graph as cancelled
     e. GET /users/{azureAdObjectId}/mailboxSettings → check OOF
     f. Write SyncLog entry (success/failure)
  3. Emit 'sync:complete' WebSocket event to all connected clients
  4. Next cycle in 5 minutes
```

### 7.4 Rate Limit Handling

Microsoft Graph has per-app throttle limits. Strategy:
- **Concurrent requests**: Max 10 per cycle (configurable via `SYNC_CONCURRENCY` env var)
- **Retry on 429**: Parse `Retry-After` header; wait specified seconds, then retry
- **Exponential backoff**: 2s → 4s → 8s → 16s for 5xx errors
- **Circuit breaker**: After 3 consecutive failures for a faculty member, skip for 15 minutes

---

## 8. Authentication & Authorization Flow

### 8.1 Roles

| Role | Access |
|---|---|
| `public` (unauthenticated) | Dashboard read-only (no sensitive data) |
| `student` | Dashboard + Availability Checker |
| `faculty` | + Own leave submission |
| `admin` | + Leave approval, faculty CRUD, manual sync |
| `superadmin` | + System config, audit logs |

### 8.2 Login Flow

```
User opens app
      │
      ▼
Is JWT cookie present and valid?
  YES → decode role, proceed
  NO  →
      │
      ├── Student / Anonymous: limited read-only access
      │
      └── Click "Sign In" →
                │
                ▼
          MSAL Redirect
          Microsoft Login Page
                │
                ▼ (successful auth)
          MSAL returns id_token + access_token
                │
                ▼
          Backend: POST /api/auth/login
          Validates MSAL token, looks up User by email
          Creates or updates User record
          Returns HTTP-only JWT cookie (24h expiry)
                │
                ▼
          Role determined by User.role field
```

---

## 9. Data Flow — Availability Resolution

```
Client Request: GET /api/faculty?includeAvailability=true

                              ┌─────────────────────────┐
                              │  Check current time      │
                              │  against working_hours   │
                              └────────────┬────────────┘
                                           │ In hours? YES
                              ┌────────────▼────────────┐
                              │  Query Leave table       │
                              │  for today's date        │
                              └────────────┬────────────┘
                                           │ Approved leave? NO
                              ┌────────────▼────────────┐
                              │  Query CalendarEvent     │
                              │  cache for now window    │
                              └────────────┬────────────┘
                                      ┌────┴────┐
                                 YES  │         │ NO
                              ┌───────▼──┐  ┌───▼─────────┐
                              │  Return  │  │   Return    │
                              │  status  │  │  AVAILABLE  │
                              │  from    │  │  + next     │
                              │  event   │  │  event time │
                              └──────────┘  └─────────────┘
                                 showAs mapping:
                                 busy → BUSY
                                 tentative → IN_MEETING
                                 out_of_office → OUT_OF_OFFICE
```

---

## 10. Calendar Sync Engine

### 10.1 Sync Job Architecture

```typescript
// calendarSync.job.ts — runs in the same Node.js process
// Alternatively can be a separate worker for scale

class CalendarSyncJob {
  schedule = '*/5 * * * *';  // every 5 minutes (cron)

  async run() {
    const faculty = await prisma.faculty.findMany({
      where: { isActive: true, azureAdObjectId: { not: null } }
    });

    // Process in batches of SYNC_CONCURRENCY (default: 10)
    const chunks = chunk(faculty, SYNC_CONCURRENCY);
    for (const batch of chunks) {
      await Promise.allSettled(batch.map(f => this.syncFaculty(f)));
    }

    broadcastSyncComplete();
  }

  async syncFaculty(faculty: Faculty) {
    try {
      const token = await graphService.getToken();
      const window = { start: subDays(new Date(), 1), end: addDays(new Date(), 7) };
      
      const events = await graphService.getCalendarEvents(token, faculty.azureAdObjectId!, window);
      const oof = await graphService.getOofStatus(token, faculty.azureAdObjectId!);
      
      await syncService.upsertEvents(faculty.id, events);
      await syncService.updateOofStatus(faculty.id, oof);
      
      await prisma.syncLog.create({
        data: { facultyId: faculty.id, status: 'success', eventsFetched: events.length }
      });
    } catch (err) {
      await prisma.syncLog.create({
        data: { facultyId: faculty.id, status: 'failed', errorMessage: String(err) }
      });
    }
  }
}
```

### 10.2 Event Upsert Strategy

```sql
-- Conceptual SQL for the UPSERT
INSERT INTO "CalendarEvent" (id, faculty_id, outlook_event_id, subject, start_time, end_time, show_as, ...)
VALUES (...)
ON CONFLICT (outlook_event_id) DO UPDATE
  SET subject = EXCLUDED.subject,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      show_as = EXCLUDED.show_as,
      is_cancelled = EXCLUDED.is_cancelled,
      last_synced_at = NOW();
```

---

## 11. Caching Strategy

| Layer | Cache | TTL | Invalidation |
|---|---|---|---|
| API response `/faculty` | Redis (optional) | 60 seconds | On sync complete |
| CalendarEvent DB table | PostgreSQL | Rolling 14 days | Overwritten each sync |
| Graph API token | Memory (MSAL cache) | Token expiry (~1h) | MSAL handles refresh |
| User session | HTTP-only cookie | 24 hours | Logout / token revoke |

**Without Redis**: The CalendarEvent PostgreSQL table serves as the cache. P99 query time is well under the 500ms SLA for up to 1,000 faculty with proper indexing.

**Indexes required**:
```sql
CREATE INDEX idx_calendar_faculty_time ON "CalendarEvent" (faculty_id, start_time, end_time);
CREATE INDEX idx_leave_faculty_date ON "Leave" (faculty_id, start_date, end_date) WHERE status = 'approved';
```

---

## 12. API Design

### Response Envelope

All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "lastSynced": "2026-05-08T10:30:00Z",
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "FACULTY_NOT_FOUND",
    "message": "Faculty member with ID xyz not found",
    "statusCode": 404
  }
}
```

### Faculty Availability Response

```json
{
  "id": "uuid",
  "name": "Dr. Priya Sharma",
  "email": "p.sharma@university.edu",
  "department": { "id": "uuid", "name": "Computer Science", "code": "CS" },
  "designation": "Associate Professor",
  "officeLocation": "Block A, Room 201",
  "avatarUrl": "https://...",
  "availability": {
    "status": "available",
    "statusLabel": "Available",
    "freeUntil": "2026-05-08T14:00:00Z",
    "currentEvent": null,
    "nextEvent": {
      "subject": "Department Meeting",
      "startTime": "2026-05-08T14:00:00Z",
      "endTime": "2026-05-08T15:00:00Z",
      "location": "Conference Room B"
    }
  },
  "lastSynced": "2026-05-08T10:30:00Z"
}
```

---

## 13. Salesforce Integration Architecture

See `SALESFORCE_INTEGRATION.md` for full implementation guide.

### Summary of Integration Points

```
Salesforce Org
      │
      │  Named Credential (OAuth JWT Bearer)
      ▼
Where-Is-My-Faculty REST API
  GET /api/faculty              → maps to Faculty__c custom object
  GET /api/availability         → surfaces in FacultyAvailability__c
  POST /api/leaves              → creates FacultyLeave__c record
      │
      │  Outbound Messages / Platform Events (future)
      ▼
Salesforce Platform Events
  FacultyStatusChanged__e       → real-time updates to SF
```

### Salesforce Custom Objects (v2.0 target)

| SF Object | Maps To | Purpose |
|---|---|---|
| `Faculty__c` | Faculty | Faculty master record |
| `Department__c` | Department | Department hierarchy |
| `FacultyLeave__c` | Leave | Leave requests and approvals |
| `FacultySchedule__c` | CalendarEvent | Cached schedule for SF use |

---

## 14. Deployment Architecture

### Container Architecture

```
docker-compose.yml
  ├── frontend     (Nginx serving React build, port 80/443)
  ├── backend      (Node.js API + Sync Engine, port 3001)
  └── postgres     (PostgreSQL 15, port 5432, internal only)
```

### Production Deployment (Azure — recommended for M365 alignment)

```
Azure Resource Group
├── Azure App Service (Node.js backend)
├── Azure Static Web Apps (React frontend)
├── Azure Database for PostgreSQL (Flexible Server)
├── Azure Key Vault (secrets: client_id, client_secret, DB URL)
├── Azure App Registration (Microsoft 365 OAuth)
└── Azure Application Insights (monitoring)
```

### Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/faculty_db"

# Microsoft Graph
AZURE_TENANT_ID="your-tenant-id"
AZURE_CLIENT_ID="your-app-client-id"
AZURE_CLIENT_SECRET="your-client-secret"   # Store in Key Vault in prod

# Auth
JWT_SECRET="your-256-bit-secret"
JWT_EXPIRY="24h"

# Sync
SYNC_INTERVAL_MINUTES=5
SYNC_CONCURRENCY=10
SYNC_LOOKAHEAD_DAYS=7

# Frontend
VITE_API_BASE_URL="https://api.whereis.myfaculty.edu"
VITE_USE_MOCK_DATA=false
```

---

## 15. Technology Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | React 18 | Largest ecosystem; strong Salesforce LWC interop story |
| Build tool | Vite | Fast HMR; native ESM; simpler than CRA |
| Styling | Tailwind CSS | Utility-first; excellent responsive primitives; no CSS file bloat |
| Server state | TanStack Query | Best-in-class caching/refetch; automatic background refresh |
| Client state | Zustand | Minimal boilerplate; excellent TypeScript support |
| Backend | Node.js + Express | Same language as frontend; huge ecosystem; Microsoft Graph SDK is first-class |
| ORM | Prisma | Type-safe; excellent migration tooling; good PostgreSQL support |
| Database | PostgreSQL | ACID; JSONB for event caching; proven at scale |
| Job scheduler | node-cron | Zero-dependency; sufficient for 5-min polling |
| Auth | MSAL | Official Microsoft library; handles token refresh |
| Containerisation | Docker Compose | Simple local + staging; maps to Azure Container Apps for prod |

---

## 16. Architectural Decision Records (ADRs)

### ADR-001: Local Calendar Cache vs. Live Graph API on Every Request

**Decision**: Cache calendar events in PostgreSQL; serve dashboard from cache.

**Rationale**: Serving 500+ concurrent users directly from Microsoft Graph API would hit rate limits instantly. A 5-minute-old cache is acceptable per the PRD SLA. If Graph is down, cached data is still served (with a staleness warning).

**Consequence**: Data is never real-time (max 5 minutes stale). Accepted.

### ADR-002: Application Permissions vs. Delegated Permissions

**Decision**: Use Application permissions (daemon flow) for server-side sync.

**Rationale**: Faculty should not need to explicitly consent every session. IT admin can grant tenant-wide consent once. Delegated permissions require faculty to be logged in for the sync to work — impractical for a background job.

**Consequence**: Requires Azure AD admin approval to grant tenant-wide consent. This is a deployment prerequisite.

### ADR-003: Leave Database Overrides Calendar

**Decision**: An approved leave in the database ALWAYS takes precedence over Outlook calendar data.

**Rationale**: Faculty may forget to block their Outlook calendar when on leave. The institutional leave system (HR database) is the authoritative source for formal absences.

**Consequence**: There can be a "gap" where a faculty is on leave in the DB but their Outlook still shows as available. The dashboard correctly shows ON_LEAVE.

### ADR-004: Single Process vs. Separate Worker

**Decision**: v1.0 runs sync engine in the same Node.js process as the API.

**Rationale**: Simpler deployment; sufficient for ≤ 1,000 faculty. If sync takes >5 minutes at scale, the job will overlap — this is monitored via SyncLog.

**Future**: Extract to a separate process or Azure Function for v2.0.

### ADR-005: Salesforce Compatibility from Day One

**Decision**: API response shapes and URL patterns follow REST conventions compatible with Salesforce External Services.

**Rationale**: Avoids a rebuild when integrating with Salesforce in v2.0. The cost is minor — primarily using consistent field naming (camelCase) and standard HTTP verbs.

---

*End of Architecture Document v1.0*
