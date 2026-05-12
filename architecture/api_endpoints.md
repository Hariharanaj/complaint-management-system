# 🔌 API Endpoints Reference

## Base URL

```
http://localhost:5050/api
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a valid JWT token
in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Auth Routes (`/api/auth`)

### POST `/api/auth/register`

**Description:** Register a new user account.  
**Auth Required:** No  
**Roles:** Public  

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass",
  "role": "USER"           // "USER" or "SUPPORT"
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful.",
  "token": "eyJhbGciOiJI...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**Error Responses:**
| Status | Condition                          |
|--------|------------------------------------|
| 400    | Missing/invalid fields             |
| 409    | Username or email already exists   |
| 500    | Internal server error              |

---

### POST `/api/auth/login`

**Description:** Authenticate and receive a JWT token.  
**Auth Required:** No  
**Roles:** Public  

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJI...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**Error Responses:**
| Status | Condition                     |
|--------|-------------------------------|
| 400    | Missing email or password     |
| 401    | Invalid credentials           |
| 500    | Internal server error         |

---

## 2. Complaint Routes (`/api/complaints`)

> All complaint routes require JWT authentication.

### POST `/api/complaints`

**Description:** Submit a new complaint.  
**Auth Required:** Yes  
**Roles:** USER only  

**Request Body:**
```json
{
  "title": "Internet not working",
  "description": "My internet has been down for 3 hours.",
  "category": "Technical"    // Optional, defaults to "General"
}
```

**Success Response (201):**
```json
{
  "message": "Complaint submitted successfully.",
  "complaint": {
    "id": 1,
    "user_id": 1,
    "title": "Internet not working",
    "description": "My internet has been down for 3 hours.",
    "category": "Technical",
    "status": "OPEN",
    "created_at": "2026-02-13 08:00:00",
    "updated_at": "2026-02-13 08:00:00"
  }
}
```

**Error Responses:**
| Status | Condition                              |
|--------|----------------------------------------|
| 400    | Missing/short title or description     |
| 403    | Not a USER role                        |
| 401    | Missing/invalid token                  |

---

### GET `/api/complaints`

**Description:** Retrieve complaints.  
- **USER**: returns only their own complaints  
- **SUPPORT**: returns all complaints with user info  

**Auth Required:** Yes  
**Roles:** USER, SUPPORT  

**Success Response (200):**
```json
{
  "complaints": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Internet not working",
      "description": "...",
      "category": "Technical",
      "status": "OPEN",
      "created_at": "2026-02-13 08:00:00",
      "updated_at": "2026-02-13 08:00:00",
      "has_feedback": 0,
      "username": "johndoe",          // SUPPORT only
      "user_email": "john@example.com" // SUPPORT only
    }
  ]
}
```

---

### GET `/api/complaints/:id`

**Description:** Get a single complaint with feedback details.  
**Auth Required:** Yes  
**Roles:** USER (own only), SUPPORT (any)  

**Success Response (200):**
```json
{
  "complaint": { ... },
  "feedback": {
    "id": 1,
    "complaint_id": 1,
    "user_id": 1,
    "rating": 5,
    "comment": "Great support!",
    "created_at": "2026-02-13 10:00:00"
  }
}
```

**Error Responses:**
| Status | Condition                           |
|--------|-------------------------------------|
| 404    | Complaint not found                 |
| 403    | USER trying to view another's complaint |

---

### PUT `/api/complaints/:id/status`

**Description:** Update the status of a complaint.  
**Auth Required:** Yes  
**Roles:** SUPPORT only  

**Request Body:**
```json
{
  "status": "IN_PROGRESS"    // "OPEN", "IN_PROGRESS", or "CLOSED"
}
```

**Success Response (200):**
```json
{
  "message": "Complaint status updated to IN_PROGRESS.",
  "complaint": { ... }
}
```

**Error Responses:**
| Status | Condition                     |
|--------|-------------------------------|
| 400    | Invalid status value          |
| 403    | Not a SUPPORT role            |
| 404    | Complaint not found           |

---

### POST `/api/complaints/:id/feedback`

**Description:** Submit feedback for a resolved complaint.  
**Auth Required:** Yes  
**Roles:** USER only  

**⚠️ Business Rule:** Complaint **must** have status `CLOSED` before feedback is accepted.

**Request Body:**
```json
{
  "rating": 5,              // 1 to 5
  "comment": "Great support!" // Optional
}
```

**Success Response (201):**
```json
{
  "message": "Feedback submitted successfully.",
  "feedback": {
    "id": 1,
    "complaint_id": 1,
    "user_id": 1,
    "rating": 5,
    "comment": "Great support!",
    "created_at": "2026-02-13 10:00:00"
  }
}
```

**Error Responses:**
| Status | Condition                                     |
|--------|-----------------------------------------------|
| 400    | Invalid rating or complaint not CLOSED         |
| 403    | Not the complaint owner                        |
| 404    | Complaint not found                            |
| 409    | Feedback already submitted for this complaint  |

---

## 3. Utility Routes

### GET `/api/health`

**Description:** Health check endpoint.  
**Auth Required:** No  

**Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2026-02-13T08:00:00.000Z"
}
```

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```
