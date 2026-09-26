# 📦 StockSense — Inventory & Warehouse Management System

StockSense is an intelligent inventory and warehouse management system featuring a secure, full-stack authentication portal powered by **SQLite** (`better-sqlite3`), **Express.js**, and **React (Vite)**.

The system is designed for two primary operational roles:
- 👔 **Inventory Manager**: Oversees inventory valuation, stock audits, purchasing approvals, and warehouse personnel.
- 👷 **Warehouse Staff**: Handles floor operations, receiving, picking, barcode/RFID scanning, and batch tracking.

---

## 🌟 Key Features

- **SQLite Engine with WAL Mode**: Fast, zero-config embedded database stored locally at `backend/data/stock-sense.db` with Write-Ahead Logging for high concurrency.
- **Role-Based Authentication**: Built-in support for `manager` and `staff` access levels with custom user profile attributes.
- **Security & Password Hashing**: Passwords encrypted with salted `bcryptjs` hashing; stateless authentication powered by JSON Web Tokens (JWT).
- **Comprehensive User Profile**: Stored attributes include:
  - Full Name
  - Unique Employee ID (e.g., `MGR-1001`, `STF-2042`)
  - Role (`manager` or `staff`)
  - Work Email (Unique, case-insensitive)
  - Phone Number
  - Assigned Warehouse Batch / Shift Code (e.g., `BATCH-HQ-ALPHA`, `BATCH-WH-BAY3`)
- **Modern Industrial Dark UI**: Built with responsive glassmorphism, glowing telemetry indicators, custom SVG icons from Lucide, and typography with *Plus Jakarta Sans* and *JetBrains Mono*.
- **1-Click Demo Accounts**: Instant pre-seeded credentials for testing both Manager and Staff roles immediately.

---

## 🗄️ Database Schema

The SQLite schema is automatically created and initialized upon server startup:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('manager', 'staff')),
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    phone_number TEXT,
    batch TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
```

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Name | Email | Password | Employee ID | Shift / Batch |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Inventory Manager** | Sarah Jenkins | `manager@stocksense.com` | `Manager@123` | `MGR-1001` | `BATCH-HQ-ALPHA` |
| **Warehouse Staff** | Marcus Vance | `staff@stocksense.com` | `Staff@123` | `STF-2042` | `BATCH-WH-BAY3` |

> *Note: You can also use the **Register Personnel** tab to sign up new custom managers or warehouse staff.*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (bundled with Node.js)

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the backend server (runs on http://localhost:5000)
npm run dev
```

*The backend will automatically create `backend/data/stock-sense.db` and seed the demo accounts if they do not already exist.*

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)** to access the StockSense portal.

---

## 📡 Backend API Reference

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

#### `POST /auth/register` (alias `/auth/signup`)
Registers a new warehouse employee or inventory manager.

- **Request Body**:
  ```json
  {
    "name": "Liam Foster",
    "employee_id": "MGR-1045",
    "role": "manager",
    "email": "liam.foster@stocksense.com",
    "password": "Password@123",
    "phone_number": "+1 555-0199",
    "batch": "BATCH-BAY-02"
  }
  ```
- **Response**: `201 Created` with JWT token and user profile object.

#### `POST /auth/login`
Authenticates a user using email (or Employee ID) and password.

- **Request Body**:
  ```json
  {
    "email": "manager@stocksense.com",
    "password": "Manager@123"
  }
  ```
- **Response**: `200 OK` with JWT token and user profile object.

#### `GET /auth/me`
Retrieves profile details for the currently logged-in user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with user details.

#### `GET /auth/team`
Returns all registered personnel stored in the SQLite database (passwords omitted).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with array of users.

### System Endpoints

#### `GET /health`
Returns system status, timestamp, SQLite connection health, and total registered user count.

---

## 📁 Project Directory Structure

```text
StockSense/
├── backend/
│   ├── data/
│   │   └── stock-sense.db          # SQLite database file (WAL mode)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # SQLite connection & table initialization
│   │   ├── controllers/
│   │   │   └── authController.js   # Register, Login, Me & Team handlers
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # JWT verification middleware
│   │   ├── routes/
│   │   │   └── authRoutes.js       # /api/auth routing definitions
│   │   └── server.js               # Express server configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── AuthPage.jsx        # Auth UI (Login, Register & Status card)
│   │   ├── services/
│   │   │   └── api.js              # Fetch client and session storage handlers
│   │   ├── App.jsx                 # Main application component
│   │   ├── index.css               # Design system & dark theme tokens
│   │   └── main.jsx
│   ├── vite.config.js              # Vite server with /api proxy to port 5000
│   ├── index.html                  # HTML entry with typography links
│   └── package.json
│
└── README.md                       # Project documentation
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide React Icons, Modern CSS Design Tokens |
| **Backend** | Node.js, Express.js (v5), CORS |
| **Database** | SQLite3 via `better-sqlite3` (with WAL mode enabled) |
| **Security** | `bcryptjs` (Salted Password Hashing), `jsonwebtoken` (JWT) |

---

## 📄 License
ISC
