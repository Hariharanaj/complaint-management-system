# 🔐 Authentication & Authorization Flow

## Overview

The system uses **JWT (JSON Web Tokens)** for stateless authentication and
**role-based access control (RBAC)** with two roles: `USER` and `SUPPORT`.

---

## 1. Authentication Flow

### Registration Flow

```
  Client                          Server                        Database
    │                               │                              │
    │  POST /api/auth/register      │                              │
    │  { username, email,           │                              │
    │    password, role }           │                              │
    │──────────────────────────────>│                              │
    │                               │  Validate input              │
    │                               │  Check duplicate user        │
    │                               │─────────────────────────────>│
    │                               │  <── user exists? ──────────│
    │                               │                              │
    │                               │  Hash password (bcrypt)      │
    │                               │  INSERT new user             │
    │                               │─────────────────────────────>│
    │                               │  <── user created ──────────│
    │                               │                              │
    │                               │  Generate JWT                │
    │                               │  (embed: id, username,       │
    │                               │   email, role)               │
    │  <── 201 { token, user } ────│                              │
    │                               │                              │
    │  Store token in localStorage  │                              │
    │  Redirect to dashboard        │                              │
```

### Login Flow

```
  Client                          Server                        Database
    │                               │                              │
    │  POST /api/auth/login         │                              │
    │  { email, password }          │                              │
    │──────────────────────────────>│                              │
    │                               │  Find user by email          │
    │                               │─────────────────────────────>│
    │                               │  <── user record ───────────│
    │                               │                              │
    │                               │  Compare password (bcrypt)   │
    │                               │                              │
    │                               │  Generate JWT                │
    │  <── 200 { token, user } ────│                              │
    │                               │                              │
    │  Store token in localStorage  │                              │
    │  Redirect based on role       │                              │
```

---

## 2. JWT Token Structure

### Payload Claims

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "USER",
  "iat": 1739438400,          // Issued at
  "exp": 1739524800           // Expires (24h later)
}
```

### Configuration (from `.env`)

| Variable       | Value                  | Description              |
|----------------|------------------------|--------------------------|
| JWT_SECRET     | (secret key string)    | Signing key for tokens   |
| JWT_EXPIRES_IN | 24h                    | Token validity duration  |

---

## 3. Request Authentication (Middleware)

Every protected API call goes through the `authenticate` middleware:

```
  Client Request                    Middleware                     Route Handler
    │                                  │                              │
    │  Authorization: Bearer <token>   │                              │
    │─────────────────────────────────>│                              │
    │                                  │  Extract Bearer token        │
    │                                  │  Verify with JWT_SECRET      │
    │                                  │                              │
    │                                  │  ✅ Valid?                    │
    │                                  │  → Attach decoded user       │
    │                                  │    to req.user               │
    │                                  │─────────────────────────────>│
    │                                  │                              │
    │                                  │  ❌ Invalid/Expired?         │
    │  <── 401 Unauthorized ──────────│                              │
```

---

## 4. Role-Based Access Control (RBAC)

### Authorization Middleware

The `authorize(...roles)` middleware factory restricts endpoints by role:

```javascript
// Example usage in routes:
router.post('/',    authorize('USER'),    createComplaint);
router.put('/:id/status', authorize('SUPPORT'), updateStatus);
```

### Access Control Matrix

| Endpoint                          | Public | USER | SUPPORT |
|-----------------------------------|--------|------|---------|
| POST /api/auth/register           | ✅     | —    | —       |
| POST /api/auth/login              | ✅     | —    | —       |
| POST /api/complaints              | ❌     | ✅   | ❌      |
| GET /api/complaints               | ❌     | ✅ (own) | ✅ (all) |
| GET /api/complaints/:id           | ❌     | ✅ (own) | ✅      |
| PUT /api/complaints/:id/status    | ❌     | ❌   | ✅      |
| POST /api/complaints/:id/feedback | ❌     | ✅ (own, CLOSED only) | ❌ |

---

## 5. Frontend Auth Guards

Each frontend page performs a client-side auth check on load:

| Page           | Guard Logic                                          |
|----------------|------------------------------------------------------|
| `index.html`   | If token exists → redirect to role-based dashboard   |
| `user.html`    | If no token → redirect to login; if SUPPORT → redirect to support.html |
| `support.html` | If no token → redirect to login; if USER → redirect to user.html      |

### Token Storage

- **Storage Location:** `localStorage`
- **Keys:** `cms_token` (JWT string), `cms_user` (JSON user object)
- **On Logout:** Both keys are removed, redirect to login page
- **On 401 Response:** Token is cleared automatically, redirect to login

---

## 6. Security Considerations

| Measure                    | Implementation                              |
|----------------------------|---------------------------------------------|
| Password hashing           | bcrypt with salt rounds = 10                |
| Token-based auth           | JWT with configurable expiry                |
| Secret management          | JWT_SECRET loaded from `.env` file          |
| Input validation           | Server-side validation on all endpoints     |
| SQL injection prevention   | Parameterized queries via better-sqlite3    |
| XSS prevention             | HTML escaping via `escapeHtml()` utility    |
| CORS                       | Enabled via `cors` middleware               |
