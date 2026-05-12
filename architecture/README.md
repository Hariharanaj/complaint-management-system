# 🛡️ Complaint Management System — Architecture Document

## 1. System Overview

The Complaint Management System (CMS) is a full-stack web application that enables
**Users** to raise complaints and **Support Staff** to manage their resolution.
The system enforces strict resolution flow rules (e.g., feedback only after closure)
and persists all data in a relational database.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│                                                         │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ index.html│  │  user.html    │  │  support.html    │  │
│  │ (Auth)    │  │ (User Dash)   │  │ (Support Dash)   │  │
│  └─────┬────┘  └──────┬────────┘  └────────┬─────────┘  │
│        │              │                     │            │
│        └──────────────┼─────────────────────┘            │
│                       │                                  │
│               ┌───────┴───────┐                          │
│               │  js/api.js    │  (API Client + JWT)      │
│               └───────┬───────┘                          │
└───────────────────────┼──────────────────────────────────┘
                        │  HTTP (REST API)
                        │  Authorization: Bearer <JWT>
┌───────────────────────┼──────────────────────────────────┐
│                 SERVER (Node.js + Express)                │
│                       │                                  │
│               ┌───────┴───────┐                          │
│               │  server.js    │  (Entry Point)           │
│               └───────┬───────┘                          │
│                       │                                  │
│         ┌─────────────┼─────────────────┐                │
│         │             │                 │                │
│  ┌──────┴──────┐ ┌────┴──────────┐ ┌────┴────────────┐  │
│  │ routes/     │ │ middleware/   │ │ db/              │  │
│  │  auth.js    │ │  auth.js     │ │  database.js     │  │
│  │  complaints │ │ (JWT verify) │ │ (SQLite init)    │  │
│  └─────────────┘ └──────────────┘ └────────┬─────────┘  │
│                                            │             │
└────────────────────────────────────────────┼─────────────┘
                                             │
                                    ┌────────┴────────┐
                                    │  SQLite DB      │
                                    │  complaints.db  │
                                    └─────────────────┘
```

---

## 3. Technology Stack

| Layer          | Technology              | Purpose                          |
|----------------|-------------------------|----------------------------------|
| Frontend       | HTML5 + CSS3 + Vanilla JS | UI pages & client logic         |
| Backend        | Node.js + Express.js    | REST API server                  |
| Database       | SQLite (better-sqlite3) | Persistent relational storage    |
| Authentication | JWT (jsonwebtoken)      | Token-based stateless auth       |
| Password Hash  | bcryptjs                | Secure password hashing          |
| CORS           | cors                    | Cross-origin request handling    |
| Config         | dotenv                  | Environment variable management  |

---

## 4. Folder Structure

```
complaint-management-system/
│
├── architecture/                  # 📁 Architecture documentation
│   ├── README.md                  #    This file
│   ├── database_schema.md         #    Database schema details
│   ├── api_endpoints.md           #    REST API reference
│   ├── auth_flow.md               #    Authentication & authorization flow
│   ├── business_rules.md          #    Business rules & validations
│   └── folder_structure.md        #    Detailed folder breakdown
│
├── backend/                       # 📁 Server-side code
│   ├── server.js                  #    Express app entry point
│   ├── package.json               #    Node dependencies
│   ├── .env                       #    Environment configuration
│   ├── db/
│   │   └── database.js            #    SQLite connection & schema init
│   ├── middleware/
│   │   └── auth.js                #    JWT authentication middleware
│   └── routes/
│       ├── auth.js                #    /api/auth/* (register, login)
│       └── complaints.js          #    /api/complaints/* (CRUD + feedback)
│
└── frontend/                      # 📁 Client-side code
    ├── index.html                 #    Login & registration page
    ├── user.html                  #    User dashboard
    ├── support.html               #    Support dashboard
    ├── css/
    │   └── styles.css             #    Global styles & design system
    └── js/
        ├── api.js                 #    API client (fetch wrapper + JWT)
        ├── auth.js                #    Auth page logic
        ├── user.js                #    User dashboard logic
        └── support.js             #    Support dashboard logic
```

---

## 5. Data Flow Summary

1. **Registration** → User submits form → POST `/api/auth/register` → password hashed → stored in `users` table → JWT returned
2. **Login** → POST `/api/auth/login` → credentials verified → JWT returned
3. **Raise Complaint** → USER submits form → POST `/api/complaints` (JWT required) → stored in `complaints` table
4. **View Complaints** → GET `/api/complaints` → USER sees own, SUPPORT sees all
5. **Update Status** → SUPPORT uses PUT `/api/complaints/:id/status` → status updated in DB
6. **Submit Feedback** → USER submits POST `/api/complaints/:id/feedback` → **only if status = CLOSED** → stored in `feedback` table

---

## 6. User Roles

| Role      | Capabilities                                                         |
|-----------|----------------------------------------------------------------------|
| **USER**  | Register, Login, Raise complaints, View own complaints, Give feedback (only after CLOSED) |
| **SUPPORT** | Login, View ALL complaints, Update complaint status (OPEN → IN_PROGRESS → CLOSED) |

---

## 7. Key Design Decisions

1. **SQLite** chosen for zero-config database setup — no external DB server required
2. **Synchronous DB operations** via `better-sqlite3` for simpler Express handlers
3. **Single JWT secret** from environment variables — not hardcoded
4. **Frontend served by Express** — single server for both API and UI
5. **Role embedded in JWT claims** — role checked on every API call
6. **One feedback per complaint** enforced via UNIQUE constraint on `complaint_id`
