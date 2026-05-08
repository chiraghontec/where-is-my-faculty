# Salesforce Integration Guide
# Where Is My Faculty — Salesforce v2.0

**Version**: 1.0 (Planning)  
**Date**: May 2026  
**Target Release**: v2.0

---

## Overview

This document describes how to integrate the **Where Is My Faculty** application into an existing Salesforce org. The integration is designed to be non-destructive — the standalone application continues to operate independently, and Salesforce consumes its REST API as an external data source.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Salesforce Org                         │
│                                                          │
│  ┌────────────────┐    ┌─────────────────────────────┐  │
│  │  Experience    │    │  Lightning Web Component    │  │
│  │  Cloud Page    │    │  (FacultyDashboard.lwc)     │  │
│  └───────┬────────┘    └────────────────┬────────────┘  │
│          │                              │               │
│          └──────────────┬───────────────┘               │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │          Salesforce REST Callout Layer           │   │
│  │  Named Credential: WhereIsMyFaculty_API          │   │
│  │  External Service: FacultyAvailabilityService    │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS + JWT Bearer
                          │
┌─────────────────────────▼───────────────────────────────┐
│         Where Is My Faculty REST API                     │
│         https://api.whereis.myfaculty.edu               │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Create a Connected App in Where Is My Faculty

In the WIMF admin panel or environment config, create a Salesforce service account:

1. Navigate to **Admin → API Integrations → New Connected App**
2. Set:
   - **App Name**: `salesforce-integration`
   - **Grant Type**: `client_credentials` (JWT Bearer)
   - **Scopes**: `faculty:read`, `availability:read`, `leaves:read`
3. Download the `private_key.pem` generated for the Connected App.

---

## Step 2: Configure Salesforce Named Credential

In Salesforce Setup → Named Credentials → New:

```
Label:          WhereIsMyFaculty_API
Name:           WhereIsMyFaculty_API
URL:            https://api.whereis.myfaculty.edu
Identity Type:  Named Principal
Auth Protocol:  JWT Token
Issuer:         salesforce-integration
Subject:        sf-service@university.edu
Audience:       https://api.whereis.myfaculty.edu
Token Endpoint: https://api.whereis.myfaculty.edu/api/auth/token
JWT Signing Cert: [Upload private_key.pem]
```

---

## Step 3: Define Salesforce External Service

Using the OpenAPI 3.0 spec from `GET /api/openapi.json`, register an External Service:

1. Setup → External Services → New External Service
2. Name: `FacultyAvailabilityService`
3. Named Credential: `WhereIsMyFaculty_API`
4. Paste the OpenAPI spec (or provide the spec URL)

This auto-generates Apex classes for calling the API:

```apex
// Auto-generated Apex action
ExternalService.FacultyAvailabilityService.getFaculty_Response result =
    ExternalService.FacultyAvailabilityService.getFaculty(null, null, null, null);

List<ExternalService.FacultyAvailabilityService.Faculty_Output> facultyList =
    result.Code200.data;
```

---

## Step 4: Create Salesforce Custom Objects

Run the following in Setup → Object Manager → New Custom Object:

### Faculty__c

| Field | API Name | Type |
|---|---|---|
| Name | Name | Text(80) |
| Email | Email__c | Email |
| Department | Department__c | Text(100) |
| Designation | Designation__c | Text(100) |
| Office Location | OfficeLocation__c | Text(200) |
| Avatar URL | AvatarUrl__c | URL |
| WIMF Faculty ID | WIMFFacultyId__c | Text(36) — External ID |
| Is Active | IsActive__c | Checkbox |

### FacultyAvailability__c

| Field | API Name | Type |
|---|---|---|
| Faculty | Faculty__c | Master-Detail(Faculty__c) |
| Status | Status__c | Picklist (available, busy, in_meeting, on_leave, offline) |
| Current Event | CurrentEvent__c | Text(255) |
| Free Until | FreeUntil__c | DateTime |
| Last Synced | LastSynced__c | DateTime |
| As Of Time | AsOfTime__c | DateTime |

### FacultyLeave__c

| Field | API Name | Type |
|---|---|---|
| Faculty | Faculty__c | Master-Detail(Faculty__c) |
| Leave Type | LeaveType__c | Picklist |
| Start Date | StartDate__c | Date |
| End Date | EndDate__c | Date |
| Status | Status__c | Picklist |
| Reason | Reason__c | Long Text Area |
| WIMF Leave ID | WIMFLeaveId__c | Text(36) — External ID |

---

## Step 5: Apex Sync Class

