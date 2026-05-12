# 📊 Database Schema

## Overview

The system uses **SQLite** as the relational database with three tables:
`users`, `complaints`, and `feedback`.

All tables use auto-incrementing integer primary keys and enforce referential
integrity via foreign keys.

---

## Entity-Relationship Diagram

```
┌──────────────────┐       ┌─────────────────────────┐       ┌──────────────────────┐
│      users       │       │      complaints          │       │      feedback         │
├──────────────────┤       ├─────────────────────────┤       ├──────────────────────┤
│ id (PK)          │──┐    │ id (PK)                 │──┐    │ id (PK)              │
│ username (UQ)    │  │    │ user_id (FK → users.id) │  │    │ complaint_id (FK,UQ) │
│ email (UQ)       │  └───>│ title                   │  └───>│ user_id (FK)         │
│ password         │       │ description             │       │ rating (1–5)         │
│ role             │       │ category                │       │ comment              │
│ created_at       │       │ status                  │       │ created_at           │
└──────────────────┘       │ created_at              │       └──────────────────────┘
                           │ updated_at              │
                           └─────────────────────────┘
```

---

## Table: `users`

Stores all registered users (both USER and SUPPORT roles).

| Column      | Type     | Constraints                                  | Description               |
|-------------|----------|----------------------------------------------|---------------------------|
| id          | INTEGER  | PRIMARY KEY, AUTOINCREMENT                   | Unique user identifier    |
| username    | TEXT     | NOT NULL, UNIQUE                             | Display name              |
| email       | TEXT     | NOT NULL, UNIQUE                             | Login credential          |
| password    | TEXT     | NOT NULL                                     | bcrypt-hashed password    |
| role        | TEXT     | NOT NULL, CHECK(IN ('USER','SUPPORT')), DEFAULT 'USER' | Access level    |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP                    | Registration timestamp    |

---

## Table: `complaints`

Stores all complaints raised by users.

| Column      | Type     | Constraints                                             | Description               |
|-------------|----------|---------------------------------------------------------|---------------------------|
| id          | INTEGER  | PRIMARY KEY, AUTOINCREMENT                              | Unique complaint ID       |
| user_id     | INTEGER  | NOT NULL, FK → users(id) ON DELETE CASCADE              | Complaint owner           |
| title       | TEXT     | NOT NULL                                                | Brief summary             |
| description | TEXT     | NOT NULL                                                | Detailed description      |
| category    | TEXT     | DEFAULT 'General'                                       | Complaint category        |
| status      | TEXT     | NOT NULL, CHECK(IN ('OPEN','IN_PROGRESS','CLOSED')), DEFAULT 'OPEN' | Current status |
| created_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP                               | When raised               |
| updated_at  | DATETIME | DEFAULT CURRENT_TIMESTAMP                               | Last status change        |

### Status Lifecycle

```
  OPEN ──────> IN_PROGRESS ──────> CLOSED
   │                                  │
   └──────────────────────────────────┘
         (can skip IN_PROGRESS)
```

---

## Table: `feedback`

Stores user feedback for resolved complaints. One feedback per complaint.

| Column       | Type     | Constraints                                      | Description                  |
|--------------|----------|--------------------------------------------------|------------------------------|
| id           | INTEGER  | PRIMARY KEY, AUTOINCREMENT                       | Unique feedback ID           |
| complaint_id | INTEGER  | NOT NULL, UNIQUE, FK → complaints(id) ON DELETE CASCADE | Links to complaint (1:1) |
| user_id      | INTEGER  | NOT NULL, FK → users(id) ON DELETE CASCADE       | Feedback author              |
| rating       | INTEGER  | NOT NULL, CHECK(rating >= 1 AND rating <= 5)     | Star rating (1–5)            |
| comment      | TEXT     |                                                  | Optional text comment        |
| created_at   | DATETIME | DEFAULT CURRENT_TIMESTAMP                        | When submitted               |

---

## SQL DDL (as executed in `db/database.js`)

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('USER', 'SUPPORT')) DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL CHECK(status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')) DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Relationships Summary

| Relationship          | Type   | Description                                  |
|-----------------------|--------|----------------------------------------------|
| users → complaints    | 1 : N  | A user can raise many complaints             |
| complaints → feedback | 1 : 1  | Each complaint can have at most one feedback  |
| users → feedback      | 1 : N  | A user can submit feedback on multiple complaints |
