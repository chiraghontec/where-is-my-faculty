# API Reference
# Where Is My Faculty — REST API v1.0

**Base URL**: `https://api.whereis.myfaculty.edu/api`  
**Content-Type**: `application/json`  
**Authentication**: Bearer JWT token in `Authorization` header (optional for read-only endpoints)

---

## Response Envelope

All responses follow this structure:

```json
// Success
{
  "success": true,
  "data": <T>,
  "meta": { "total": 42, "lastSynced": "2026-05-08T10:30:00Z" }
}

// Error
{
  "success": false,
  "error": {
    "code": "FACULTY_NOT_FOUND",
    "message": "Faculty member with ID xyz not found",
    "statusCode": 404
  }
}
```

---

## Health

### `GET /health`

Returns API and dependency health status.

**Response**:
```json
{
  "status": "ok",
  "service": "where-is-my-faculty-api",
  "version": "1.0.0",
  "timestamp": "2026-05-08T10:30:00Z",
  "uptime": 3600
}
```

---

## Faculty

### `GET /faculty`

Returns all active faculty with their current availability status.

**Query parameters**:
| Parameter | Type | Description |
|---|---|---|
| `search` | string | Search by name or department (case-insensitive) |
| `departmentId` | string | Filter by department ID |
| `status` | string | Comma-separated status values: `available,in_meeting,busy,on_leave,offline` |
| `sortBy` | string | `name` \| `department` \| `status` |
| `sortOrder` | string | `asc` \| `desc` |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f1",
      "name": "Dr. Priya Sharma",
      "email": "p.sharma@university.edu",
      "department": {
        "id": "d1",
        "name": "Computer Science & Engineering",
        "code": "CSE"
      },
      "designation": "Associate Professor",
      "officeLocation": "Block A, Room 201",
      "workingHoursStart": "09:00",
      "workingHoursEnd": "17:30",
      "isActive": true,
      "availability": {
        "status": "available",
        "statusLabel": "Available",
        "freeUntil": "2026-05-08T14:00:00Z",
        "currentEvent": null,
        "nextEvent": {
          "id": "ev1",
          "subject": "Algorithms Lecture",
          "startTime": "2026-05-08T14:00:00Z",
          "endTime": "2026-05-08T15:00:00Z",
          "showAs": "busy",
          "isPrivate": false,
          "location": "LT-3"
        }
      },
      "lastSynced": "2026-05-08T10:30:00Z"
    }
  ],
  "meta": { "total": 10, "lastSynced": "2026-05-08T10:30:00Z" }
}
```

---

### `GET /faculty/:id`

Returns a single faculty member with their full week schedule.

**Path parameters**:
| Parameter | Description |
|---|---|
| `id` | Faculty UUID |

**Response** (includes `weekSchedule` array of `DaySchedule` objects):
```json
{
  "success": true,
  "data": {
    "id": "f1",
    "name": "Dr. Priya Sharma",
    "weekSchedule": [
      {
        "date": "2026-05-08",
        "dayLabel": "Thursday",
        "isWorkingDay": true,
        "events": [
          {
            "id": "ev1",
            "subject": "B.Tech Lecture — Data Structures",
            "startTime": "2026-05-08T09:00:00Z",
            "endTime": "2026-05-08T10:00:00Z",
            "showAs": "busy",
            "isPrivate": false,
            "location": "LT-3"
          }
        ]
      }
    ]
  }
}
```

---

### `POST /faculty`

Create a new faculty member. **Requires admin role.**

**Request body**:
```json
{
  "name": "Dr. New Faculty",
  "email": "new.faculty@university.edu",
  "departmentId": "d1",
  "designation": "Assistant Professor",
  "officeLocation": "Block C, Room 102",
  "azureAdObjectId": "azure-object-id",
  "workingHoursStart": "09:00",
  "workingHoursEnd": "17:30"
}
```

---

### `PUT /faculty/:id`

Update a faculty member. **Requires admin role.**

**Request body**: Any subset of `POST /faculty` fields.

---

## Availability

### `GET /availability`

Check faculty availability for a specific time window.

**Query parameters**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `date` | string | Yes | Date in `YYYY-MM-DD` format |
| `startTime` | string | Yes | Start time in `HH:mm` format |
| `endTime` | string | Yes | End time in `HH:mm` format |
| `departmentId` | string | No | Filter by department |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "facultyId": "f1",
      "available": true,
      "conflictingEvents": []
    },
    {
      "facultyId": "f2",
      "available": false,
      "conflictingEvents": [
        {
          "id": "ev2",
          "subject": "Department Meeting",
          "startTime": "2026-05-08T10:00:00Z",
          "endTime": "2026-05-08T11:00:00Z",
          "showAs": "busy",
          "isPrivate": false
        }
      ]
    }
  ]
}
```

