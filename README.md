# 📦 StockSense — Inventory & Warehouse Management System

StockSense is an intelligent inventory and warehouse management system featuring full-stack authentication, master data management, and operational workflows powered by **SQLite** (`better-sqlite3` / `node:sqlite`), **Express.js**, and **React (Vite)**.

---

## ⚡ Phase 4 Deliverables: Performance Search, Reorder Alerts & Auth Lockdown

Phase 4 secures and supercharges the product catalog and warehouse master data to plug cleanly and safely into the rest of the application:

### 1. High-Performance SKU Search & Smart Filters (< 1s DoD)
- **Indexed Search Engine**: Dedicated B-Tree indexes on `products(sku)`, `products(name)`, `products(barcode)`, `products(category_id)`, and `stock_levels(product_id, warehouse_id)`.
- **Query Benchmarking**: Execution times consistently clock in at **~1.2ms - 2.5ms** (far exceeding the < 1000ms definition of done).
- **Smart Filter Parameters** on `GET /api/products`:
  - `sku`: Exact or partial SKU lookup (e.g., `SCAN-PRO-01`).
  - `search`: Full text search matching product name, SKU, or barcode.
  - `category_id` / `category`: Filter by category ID or name.
  - `warehouse_id`: Filter by storage facility availability.
  - `status`: Smart status filter (`low_stock`, `reorder_needed`, `optimal`, `out_of_stock`, `overstock`).
  - `min_price` & `max_price`: Range filtering.
  - `sort_by` & `sort_order`: Dynamic sorting (`name`, `sku`, `price`, `total_stock`, `created_at`).

### 2. Low-Stock Alerts Hooked to Reordering Rules & KPI Feed
- **Dynamic Reordering Engine**: Evaluates `total_stock <= min_stock` for every SKU across all storage locations.
- **Dedicated Alerts Endpoint**: `GET /api/products/alerts`
  - Calculates on-hand total stock, minimum threshold, stock deficit (`min_stock - total_stock`), and suggested replenishment quantity (`reorder_qty`).
- **Live KPI Feed Integration**: `GET /api/health`
  - Feeds `kpi.low_stock_alerts_count` and `kpi.total_units_in_stock` directly into system-wide dashboard feeds in real-time.

### 3. Route Security Behind Auth Middleware
- All master data and inventory endpoints are guarded with JWT `verifyToken` middleware (`Authorization: Bearer <token>`):
  - `/api/products/*`
  - `/api/warehouses/*`
  - `/api/categories/*`
  - `/api/stock/*`
- Unauthenticated requests are immediately rejected with `401 Unauthorized` (`{ success: false, message: "Access denied. No token provided." }`).
- Frontend API client automatically injects stored bearer tokens from `localStorage` into all request headers.

---

## 🌟 Master Data Management (Phase 3)

The master data module forms the core product catalog, categories taxonomy, multi-facility warehouse setup, and reordering rules that every operational module (receipts, delivery orders, internal transfers, and adjustments) depends on.

### 1. Product Catalog & Reordering Rules
- **Fields**: Name, SKU / Code, Category, Unit of Measure (UOM: `Units`, `Boxes`, `Pallets`, `Kg`, `Liters`, `Meters`, `Rolls`, `Packs`), Description, Barcode, Price.
- **Reordering Rules Configuration**:
  - `min_stock` (Reorder Point threshold): Automatically triggers low stock warning badges when on-hand stock falls to or below this level.
  - `max_stock`: Storage capacity ceiling.
  - `reorder_qty`: Recommended replenishment batch quantity.
  - `preferred_vendor`: Preferred supplier or manufacturer.
- **Initial Stock Allocation**: Optional allocation of starting stock across warehouses and specific storage bins upon product creation.

### 2. Product Category Management
- Categorize and organize products into structured taxonomies (e.g., *Electronics & Sensors*, *Packaging & Materials*, *Material Handling*, *Safety & PPE*, *Storage & Racking*).
- Track SKU counts and total units stored per category.
- CRUD operations with protective checks against deleting categories in active use.

### 3. Stock Availability per Location
- Multi-facility visibility of on-hand inventory across all active warehouse sites.
- Breakdown includes: Warehouse Name, Facility Code, On-hand Quantity, Storage Bin Location (e.g. `A-12-01`, `BAY-H-01`), and Reorder Status.
- Quick on-hand adjustment tool with audit trail logging to `stock_ledger` and `adjustments`.

### 4. Warehouse Setup (`Settings → Warehouse`)
- Configure physical facilities: Warehouse Name, Facility Code (e.g., `WH-CENTRAL`, `WH-EAST`, `WH-WEST`), Full Address, Type (e.g., Central Distribution Hub, Regional Fulfillment, Cross-Dock), Storage Capacity, Active/Inactive status, and Site Contacts.
- Live capacity utilization tracking gauge (`(total_units / capacity) * 100`).

---

## 🗄️ Database Architecture

Stored in SQLite at `backend/data/stock-sense.db` with WAL mode enabled:

