# StockSense — Inventory Movement Demo Script

**Module owner:** Team Member 3 — Receipts · Delivery · Transfers · Adjustments
**Duration:** ~4 minutes

This script walks judges through the full stock movement lifecycle: a
product arrives from a vendor, moves between warehouses, ships out to a
customer, and gets reconciled after a physical count — with every step
logged to a single, auditable stock ledger.

---

## Setup (before judges arrive)

Start the backend:
```
cd backend
npm run dev
```

Confirm health check:
```
Invoke-RestMethod -Uri http://localhost:5000/api/health
```
Expected: `status: OK`, `database: connected`.

Have one supplier, one product, and two warehouses already seeded
(Main Warehouse + Production Floor) so you're not typing SQL live.

---

## 1. Receipts — Incoming Stock (30 seconds)

**Say:** "When goods arrive from a vendor, we create a Receipt. It starts
as a draft — nothing changes yet."

```
Invoke-RestMethod -Uri http://localhost:5000/api/receipts -Method POST -ContentType "application/json" -Body '{"supplier_id": 1, "warehouse_id": 1, "items": [{"product_id": 1, "quantity": 100}]}'
```

**Say:** "Validating it is what actually moves stock — this mirrors a
real warehouse worker checking the delivery before signing off."

```
Invoke-RestMethod -Uri http://localhost:5000/api/receipts/<id>/validate -Method POST
```

**Point out:** stock is now +100 in Main Warehouse.

---

## 2. Internal Transfer — Move Between Locations (30 seconds)

**Say:** "Now let's move that stock from the Main Warehouse to the
Production Floor — total stock in the company doesn't change, only
its location does."

```
Invoke-RestMethod -Uri http://localhost:5000/api/transfers -Method POST -ContentType "application/json" -Body '{"from_warehouse_id": 1, "to_warehouse_id": 2, "items": [{"product_id": 1, "quantity": 100}]}'
Invoke-RestMethod -Uri http://localhost:5000/api/transfers/<id>/validate -Method POST
```

**Point out:** Main Warehouse is now 0, Production Floor is 100 — total
is still 100.

---

## 3. Delivery Order — Outgoing Stock (30 seconds)

**Say:** "A customer places an order. We pick, pack, and validate — and
that automatically decreases stock. The system also blocks you if
there isn't enough stock to fulfill it."

```
Invoke-RestMethod -Uri http://localhost:5000/api/deliveries -Method POST -ContentType "application/json" -Body '{"warehouse_id": 2, "items": [{"product_id": 1, "quantity": 20}]}'
Invoke-RestMethod -Uri http://localhost:5000/api/deliveries/<id>/validate -Method POST
```

**Point out:** stock dropped from 100 to 80.

---

## 4. Stock Adjustment — Reconcile Physical Count (30 seconds)

**Say:** "Sometimes physical count doesn't match what's recorded — say,
3 units got damaged. An adjustment fixes that in one step and logs
exactly what changed and why."

```
Invoke-RestMethod -Uri http://localhost:5000/api/adjustments -Method POST -ContentType "application/json" -Body '{"product_id": 1, "warehouse_id": 2, "counted_quantity": 77, "reason": "3 units damaged"}'
```

**Point out:** the response shows previous quantity (80), counted
quantity (77), and the difference (−3) — all logged automatically.

---

## 5. The Payoff — One Ledger, Full Audit Trail (1 minute)

**Say:** "Everything you just watched — the receipt, the transfer out
and in, the delivery, the adjustment — all of it lives in one table:
the stock ledger. Nothing moves without being logged."

Run the automated end-to-end test live, which proves this exact flow
(receive 100 → transfer → deliver 20 → adjust −3) with assertions:

```
node src/tests/e2e-flow.js
```

**Point out the final line:** `ALL CHECKS PASSED` — and the ledger
trail printed: `receipt(+100) -> transfer_out(-100) -> transfer_in(+100)
-> delivery(-20) -> adjustment(-3)`.

**Closing line:** "That's the full lifecycle of a single unit of stock —
from vendor to warehouse to customer to reconciliation — fully
automated, fully logged, with no spreadsheets involved."