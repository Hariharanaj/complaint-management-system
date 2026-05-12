# ⚙️ Business Rules & Validations

## Overview

This document outlines all business rules enforced by the system, including
validation rules, status transitions, and access control constraints.

---

## 1. User Registration Rules

| Rule                                  | Enforcement Layer   | Error Code |
|---------------------------------------|---------------------|------------|
| Username is required                  | Backend + Frontend  | 400        |
| Username ≥ 3 characters               | Backend + Frontend  | 400        |
| Username must be unique               | Database (UNIQUE)   | 409        |
| Email is required                     | Backend + Frontend  | 400        |
| Email must be valid format            | Backend (regex)     | 400        |
| Email must be unique                  | Database (UNIQUE)   | 409        |
| Password is required                  | Backend + Frontend  | 400        |
| Password ≥ 6 characters               | Backend + Frontend  | 400        |
| Role must be USER or SUPPORT          | Database (CHECK)    | —          |
| Default role is USER                  | Database (DEFAULT)  | —          |

---

## 2. Complaint Submission Rules

| Rule                                  | Enforcement Layer   | Error Code |
|---------------------------------------|---------------------|------------|
| Title is required                     | Backend + Frontend  | 400        |
| Title ≥ 5 characters                  | Backend + Frontend  | 400        |
| Description is required               | Backend + Frontend  | 400        |
| Description ≥ 10 characters           | Backend + Frontend  | 400        |
| Only USER role can create complaints  | Backend (authorize) | 403        |
| Initial status is always OPEN         | Database (DEFAULT)  | —          |
| Category defaults to "General"        | Database (DEFAULT)  | —          |

---

## 3. Complaint Status Rules

### Valid Status Values

```
OPEN  |  IN_PROGRESS  |  CLOSED
```

Enforced by: Database CHECK constraint + Backend validation

### Status Update Rules

| Rule                                           | Enforcement Layer   | Error Code |
|------------------------------------------------|---------------------|------------|
| Only SUPPORT role can update status            | Backend (authorize) | 403        |
| Status must be one of: OPEN, IN_PROGRESS, CLOSED | Backend + Database | 400       |
| Complaint must exist                           | Backend             | 404        |
| updated_at is refreshed on every status change | Backend (SQL)       | —          |

### Status Transition Diagram

```
     ┌────────────────────────────────────────┐
     │                                        │
     ▼                                        │
   OPEN ──────────> IN_PROGRESS ──────────> CLOSED
     │                                        ▲
     │                                        │
     └────────────────────────────────────────┘
              (direct closure allowed)
```

> **Note:** There are no restrictions on which status transitions are valid.
> SUPPORT can set any valid status at any time.

---

## 4. ⚠️ Feedback Rules (Critical Business Rule)

### The Primary Business Rule

> **Feedback can ONLY be submitted after a complaint is marked as CLOSED.**  
> Any feedback attempt before closure MUST be rejected.

### Enforcement Details

| Rule                                                  | Enforcement Layer     | Error Code |
|-------------------------------------------------------|-----------------------|------------|
| **Complaint must be CLOSED before feedback**          | Backend (explicit check) | 400     |
| Only USER role can submit feedback                    | Backend (authorize)   | 403        |
| User can only give feedback on their OWN complaints   | Backend (ownership check) | 403   |
| Only ONE feedback per complaint                       | Database (UNIQUE constraint) | 409 |
| Rating is required                                    | Backend               | 400        |
| Rating must be 1–5                                    | Backend + Database (CHECK) | 400  |
| Comment is optional                                   | Backend               | —          |

### Feedback Flow

```
  USER clicks "Give Feedback"
        │
        ▼
  Is complaint CLOSED?  ──── NO ───> ❌ Reject (400)
        │                             "Feedback can only be submitted
        YES                            after complaint is marked as CLOSED."
        │
        ▼
  Has feedback been submitted?  ── YES ──> ❌ Reject (409)
        │                                   "Feedback already submitted."
        NO
        │
        ▼
  ✅ Accept & store feedback
```

### Frontend Enforcement

- The "Give Feedback" button is **only rendered** when complaint status = CLOSED
- After feedback is submitted, the button is replaced with "✅ Feedback Submitted"
- The feedback modal is only accessible for CLOSED complaints

---

## 5. Data Visibility Rules

| Data                     | USER Access                | SUPPORT Access          |
|--------------------------|----------------------------|-------------------------|
| Own complaints           | ✅ Full access             | ✅ Full access          |
| Other users' complaints  | ❌ Cannot see              | ✅ Can see all          |
| Own complaint feedback   | ✅ Can submit & view       | ✅ Can view             |
| Other users' feedback    | ❌ Cannot see              | ✅ Can view             |
| User details             | Own profile only           | Username + email visible |

---

## 6. Input Validation Summary

### Server-Side Validations (always enforced)

| Field             | Validation                                  |
|-------------------|---------------------------------------------|
| username          | Required, ≥ 3 chars                         |
| email             | Required, valid format (regex)              |
| password          | Required, ≥ 6 chars                         |
| complaint title   | Required, ≥ 5 chars                         |
| complaint desc    | Required, ≥ 10 chars                        |
| status            | Must be OPEN / IN_PROGRESS / CLOSED         |
| rating            | Required, integer 1–5                       |

### Client-Side Validations (UX enhancement)

- HTML5 `required`, `minlength` attributes
- HTML5 `type="email"` for email validation
- Dropdown-only selection for roles, categories, and statuses