- `products`: Product catalog, SKU, UOM, category_id, min_stock, max_stock, reorder_qty, preferred_vendor.
- `categories`: Product category hierarchy and codes.
- `warehouses`: Physical facilities, capacity, address, and operational status.
- `stock_levels`: Location-specific on-hand inventory balances (`product_id`, `warehouse_id`, `quantity`, `bin_location`).
- `suppliers`: Supplier and vendor contact directory.
- `stock_ledger`: Immutable audit trail for all stock movements.
- `users`: Role-based authentication (`manager`, `staff`).
- `password_resets`: Password reset OTP verification codes (6-digit), tokens, expiry timestamps, and usage tracking.

---

## 🔑 Google SMTP Password Reset Flow

StockSense includes an end-to-end Password Recovery module powered by **Google SMTP** with **Google App Passwords**:

### How to Configure Google SMTP (`backend/.env`):
1. Go to your **Google Account** ([https://myaccount.google.com/](https://myaccount.google.com/)).
2. Under **Security**, confirm **2-Step Verification** is turned **ON**.
3. Search for **App passwords** or visit: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Create an app named **"StockSense"** and copy the 16-character code (e.g. `abcd efgh ijkl mnop`).
5. Open `backend/.env` and update:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM="StockSense Security <your-email@gmail.com>"
   ```
> *Development Note*: In local development, if SMTP credentials have not yet been populated, the system runs in safe development simulation mode: generated 6-digit OTP codes and direct reset links are displayed on the server terminal and surfaced in the dev banner.

### Password Recovery Endpoints:
- `POST /api/auth/forgot-password`: Generates a 6-digit OTP code + secure token with 15-minute expiration, stores in SQLite, and dispatches rich HTML email via Google SMTP.
- `POST /api/auth/verify-reset-code`: Verifies code/token validity before submitting password.
- `POST /api/auth/reset-password`: Validates code, enforces password rules, encrypts new password with bcrypt, updates SQLite `users` table, and invalidates the token.
- `GET /api/auth/smtp-status`: Reports active Google SMTP connection readiness.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Auth & Password Recovery Endpoints (Public)
- `POST /api/auth/login`: Authenticate with email & password, receives JWT.
- `POST /api/auth/register`: Create inventory manager or warehouse staff account.
- `POST /api/auth/forgot-password`: Request password reset email via Google SMTP.
- `POST /api/auth/verify-reset-code`: Validate 6-digit OTP reset code.
- `POST /api/auth/reset-password`: Update account password with verification code.
- `GET /api/auth/smtp-status`: Check Google SMTP configuration status.
- `GET /api/auth/me`: Validate JWT and return current user profile (*Requires Bearer Token*).

### Products (Auth Guarded 🔒)
- `GET /api/products`: Fast search and smart filters (`sku`, `search`, `category_id`, `warehouse_id`, `status`, `min_price`, `max_price`, `sort_by`, `sort_order`).
- `GET /api/products/alerts`: Live reorder rule alert feed with calculated stock deficit and suggested reorder quantities.
- `GET /api/products/:id`: Get product details and location breakdown.
- `POST /api/products`: Create product with reorder rules and optional initial stock.
- `PUT /api/products/:id`: Update product info and reordering rules.
- `DELETE /api/products/:id`: Safely delete product and clean up associated records.

### Categories (Auth Guarded 🔒)
- `GET /api/categories`: List categories with product count and total stock units.
- `POST /api/categories`: Create category (`name`, `code`, `description`).
- `PUT /api/categories/:id`: Update category.
- `DELETE /api/categories/:id`: Delete category (protected if products assigned).

### Warehouses (Auth Guarded 🔒)
- `GET /api/warehouses`: List warehouses with live capacity utilization and stored unit counts.
- `GET /api/warehouses/:id`: Get warehouse facility details and current inventory items.
- `POST /api/warehouses`: Create warehouse facility.
- `PUT /api/warehouses/:id`: Update warehouse settings.
- `DELETE /api/warehouses/:id`: Delete warehouse facility (protected if stock > 0).

### Stock Availability (Auth Guarded 🔒)
- `GET /api/stock`: Location stock availability with filters (`?warehouse_id=`, `?product_id=`, `?low_stock_only=true`).
- `PUT /api/stock/adjust`: Quick adjust on-hand count or bin location with audit note.
- `GET /api/stock/alerts`: List products currently triggering reorder alerts.

### System & KPI Feed (Public)
- `GET /api/health`: Health status and live dashboard KPIs (`low_stock_alerts_count`, `total_units_in_stock`).

---

## 🧪 Test Suite & Verification

The project includes unit, security, performance, and end-to-end integration tests:

```bash
cd backend

# Run Phase 4 Auth, Product & Performance Test Suite (53 assertions)
npm test

# Run Forgot Password & Google SMTP Test Suite (26 assertions)
npm run test:forgot-password

# Run Operational Flow End-to-End Test (Receipts -> Transfers -> Deliveries -> Adjustments)
npm run test:e2e
```

---

## 🚀 Running the Project

```bash
# Backend (Port 5000)
cd backend
npm install
npm run dev

# Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

Navigate to:
- **Products & Catalog**: [http://localhost:5173/products](http://localhost:5173/products)
- **Settings → Warehouse Setup**: [http://localhost:5173/settings/warehouse](http://localhost:5173/settings/warehouse)
- **Authentication**: [http://localhost:5173/login](http://localhost:5173/login)

