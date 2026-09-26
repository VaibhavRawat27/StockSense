/**
 * End-to-end test for the StockSense inventory flow.
 * Mirrors the exact "Simplified Example to Understand Inventory Flow"
 * from the problem statement:
 *
 *   Step 1: Receive 100 kg Steel                -> stock: +100
 *   Step 2: Internal transfer Main -> Production -> stock unchanged in total
 *   Step 3: Deliver 20 steel                     -> stock: -20
 *   Step 4: Adjust 3 kg damaged                  -> stock: -3
 *
 * Run this with the server already running (npm run dev in another terminal):
 *   node src/tests/e2e-flow.js
 */

const db = require("../config/database");

const BASE = "http://localhost:5000/api";

function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
    console.log(`  \u2713 ${message}`);
}

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
    });
    const data = await res.json();
    if (!data.success) {
        throw new Error(`Request to ${path} failed: ${data.message}`);
    }
    return data;
}

function getStock(productId, warehouseId) {
    const row = db
        .prepare(`SELECT quantity FROM stock_levels WHERE product_id = ? AND warehouse_id = ?`)
        .get(productId, warehouseId);
    return row ? row.quantity : 0;
}

async function run() {
    console.log("=== StockSense End-to-End Flow Test ===\n");

    // --- Setup: fresh product + two warehouses + a supplier ---
    const supplier = db
        .prepare(`SELECT id FROM suppliers ORDER BY id LIMIT 1`)
        .get();
    if (!supplier) throw new Error("No supplier found. Seed at least one supplier first.");

    const sku = `E2E-STEEL-${Date.now()}`;
    const productResult = db
        .prepare(`INSERT INTO products (name, sku, category, unit) VALUES (?, ?, ?, ?)`)
        .run("E2E Test Steel Rods", sku, "Raw Material", "kg");
    const productId = Number(productResult.lastInsertRowid);

    let warehouses = db.prepare(`SELECT id FROM warehouses ORDER BY id LIMIT 2`).all();
    if (warehouses.length < 2) {
        const w = db
            .prepare(`INSERT INTO warehouses (name, location) VALUES (?, ?)`)
            .run("E2E Test Warehouse 2", "Test Location");
        warehouses.push({ id: Number(w.lastInsertRowid) });
    }
    const mainWarehouseId = warehouses[0].id;
    const productionWarehouseId = warehouses[1].id;

    console.log(`Setup: product_id=${productId}, main_warehouse=${mainWarehouseId}, production_warehouse=${productionWarehouseId}\n`);

    // --- Step 1: Receive 100 kg Steel ---
    console.log("Step 1: Receive 100 kg Steel");
    const receipt = await post("/receipts", {
        supplier_id: supplier.id,
        warehouse_id: mainWarehouseId,
        items: [{ product_id: productId, quantity: 100 }],
    });
    await post(`/receipts/${receipt.data.receipt_id}/validate`);
    assert(getStock(productId, mainWarehouseId) === 100, "Stock after receipt is 100");

    // --- Step 2: Internal transfer Main -> Production ---
    console.log("\nStep 2: Move to production rack (transfer 100 units)");
    const transfer = await post("/transfers", {
        from_warehouse_id: mainWarehouseId,
        to_warehouse_id: productionWarehouseId,
        items: [{ product_id: productId, quantity: 100 }],
    });
    await post(`/transfers/${transfer.data.transfer_id}/validate`);
    assert(getStock(productId, mainWarehouseId) === 0, "Main warehouse stock is 0 after transfer");
    assert(getStock(productId, productionWarehouseId) === 100, "Production warehouse stock is 100 after transfer");
    const totalAfterTransfer = getStock(productId, mainWarehouseId) + getStock(productId, productionWarehouseId);
    assert(totalAfterTransfer === 100, "Total stock unchanged (still 100) after transfer");

    // --- Step 3: Deliver 20 steel (from production warehouse) ---
    console.log("\nStep 3: Deliver finished goods (20 units)");
    const delivery = await post("/deliveries", {
        warehouse_id: productionWarehouseId,
        items: [{ product_id: productId, quantity: 20 }],
    });
    await post(`/deliveries/${delivery.data.delivery_id}/validate`);
    assert(getStock(productId, productionWarehouseId) === 80, "Production warehouse stock is 80 after delivery (-20)");

    // --- Step 4: Adjust for 3 kg damaged ---
    console.log("\nStep 4: Adjust damaged items (3 kg damaged)");
    const currentStock = getStock(productId, productionWarehouseId);
    const countedQuantity = currentStock - 3;
    await post("/adjustments", {
        product_id: productId,
        warehouse_id: productionWarehouseId,
        counted_quantity: countedQuantity,
        reason: "3kg damaged (e2e test)",
    });
    assert(getStock(productId, productionWarehouseId) === 77, "Production warehouse stock is 77 after adjustment (-3)");

    // --- Verify the ledger tells the same story ---
    console.log("\nVerifying stock ledger...");
    const ledgerSum = db
        .prepare(`SELECT SUM(change_qty) AS total FROM stock_ledger WHERE product_id = ?`)
        .get(productId).total;
    assert(ledgerSum === 77, "Sum of all ledger entries for this product equals final total stock (77)");

    const ledgerEntries = db
        .prepare(`SELECT movement_type, change_qty FROM stock_ledger WHERE product_id = ? ORDER BY id`)
        .all(productId);
    console.log("  Ledger trail:", ledgerEntries.map((e) => `${e.movement_type}(${e.change_qty >= 0 ? "+" : ""}${e.change_qty})`).join(" -> "));

    console.log("\n=== ALL CHECKS PASSED ===");
    console.log(`Final state: Main=${getStock(productId, mainWarehouseId)}, Production=${getStock(productId, productionWarehouseId)}, Total=${getStock(productId, mainWarehouseId) + getStock(productId, productionWarehouseId)}`);
}

run().catch((err) => {
    console.error("\n=== TEST FAILED ===");
    console.error(err.message);
    process.exit(1);
});