```apex
/**
 * WIMFFacultySyncBatch.cls
 * Syncs faculty and availability data from the WIMF API into Salesforce.
 * Schedule to run every 5 minutes via Schedulable interface.
 */
public class WIMFFacultySyncBatch implements Database.Batchable<Object>, Database.AllowsCallouts {

    public List<Object> start(Database.BatchableContext bc) {
        // Fetch faculty list from WIMF API
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:WhereIsMyFaculty_API/api/faculty?includeAvailability=true');
        req.setMethod('GET');
        req.setHeader('Accept', 'application/json');

        HttpResponse res = new Http().send(req);
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        return (List<Object>) body.get('data');
    }

    public void execute(Database.BatchableContext bc, List<Object> scope) {
        List<Faculty__c> toUpsert = new List<Faculty__c>();

        for (Object item : scope) {
            Map<String, Object> f = (Map<String, Object>) item;
            Map<String, Object> avail = (Map<String, Object>) f.get('availability');

            Faculty__c fac = new Faculty__c(
                WIMFFacultyId__c  = (String) f.get('id'),
                Name              = (String) f.get('name'),
                Email__c          = (String) f.get('email'),
                Designation__c    = (String) f.get('designation'),
                OfficeLocation__c = (String) f.get('officeLocation'),
                IsActive__c       = true
            );
            toUpsert.add(fac);
        }

        Database.upsert(toUpsert, Faculty__c.WIMFFacultyId__c, false);
    }

    public void finish(Database.BatchableContext bc) {
        // Optional: send notification
    }
}
```

---

## Step 6: Lightning Web Component (FacultyDashboard.lwc)

```javascript
// facultyDashboard.js
import { LightningElement, track, wire } from 'lwc';
import getFacultyAvailability from '@salesforce/apex/WIMFController.getFacultyAvailability';

export default class FacultyDashboard extends LightningElement {
    @track faculty = [];
    @track searchTerm = '';
    @track selectedDepartment = '';

    @wire(getFacultyAvailability, { department: '$selectedDepartment' })
    wiredFaculty({ data, error }) {
        if (data) this.faculty = data;
    }

    get filteredFaculty() {
        return this.faculty.filter(f =>
            f.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }
}
```

```html
<!-- facultyDashboard.html -->
<template>
    <lightning-card title="Faculty Availability" icon-name="standard:contact">
        <div class="slds-m-around_medium">
            <lightning-input
                type="search"
                label="Search Faculty"
                onchange={handleSearch}>
            </lightning-input>

            <div class="slds-grid slds-wrap slds-gutters slds-m-top_medium">
                <template for:each={filteredFaculty} for:item="faculty">
                    <div key={faculty.WIMFFacultyId__c} class="slds-col slds-size_1-of-3">
                        <lightning-card title={faculty.Name} icon-name="standard:user">
                            <div class="slds-m-around_small">
                                <p>{faculty.Designation__c}</p>
                                <p>{faculty.Department__c}</p>
                                <lightning-badge
                                    label={faculty.FacultyAvailability__r.Status__c}
                                    class={faculty.statusClass}>
                                </lightning-badge>
                            </div>
                        </lightning-card>
                    </div>
                </template>
            </div>
        </div>
    </lightning-card>
</template>
```

---

## Step 7: Platform Events for Real-Time Updates (Optional)

For real-time Salesforce updates (without polling), configure Platform Events:

1. Create Platform Event: `FacultyStatusChanged__e`
   - Fields: `FacultyId__c`, `NewStatus__c`, `ChangedAt__c`

2. In WIMF backend, publish to Salesforce Platform Events on status change:

```typescript
// In sync.service.ts — after each sync cycle
async publishToSalesforce(facultyId: string, newStatus: string) {
  const sfToken = await getSalesforceToken();
  await axios.post(
    `${SF_ORG_URL}/services/data/v59.0/sobjects/FacultyStatusChanged__e`,
    {
      FacultyId__c: facultyId,
      NewStatus__c: newStatus,
      ChangedAt__c: new Date().toISOString()
    },
    { headers: { Authorization: `Bearer ${sfToken}` } }
  );
}
```

3. Subscribe to Platform Event in LWC:

```javascript
import { subscribe, MessageContext } from 'lightning/empApi';

connectedCallback() {
    subscribe('/event/FacultyStatusChanged__e', -1, (event) => {
        const { FacultyId__c, NewStatus__c } = event.data.payload;
        this.updateFacultyStatus(FacultyId__c, NewStatus__c);
    });
}
```

---

## API Compatibility Checklist

Before integrating with Salesforce, verify:

- [ ] REST API is accessible from Salesforce Trust IP ranges
- [ ] TLS 1.2+ is enforced on the WIMF API endpoint
- [ ] JWT Bearer token auth is configured and tested
- [ ] Named Credential is created and tested with a simple callout
- [ ] All API responses are under 6MB (Salesforce callout response limit)
- [ ] API response time < 120 seconds (Salesforce callout timeout)
- [ ] OpenAPI spec is registered as an External Service
- [ ] Custom objects are created in sandbox first
- [ ] Permission sets grant read access to integration user

---

## Security Considerations

1. **Separate service account**: Create a dedicated WIMF user with only `faculty:read` scope for the Salesforce integration.
2. **IP allowlisting**: Restrict the WIMF API to only accept Salesforce NAT IP ranges for the Salesforce service account.
3. **Audit logging**: All Salesforce callouts are logged in `SyncLog` with the actor `salesforce-integration`.
4. **Data minimisation**: The Salesforce integration only receives faculty name, department, designation, office location, and current availability status — not email addresses or calendar event details.

---

*End of Salesforce Integration Guide v1.0*
