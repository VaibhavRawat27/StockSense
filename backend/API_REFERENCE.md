# StockSense — Inventory Movement API Reference

Owner: Member 3 (Receipts, Delivery, Transfers, Adjustments)

All responses follow this shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors return `success: false` with a `message` and an appropriate HTTP status (400/404/500).

---

## Receipts (`/api/receipts`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/receipts` | Create a draft receipt |
| GET | `/api/receipts` | List all (header only, no items). Optional `?status=` |
| GET | `/api/receipts/:id` | Get one, **includes items** |
| POST | `/api/receipts/:id/validate` | Validate → increases stock |

**Create — Request body:**
```json
{ "supplier_id": 1, "warehouse_id": 1, "items": [{ "product_id": 1, "quantity": 50 }] }
```
**Create — Response:** `{ "data": { "receipt_id": 1 } }`

**List — Response row shape** (no items):
```json
{ "id": 1, "supplier_id": 1, "warehouse_id": 1, "status": "draft", "created_at": "...", "validated_at": null }
```

**Get by ID — Response** (includes items):
```json
{
  "id": 1, "supplier_id": 1, "warehouse_id": 1, "status": "done",
  "created_at": "...", "validated_at": "...",
  "items": [{ "id": 1, "product_id": 1, "product_name": "Steel Rods", "sku": "STL-001", "quantity": 50 }]
}
```

**Validate — Response:** `{ "message": "Receipt #1 validated. Stock increased for 1 product(s)." }`

---

## Delivery Orders (`/api/deliveries`)

Same shape as Receipts, but no `supplier_id` — just `warehouse_id`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/deliveries` | Create a draft delivery |
| GET | `/api/deliveries` | List all (header only). Optional `?status=` |
| GET | `/api/deliveries/:id` | Get one, **includes items** |
| POST | `/api/deliveries/:id/validate` | Validate → decreases stock (fails if insufficient stock) |

**Create — Request body:**
```json
{ "warehouse_id": 1, "items": [{ "product_id": 1, "quantity": 20 }] }
```

**Validate — Insufficient stock error (400):**
```json
{ "success": false, "message": "Insufficient stock for product_id 1: available 10, requested 20" }
```

---

## Internal Transfers (`/api/transfers`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/transfers` | Create a draft transfer |
| GET | `/api/transfers` | List all (header only \u2014 **no items/product/quantity**). Optional `?status=` |
| GET | `/api/transfers/:id` | Get one, **includes items** \u2014 use this for product/quantity |
| POST | `/api/transfers/:id/validate` | Validate → moves stock between warehouses (total unchanged) |

**Create — Request body:**
```json
{ "from_warehouse_id": 1, "to_warehouse_id": 2, "items": [{ "product_id": 1, "quantity": 10 }] }
```
`from_warehouse_id` and `to_warehouse_id` must differ, or you'll get a 400.

**List — Response row shape** (matches your screenshot \u2014 no items here by design):
```json
{ "id": 1, "from_warehouse_id": 1, "to_warehouse_id": 2, "status": "done", "created_at": "...", "validated_at": "..." }
```

**Get by ID — Response** (this is where product/quantity live):
```json
{
  "id": 1, "from_warehouse_id": 1, "to_warehouse_id": 2, "status": "done",
  "created_at": "...", "validated_at": "...",
  "items": [{ "id": 1, "product_id": 1, "product_name": "Steel Rods", "sku": "STL-001", "quantity": 10 }]
}
```
**Frontend tip:** if you're rendering a table of transfers and want to show product/quantity inline without a second click per row, either (a) fetch `/api/transfers/:id` for each row after the list loads, or (b) ask me to add an optional `?include=items` param to the list endpoint that joins everything in one call \u2014 happy to add that if it'd save you round trips.

**Validate — Insufficient stock error (400):**
```json
{ "success": false, "message": "Insufficient stock for product_id 1 at source warehouse: available 5, requested 10" }
```

---

## Stock Adjustments (`/api/adjustments`)

Single-step — no draft/validate cycle, applies immediately.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/adjustments` | Reconcile physical count vs recorded stock \u2014 applies instantly |
| GET | `/api/adjustments` | List all (already includes product/warehouse names) |
| GET | `/api/adjustments/:id` | Get one |

**Create — Request body:**
```json
{ "product_id": 1, "warehouse_id": 1, "counted_quantity": 17, "reason": "3kg damaged" }
```

**Create — Response:**
```json
{
  "message": "Stock adjusted from 20 to 17 (-3).",
  "data": { "adjustment_id": 1, "previous_quantity": 20, "counted_quantity": 17, "difference": -3 }
}
```

---

## Common patterns across all four modules

- **List endpoints are lightweight** (header fields only). **Detail endpoints (`/:id`) include line items** with joined `product_name` and `sku`. This is consistent across Receipts, Deliveries, and Transfers.
- **Adjustments is the one exception** — it's a single action, not a draft/validate flow, and its list endpoint already includes names since there's no separate items table.
- Every validated action writes to a shared `stock_ledger` table (not exposed via API yet — let me know if the frontend needs a `GET /api/ledger` endpoint for an audit-trail view, easy to add).