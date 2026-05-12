# 📁 Folder Structure — Detailed Breakdown

## Complete Project Tree

```
complaint-management-system/
│
├── 📂 architecture/                       # Architecture documentation
│   ├── README.md                          # System overview & high-level design
│   ├── database_schema.md                 # ER diagram, table definitions, DDL
│   ├── api_endpoints.md                   # REST API reference (all routes)
│   ├── auth_flow.md                       # JWT auth & RBAC flow diagrams
│   ├── business_rules.md                  # Business rules & validations
│   └── folder_structure.md                # This file
│
├── 📂 backend/                            # Server-side application
│   │
│   ├── server.js                          # Express app entry point
│   │                                      # - Loads environment variables
│   │                                      # - Configures CORS & JSON parsing
│   │                                      # - Mounts API routes
│   │                                      # - Serves frontend as static files
│   │                                      # - Health check endpoint
│   │
│   ├── package.json                       # Node.js dependencies & scripts
│   │                                      # - "start": node server.js
│   │                                      # - "dev": node --watch server.js
│   │
│   ├── .env                               # Environment configuration
│   │                                      # - PORT: Server port (5050)
│   │                                      # - JWT_SECRET: Token signing key
│   │                                      # - JWT_EXPIRES_IN: Token TTL (24h)
│   │                                      # - DB_PATH: SQLite file path
│   │
│   ├── 📂 db/                             # Database layer
│   │   ├── database.js                    # SQLite connection & schema initialization
│   │   │                                  # - Creates users, complaints, feedback tables
│   │   │                                  # - Enables WAL mode & foreign keys
│   │   └── complaints.db                  # SQLite database file (auto-generated)
│   │
│   ├── 📂 middleware/                     # Express middleware
│   │   └── auth.js                        # Authentication & Authorization
│   │                                      # - authenticate(): JWT verification
│   │                                      # - authorize(...roles): Role checking
│   │
│   └── 📂 routes/                         # API route handlers
│       ├── auth.js                        # POST /api/auth/register
│       │                                  # POST /api/auth/login
│       └── complaints.js                  # POST   /api/complaints
│                                          # GET    /api/complaints
│                                          # GET    /api/complaints/:id
│                                          # PUT    /api/complaints/:id/status
│                                          # POST   /api/complaints/:id/feedback
│
└── 📂 frontend/                           # Client-side application
    │
    ├── index.html                         # Auth page (Login + Register)
    │                                      # - Tab-based form switching
    │                                      # - Role selection during registration
    │                                      # - Auto-redirect if already logged in
    │
    ├── user.html                          # User Dashboard
    │                                      # - Stats grid (total/open/progress/closed)
    │                                      # - New complaint form (toggleable)
    │                                      # - Complaint list with status badges
    │                                      # - Status filter bar
    │                                      # - Feedback modal for CLOSED complaints
    │
    ├── support.html                       # Support Dashboard
    │                                      # - Stats grid for all complaints
    │                                      # - All complaints with user info
    │                                      # - Inline status update dropdowns
    │                                      # - Detail modal with feedback view
    │                                      # - Status filter bar
    │
    ├── 📂 css/                            # Stylesheets
    │   └── styles.css                     # Global design system
    │                                      # - CSS custom properties (tokens)
    │                                      # - Dark glassmorphism theme
    │                                      # - Component styles (cards, badges, etc.)
    │                                      # - Animations (slideUp, fadeIn, etc.)
    │                                      # - Responsive breakpoints
    │
    └── 📂 js/                             # Client-side JavaScript
        ├── api.js                         # API Client (Singleton)
        │                                  # - Centralized fetch wrapper
        │                                  # - JWT token management (localStorage)
        │                                  # - All API endpoint methods
        │                                  # - Utility: showToast(), formatDate(),
        │                                  #   getStatusEmoji(), escapeHtml()
        │
        ├── auth.js                        # Auth page logic
        │                                  # - Login form handler
        │                                  # - Register form handler
        │                                  # - Tab switching
        │                                  # - Auth state check + redirect
        │
        ├── user.js                        # User dashboard logic
        │                                  # - Auth guard (role check)
        │                                  # - Load & render own complaints
        │                                  # - Create complaint handler
        │                                  # - Feedback modal handler
        │                                  # - Status filtering
        │
        └── support.js                     # Support dashboard logic
                                           # - Auth guard (role check)
                                           # - Load & render all complaints
                                           # - Inline status update handler
                                           # - Detail modal with feedback view
                                           # - Status filtering
```

---

## File Count Summary

| Directory     | Files | Purpose                    |
|---------------|-------|----------------------------|
| architecture/ | 6     | Documentation              |
| backend/      | 6     | Server + API + Database    |
| frontend/     | 7     | UI pages + styles + logic  |
| **Total**     | **19**| Complete application       |

---

## Dependency Graph

```
frontend/index.html  ──> css/styles.css, js/api.js, js/auth.js
frontend/user.html   ──> css/styles.css, js/api.js, js/user.js
frontend/support.html──> css/styles.css, js/api.js, js/support.js

backend/server.js    ──> routes/auth.js, routes/complaints.js
routes/auth.js       ──> db/database.js
routes/complaints.js ──> db/database.js, middleware/auth.js
```