---

## Leaves

### `GET /leaves`

List leave requests.

**Query parameters**:
| Parameter | Type | Description |
|---|---|---|
| `facultyId` | string | Filter by faculty |
| `status` | string | `pending` \| `approved` \| `rejected` \| `cancelled` |

---

### `POST /leaves`

Submit a new leave request.

**Request body**:
```json
{
  "facultyId": "f1",
  "leaveType": "casual",
  "startDate": "2026-05-15",
  "endDate": "2026-05-17",
  "isHalfDay": false,
  "reason": "Family event"
}
```

**Leave types**: `casual` | `earned` | `medical` | `conference` | `other`

---

### `PUT /leaves/:id/approve`

Approve a leave request. **Requires admin role.**

**Request body**:
```json
{ "adminNote": "Approved. Please arrange coverage." }
```

---

### `PUT /leaves/:id/reject`

Reject a leave request. **Requires admin role.**

**Request body**:
```json
{ "adminNote": "Insufficient staffing during this period." }
```

---

### `DELETE /leaves/:id`

Cancel a leave request (sets status to `cancelled`).

---

## Departments

### `GET /departments`

Returns all departments.

```json
{
  "success": true,
  "data": [
    { "id": "d1", "name": "Computer Science & Engineering", "code": "CSE" }
  ]
}
```

---

## Sync

### `POST /sync/trigger`

Trigger a full calendar sync for all active faculty. **Requires admin role.**

**Response**:
```json
{
  "success": true,
  "data": { "synced": 10, "message": "Calendar sync initiated for all active faculty" }
}
```

---

### `POST /sync/trigger/:facultyId`

Trigger calendar sync for one faculty member. **Requires admin role.**

---

### `GET /sync/status`

Returns sync status and schedule.

```json
{
  "success": true,
  "data": {
    "lastSync": "2026-05-08T10:30:00Z",
    "nextSync": "2026-05-08T10:35:00Z",
    "syncIntervalMinutes": 5,
    "activeFaculty": 10
  }
}
```

---

## Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 429 | Rate limit exceeded (100 req/min per IP) |
| 500 | Internal server error |

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `FACULTY_NOT_FOUND` | 404 | Faculty ID does not exist |
| `LEAVE_NOT_FOUND` | 404 | Leave ID does not exist |
| `VALIDATION_ERROR` | 400 | Missing or invalid request body fields |
| `INVALID_STATE` | 400 | State transition not allowed (e.g., approving already rejected leave) |
| `UNAUTHORIZED` | 401 | No or invalid auth token |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Salesforce External Services Compatibility

This API follows conventions compatible with Salesforce External Services:
- All responses are under 6MB
- Response time targets under 120 seconds
- Standard HTTP verbs and status codes
- Consistent JSON response envelope
- UUIDs for all resource identifiers
- ISO 8601 timestamps throughout

Register this API as a Salesforce External Service using the OpenAPI spec at `GET /api/openapi.json` (available in production).

---

*API Reference v1.0 — Where Is My Faculty*
