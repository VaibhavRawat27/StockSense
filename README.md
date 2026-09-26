# 📦 StockSense — Inventory & Warehouse Management System

StockSense is an intelligent inventory and warehouse management system featuring full-stack authentication, operations processing, and **Phase 3 Product & Master Data Management**, powered by **SQLite** (`better-sqlite3` / `node:sqlite`), **Express.js**, and **React (Vite)**.

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
- `stock_ledger`: Immutable audit trail for all stock movements.
- `users`: Role-based authentication (`manager`, `staff`).

---

## 📡 API Reference (Phase 3 Endpoints)

Base URL: `http://localhost:5000/api`

### Products
- `GET /api/products`: List products with search, category filtering, status filtering (`?status=low_stock`), and warehouse distribution.
- `GET /api/products/:id`: Get product details and location breakdown.
- `POST /api/products`: Create product with reorder rules and optional initial stock.
- `PUT /api/products/:id`: Update product info and reordering rules.
- `DELETE /api/products/:id`: Delete product (safe: checks for on-hand stock).

### Categories
- `GET /api/categories`: List categories with product count and total stock units.
- `POST /api/categories`: Create category (`name`, `code`, `description`).
- `PUT /api/categories/:id`: Update category.
- `DELETE /api/categories/:id`: Delete category (protected if products assigned).

### Warehouses (Settings → Warehouse)
- `GET /api/warehouses`: List warehouses with live capacity utilization and stored unit counts.
- `GET /api/warehouses/:id`: Get warehouse facility details and current inventory items.
- `POST /api/warehouses`: Create warehouse facility.
- `PUT /api/warehouses/:id`: Update warehouse settings.
- `DELETE /api/warehouses/:id`: Delete warehouse facility (protected if stock > 0).

### Stock Availability
- `GET /api/stock`: Location stock availability with filters (`?warehouse_id=`, `?product_id=`, `?low_stock_only=true`).
- `PUT /api/stock/adjust`: Quick adjust on-hand count or bin location with audit note.
- `GET /api/stock/alerts`: List products currently triggering reorder alerts.

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
