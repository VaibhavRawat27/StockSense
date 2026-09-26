-- ============================================================
-- STUB TABLES
-- These are minimal placeholders for modules owned by other
-- team members (Products, Suppliers, Warehouses). Once their
-- real migrations land, these can be replaced without changing
-- the Receipts/Delivery/Transfer/Adjustment logic below, since
-- everything here only depends on the `id` column.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'pcs',
    reorder_level INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_email TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- STOCK LEVELS
-- Current on-hand quantity per product per warehouse.
-- This is the "source of truth" the dashboard KPIs read from.
-- Updated by receipts, deliveries, transfers, and adjustments.
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE(product_id, warehouse_id)
);

-- ============================================================
-- RECEIPTS (Phase 1 — Incoming Stock)
-- ============================================================

CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'canceled')),
    created_at TEXT DEFAULT (datetime('now')),
    validated_at TEXT
);

CREATE TABLE IF NOT EXISTS receipt_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL REFERENCES receipts(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ============================================================
-- STOCK LEDGER
-- Every movement (receipt, delivery, transfer, adjustment) is
-- logged here. This is the audit trail referenced across all
-- 3 phases of the work plan.
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    change_qty INTEGER NOT NULL,
    movement_type TEXT NOT NULL
        CHECK (movement_type IN ('receipt', 'delivery', 'transfer_out', 'transfer_in', 'adjustment')),
    reference_type TEXT NOT NULL,
    reference_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);


-- ============================================================
-- DELIVERY ORDERS (Phase 2 — Outgoing Stock)
-- ============================================================

CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'canceled')),
    created_at TEXT DEFAULT (datetime('now')),
    validated_at TEXT
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ============================================================
-- INTERNAL TRANSFERS (Phase 2 — Move stock between locations)
-- ============================================================

CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    to_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'canceled')),
    created_at TEXT DEFAULT (datetime('now')),
    validated_at TEXT,
    CHECK (from_warehouse_id != to_warehouse_id)
);

CREATE TABLE IF NOT EXISTS transfer_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER NOT NULL REFERENCES transfers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- ============================================================
-- STOCK ADJUSTMENTS (Phase 3 — Reconcile recorded vs physical count)
-- ============================================================

CREATE TABLE IF NOT EXISTS adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    previous_quantity INTEGER NOT NULL,
    counted_quantity INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);