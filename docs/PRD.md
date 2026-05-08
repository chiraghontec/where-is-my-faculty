# Product Requirements Document
# Where Is My Faculty — Faculty Availability Dashboard

**Version**: 1.0  
**Date**: May 2026  
**Status**: Approved for Development  
**Owner**: Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Model](#8-data-model)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Integration Requirements](#10-integration-requirements)
11. [Security Requirements](#11-security-requirements)
12. [Out of Scope](#12-out-of-scope)
13. [Future Enhancements](#13-future-enhancements)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

**Where Is My Faculty** is a real-time, responsive web application that gives students and staff a single unified view of faculty availability. It syncs directly with each faculty member's Microsoft Outlook / Microsoft 365 calendar, merges that data with an institutional leave-management database, and surfaces a clear availability status (Available · In Meeting · Busy · On Leave · Out of Office) on a single dashboard.

The application is architected from day one to be embeddable inside an existing Salesforce org, either as a Salesforce Experience Cloud page or as a Lightning Web Component (LWC), so that the institution can consolidate it into their existing Salesforce investment without a rebuild.

---

## 2. Problem Statement

### Current Situation
Faculty members at universities and colleges maintain their schedules on Outlook/Exchange calendars. Students who want to meet a professor must:
- Walk to the faculty office and knock — often finding them absent.
- Send an email and wait hours or days for a response.
- Check a paper notice-board that may be weeks out of date.
- Ask the department office, creating unnecessary administrative overhead.

### Pain Points
| Stakeholder | Pain |
|---|---|
| Students | Cannot tell if a professor is available without physically going to the office |
| Faculty | Interrupted by students when they are genuinely busy or in a meeting |
| Department Offices | Constantly fielding "Where is Prof. X?" queries |
| Admins | No centralised leave and schedule overview |

### Root Cause
There is no live, aggregated view that joins Outlook calendar data with institutional leave records and surfaces it in a human-readable format.

---

## 3. Goals & Success Metrics

### Goals
1. Reduce "unnecessary faculty-office visits" by providing a real-time availability view.
2. Give faculty a zero-effort way to communicate their availability — their existing Outlook calendar is the source of truth.
3. Provide department heads and admins a bird's-eye view of who is available across the department.
4. Build a Salesforce-compatible architecture so the module can be integrated into the institution's existing CRM platform.

### Success Metrics

| Metric | Baseline | Target (6 months) |
|---|---|---|
| Unnecessary office visits per week | ~200 | < 50 (-75%) |
| Student satisfaction (availability info) | N/A | ≥ 4.2 / 5.0 |
| Average availability query response time | Minutes–Hours | < 3 seconds |
| Dashboard data staleness | N/A | ≤ 5 minutes |
| Leave application processed without manual intervention | 0% | ≥ 90% |

---

## 4. User Personas

### P1 — Student (Primary Consumer)
- **Name**: Priya, 3rd-year B.Tech student
- **Goal**: Find out if Prof. Sharma is free this afternoon before walking across campus
- **Tech comfort**: High — uses smartphone and web daily
- **Needs**: Fast, mobile-friendly, one-glance answer

### P2 — Faculty Member
- **Name**: Prof. Mehra, Associate Professor
- **Goal**: Maintain accurate availability without any extra work on top of Outlook
- **Needs**: Zero-friction — calendar already maintained in Outlook; leaves submitted via admin panel

### P3 — Department Administrator
- **Name**: Kavitha, Admin Officer
- **Goal**: See a department-wide view, approve/reject leaves, and manage faculty profiles
- **Needs**: Full admin dashboard, leave workflow, audit trail

### P4 — HOD / Department Head
- **Name**: Dr. Krishnan, Head of Department
- **Goal**: Quickly see which faculty are available for impromptu meetings or to cover a class
- **Needs**: Filtered dashboard by department, exportable schedule

### P5 — Salesforce Admin (Future Integration)
- **Name**: Ravi, Salesforce Administrator
- **Goal**: Surface faculty availability inside the institution's Salesforce org
- **Needs**: REST API, connected app config, LWC-compatible data contracts

---

## 5. User Stories

### Student Stories
| ID | Story | Priority |
|---|---|---|
| S-01 | As a student, I want to see at a glance which faculty are available right now so I can decide who to visit. | P0 |
| S-02 | As a student, I want to check if a specific professor is free at a particular time so I can plan my visit. | P0 |
| S-03 | As a student, I want to see a professor's full-week schedule so I can find a good time to meet. | P1 |
| S-04 | As a student, I want to search for a professor by name or department. | P1 |
| S-05 | As a student, I want to see the reason a professor is unavailable (In Meeting, On Leave, etc.) | P1 |
| S-06 | As a student, I want to see when a professor will next be available. | P1 |
| S-07 | As a student on mobile, I want the dashboard to work perfectly on my phone. | P0 |

### Faculty Stories
| ID | Story | Priority |
|---|---|---|
| F-01 | As a faculty member, I want my Outlook calendar to automatically reflect my availability so I don't have to update anything separately. | P0 |
| F-02 | As a faculty member, I want to submit a leave request so the dashboard marks me unavailable automatically. | P0 |
| F-03 | As a faculty member, I want to mark certain calendar events as private so only my status is shown, not the event details. | P1 |

### Admin Stories
| ID | Story | Priority |
|---|---|---|
| A-01 | As an admin, I want to manage the list of faculty (add, edit, deactivate) in the system. | P0 |
| A-02 | As an admin, I want to approve or reject faculty leave requests. | P0 |
| A-03 | As an admin, I want to view a department-wide availability overview. | P1 |
| A-04 | As an admin, I want to manually trigger a calendar sync for a specific faculty member. | P1 |
| A-05 | As an admin, I want to see an audit log of all leave approvals and calendar sync events. | P2 |

### System Stories
| ID | Story | Priority |
|---|---|---|
| SY-01 | The system must sync each faculty member's Outlook calendar every 5 minutes. | P0 |
| SY-02 | The system must detect Out-of-Office (OOF) replies and mark faculty accordingly. | P0 |
| SY-03 | The system must merge approved leaves from the database with calendar data. | P0 |
| SY-04 | The system must expose a REST API so Salesforce (or any consumer) can query faculty availability. | P1 |

---

## 6. Functional Requirements

### 6.1 Core Dashboard (P0)

**FR-001**: The dashboard MUST display a real-time grid of all active faculty, each showing:
- Name and profile photo (or initials avatar)
- Department
- Current availability status (badge)
- Current/next event title (if not private)
- Time until next available slot

**FR-002**: Availability statuses supported:
| Status | Display | Trigger |
|---|---|---|
| Available | Green badge | No calendar events and no leave for this time slot |
| In Meeting | Amber badge | Calendar event of type Meeting/Appointment (Show As: Busy/Tentative) |
| Busy | Red badge | Calendar event with Show As: Busy and no Meeting keyword |
| On Leave | Purple badge | Approved leave in database OR OOF auto-reply enabled |
| Out of Office | Violet badge | OOF detected in Outlook Automatic Reply settings |
| Offline | Gray badge | Current time is outside working hours (configurable per faculty) |

**FR-003**: The dashboard MUST auto-refresh every 5 minutes without requiring a page reload.

**FR-004**: A last-synced timestamp MUST be shown in the header.

### 6.2 Faculty Profile & Schedule (P0/P1)

**FR-005**: Clicking a faculty card MUST open a detail panel showing:
- 5-day weekly schedule (Mon–Fri) with time blocks
- Each block colour-coded by status
- Event title (unless marked Private in Outlook)
- Duration and room/location (if present)

**FR-006**: The detail panel MUST indicate the next available time slot (within the next 7 days).

### 6.3 Availability Checker (P0)

**FR-007**: A "Check Availability" tool MUST allow users to:
- Select a date and time range
- See all faculty who are available in that window
- Optionally filter by department

**FR-008**: The checker MUST return results within 3 seconds.

### 6.4 Search & Filter (P1)

**FR-009**: Users MUST be able to:
- Search faculty by name (substring match, case-insensitive)
- Filter by department
- Filter by current availability status
- Sort by name, department, or availability

### 6.5 Leave Management (P0)

**FR-010**: Faculty or admins MUST be able to submit a leave request with:
- Start date and end date (full-day or partial)
- Leave type: Casual Leave · Earned Leave · Medical Leave · Conference · Other
- Reason / description (optional)
- Supporting document upload (optional, P2)

**FR-011**: Admins MUST be able to Approve, Reject, or Cancel leave requests.

**FR-012**: On approval, the system MUST:
- Mark the faculty as On Leave on the dashboard for the specified dates
- Optionally block the Outlook calendar via Graph API (if delegated access is granted)

**FR-013**: Leave requests MUST follow this state machine:
```
Pending → Approved → (can be Cancelled)
         ↓
       Rejected
```

### 6.6 Outlook Calendar Sync (P0)

**FR-014**: The sync engine MUST:
- Poll each active faculty member's calendar via Microsoft Graph API every 5 minutes
- Retrieve events in a rolling 7-day window (3 days past, 7 days future)
- Store a local cache in the database to serve the dashboard without blocking on Graph API calls
- Detect and cache OOF (Out-of-Office) status

**FR-015**: The system MUST handle Microsoft Graph API rate limits with exponential backoff and a circuit breaker.

**FR-016**: Each faculty member's calendar sync MUST be independent — a failure for one person MUST NOT block others.

### 6.7 Admin Panel (P0/P1)

**FR-017**: Admin panel MUST include:
- Faculty management (CRUD)
- Leave approval queue
- Manual sync trigger per faculty
- Department management
- Working hours configuration per faculty

**FR-018**: Admin access MUST be restricted via role-based access control.

---

## 7. Non-Functional Requirements

### Performance
| Requirement | Target |
|---|---|
| Dashboard initial load (P95) | ≤ 2 seconds |
| Faculty card status update | ≤ 5 minutes lag |
| Availability checker response | ≤ 3 seconds |
| Concurrent users supported | ≥ 500 |
| API response time (P99) | ≤ 500ms |

### Availability & Reliability
| Requirement | Target |
|---|---|
| Application uptime | ≥ 99.5% |
| Calendar sync uptime | ≥ 99% |
| Recovery Time Objective (RTO) | < 15 minutes |
| Recovery Point Objective (RPO) | < 5 minutes |

### Scalability
- Must scale horizontally to support multiple departments and campuses.
- Database must support ≥ 1,000 faculty records without performance degradation.

### Usability
- Passes WCAG 2.1 AA accessibility guidelines.
- Fully usable on mobile (screen width ≥ 320px).
- All critical actions achievable in ≤ 3 clicks.

### Internationalisation
- UI text externalised to support Hindi, Tamil, and other regional languages (i18n-ready architecture; translations not in scope for v1.0).

---

## 8. Data Model

### 8.1 Core Entities

```
Faculty
├── id (UUID)
├── name (string)
├── email (string, unique) — used as Microsoft 365 UPN
├── department_id (FK)
├── designation (string) — e.g. "Associate Professor"
├── phone (string, optional)
├── office_location (string)
├── avatar_url (string, optional)
├── azure_ad_object_id (string) — Microsoft Graph user ID
├── working_hours_start (time) — default 09:00
├── working_hours_end (time) — default 17:00
├── is_active (boolean)
├── created_at (timestamp)
└── updated_at (timestamp)

Department
├── id (UUID)
├── name (string)
├── code (string, unique) — e.g. "CS", "MATH"
└── head_faculty_id (FK, nullable)

CalendarEvent (local cache)
├── id (UUID)
├── faculty_id (FK)
├── outlook_event_id (string, unique) — Graph API event ID
├── subject (string, nullable if private)
├── start_time (timestamp with timezone)
├── end_time (timestamp with timezone)
├── show_as (enum: free, busy, tentative, out_of_office, working_elsewhere)
├── is_private (boolean)
├── is_all_day (boolean)
├── location (string, optional)
├── is_cancelled (boolean)
├── last_synced_at (timestamp)
└── raw_json (jsonb) — full Graph API response for future use

Leave
├── id (UUID)
├── faculty_id (FK)
├── leave_type (enum: casual, earned, medical, conference, other)
├── start_date (date)
├── end_date (date)
├── is_half_day (boolean)
├── half_day_period (enum: morning, afternoon, nullable)
├── reason (text, optional)
├── status (enum: pending, approved, rejected, cancelled)
├── submitted_at (timestamp)
├── reviewed_by (FK → User, nullable)
├── reviewed_at (timestamp, nullable)
└── admin_note (text, optional)

SyncLog
├── id (UUID)
├── faculty_id (FK)
├── sync_type (enum: calendar, oof, leave)
├── status (enum: success, partial, failed)
├── events_fetched (integer)
├── error_message (text, nullable)
└── synced_at (timestamp)

User (Application users — admins, faculty portal)
├── id (UUID)
├── faculty_id (FK, nullable) — if the user is a faculty
├── role (enum: student, faculty, admin, superadmin)
├── email (string)
├── azure_ad_object_id (string, nullable)
└── last_login (timestamp)
```

### 8.2 Availability Resolution Logic

```
FUNCTION resolveAvailability(facultyId, checkTime):
  1. If checkTime is outside working_hours → return OFFLINE
  2. Query Leave table: if approved leave covers checkTime → return ON_LEAVE
  3. Query CalendarEvent cache for checkTime:
     a. If show_as = OUT_OF_OFFICE → return OUT_OF_OFFICE
     b. If show_as = BUSY → return BUSY
     c. If event subject contains "meeting" keywords → return IN_MEETING
     d. If show_as = TENTATIVE → return IN_MEETING (tentative)
  4. If no blocking events → return AVAILABLE
```

---

## 9. UI/UX Requirements

### Layout
- Single-page application (SPA) with client-side routing.
- Three primary views: Dashboard · Availability Checker · Admin Panel.
- Persistent header with: logo, search bar, sync status, user avatar.
- Responsive grid: 4 columns (≥1280px) · 3 columns (≥1024px) · 2 columns (≥640px) · 1 column (<640px).

### Faculty Card Design
```
┌─────────────────────────────┐
│  [Avatar]  Dr. John Sharma  │
│            Computer Science │
│            ● Available      │
│  "Free until 2:00 PM"       │
│  Office: Block A, Room 201  │
│  [View Schedule]            │
└─────────────────────────────┘
```

### Status Colour Coding
| Status | Colour | Hex |
|---|---|---|
| Available | Emerald green | #10B981 |
| In Meeting | Amber | #F59E0B |
| Busy | Red | #EF4444 |
| On Leave | Violet | #8B5CF6 |
| Out of Office | Purple | #7C3AED |
| Offline | Gray | #6B7280 |
| Unknown/Syncing | Blue | #3B82F6 |

### Accessibility
- All interactive elements MUST be keyboard-navigable.
- Colour is never the sole indicator (always paired with icon and text).
- Minimum contrast ratio 4.5:1 for all text.
- ARIA labels on all icon buttons.

---

## 10. Integration Requirements

### 10.1 Microsoft Outlook / Microsoft 365

**INT-001**: Authentication via Microsoft OAuth 2.0 (MSAL) using Application (daemon) permissions for server-side sync:
- `Calendars.Read` — read calendars of all users
- `User.Read.All` — read user profiles
- `MailboxSettings.Read` — detect OOF / automatic replies
- `Presence.Read.All` (optional) — read real-time presence from Teams

**INT-002**: The application MUST support both:
- **Delegated access** (faculty logs in with Microsoft SSO and grants calendar access)
- **Application access** (admin grants tenant-wide consent; server reads all faculty calendars)

**INT-003**: Token refresh MUST be handled silently; expired tokens MUST trigger an automatic re-authentication.

### 10.2 Salesforce (Future — v2.0 Architecture)

See `SALESFORCE_INTEGRATION.md` for full details. Summary:
- REST API endpoints are Salesforce-consumer-compatible from day one.
- Faculty and Leave data models map to Salesforce custom objects.
- JWT Bearer flow for server-to-server authentication.
- A pre-built Lightning Web Component (LWC) wrapper will be provided in v2.0.

### 10.3 Institutional LDAP / Active Directory (Optional)

**INT-004**: Faculty profiles CAN be seeded from AD/LDAP directory on first run; subsequent updates are manual or via Graph API user sync.

---

## 11. Security Requirements

| Requirement | Detail |
|---|---|
| Authentication | Microsoft SSO (MSAL) for all users; fallback local JWT for development |
| Authorisation | RBAC: `student` (read-only dashboard), `faculty` (submit own leaves), `admin` (full CRUD), `superadmin` (system config) |
| Data in Transit | HTTPS (TLS 1.2+) enforced everywhere; no mixed content |
| Data at Rest | AES-256 encryption for database; secrets in environment variables / Azure Key Vault |
| Calendar Data | Only subject and time are stored locally; full event bodies are never persisted |
| Private Events | Events marked Private in Outlook → only show status (Busy), never the subject |
| PII Handling | Faculty email addresses are not exposed in public API endpoints; use faculty ID instead |
| Rate Limiting | API endpoints rate-limited at 100 req/min per IP |
| CSRF | SameSite cookie attribute + CSRF tokens for all state-changing operations |
| Dependency Security | Automated dependency auditing in CI/CD pipeline |

---

## 12. Out of Scope (v1.0)

- Direct meeting booking / appointment scheduling within the app.
- Video call integration (Teams / Zoom links).
- Faculty workload analytics.
- Google Calendar integration.
- Native mobile app (iOS/Android) — responsive web covers mobile.
- Student login / personalised views.
- Salesforce LWC component (architected for; built in v2.0).
- Email / push notification system.
- Multi-tenant / multi-institution support.

---

## 13. Future Enhancements

| Version | Feature |
|---|---|
| v1.1 | Email notifications when a faculty becomes available |
| v1.2 | Meeting booking: student can book a slot from the dashboard |
| v2.0 | Salesforce LWC widget; native SF Experience Cloud page |
| v2.0 | Google Calendar integration |
| v2.1 | Analytics dashboard for department heads |
| v3.0 | AI-powered "best time to meet" recommendation engine |
| v3.0 | Multi-institution / multi-tenant support |

---

## 14. Glossary

| Term | Definition |
|---|---|
| OOF | Out of Office — Microsoft Exchange term for automatic out-of-office replies |
| Graph API | Microsoft Graph API — unified REST API to access Microsoft 365 data |
| MSAL | Microsoft Authentication Library |
| LWC | Lightning Web Component — Salesforce frontend framework |
| Show As | Outlook calendar event property: Free, Tentative, Busy, Out of Office, Working Elsewhere |
| UPN | User Principal Name — the Microsoft 365 login email used as a unique identifier |
| RBAC | Role-Based Access Control |
| SPA | Single Page Application |
| SLA | Service Level Agreement |

---

*End of PRD v1.0*
