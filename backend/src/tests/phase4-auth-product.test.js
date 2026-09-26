/**
 * StockSense Phase 4 Test Suite:
 * - Unit & Integration tests for Auth endpoints
 * - Auth-guarded product and warehouse APIs (unauthenticated requests rejected with 401)
 * - Sub-second SKU search and smart filters (< 1s)
 * - Low-stock alerts hooked to product reordering rules & KPI feed
 *
 * Run with:
 *   node src/tests/phase4-auth-product.test.js
 */

const BASE = "http://localhost:5000/api";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (!condition) {
        testsFailed++;
        console.error(`  \u2717 FAILED: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    testsPassed++;
    console.log(`  \u2713 PASSED: ${message}`);
}

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const status = res.status;
    let data = {};
    try {
        data = await res.json();
    } catch (e) {
        // non-json response
    }
    return { status, data };
}

async function runTests() {
    console.log("============================================================");
    console.log("🚀 StockSense Phase 4: Auth, Guarded APIs & Product Test Suite");
    console.log("============================================================\n");

    let managerToken = "";
    let staffToken = "";
    let testProductId = null;
    let testWarehouseId = null;
    let testCategoryId = null;

    // ============================================================
    // 1. SECURITY & AUTH GUARD TESTS (UNAUTHENTICATED REJECTED)
    // ============================================================
    console.log("--- 1. Security & Auth-Guarded Route Tests ---");

    {
        const res = await request("/products");
        assert(res.status === 401, "GET /api/products without token is rejected with 401");
        assert(res.data.success === false, "GET /api/products returns success: false");
    }

    {
        const res = await request("/products", { method: "POST", body: { name: "Hack Item", sku: "HACK-01" } });
        assert(res.status === 401, "POST /api/products without token is rejected with 401");
    }

    {
        const res = await request("/warehouses");
        assert(res.status === 401, "GET /api/warehouses without token is rejected with 401");
    }

    {
        const res = await request("/categories");
        assert(res.status === 401, "GET /api/categories without token is rejected with 401");
    }

    {
        const res = await request("/stock");
        assert(res.status === 401, "GET /api/stock without token is rejected with 401");
    }

    {
        const res = await request("/products", { headers: { Authorization: "Bearer invalid.fake.token" } });
        assert(res.status === 401, "Request with invalid JWT token is rejected with 401");
    }

    // ============================================================
    // 2. AUTHENTICATION ENDPOINT TESTS
    // ============================================================
    console.log("\n--- 2. Authentication Endpoint Tests ---");

    // Manager Login
    {
        const res = await request("/auth/login", {
            method: "POST",
            body: { email: "manager@stocksense.com", password: "Manager@123" }
        });
        assert(res.status === 200, "Manager login returns 200 OK");
        assert(Boolean(res.data.token), "Manager login returns JWT token");
        assert(res.data.user.role === "manager", "Manager role correctly assigned in user profile");
        managerToken = res.data.token;
    }

    // Staff Login
    {
        const res = await request("/auth/login", {
            method: "POST",
            body: { email: "staff@stocksense.com", password: "Staff@123" }
        });
        assert(res.status === 200, "Staff login returns 200 OK");
        assert(Boolean(res.data.token), "Staff login returns JWT token");
        assert(res.data.user.role === "staff", "Staff role correctly assigned in user profile");
        staffToken = res.data.token;
    }

    // Login with Invalid Password
    {
        const res = await request("/auth/login", {
            method: "POST",
            body: { email: "manager@stocksense.com", password: "WrongPassword999" }
        });
        assert(res.status === 401, "Login with wrong password returns 401 Unauthorized");
    }

    // User Registration
    const uniqueEmail = `qa.staff.${Date.now()}@stocksense.com`;
    const uniqueEmpId = `STF-${Math.floor(1000 + Math.random() * 9000)}`;
    {
        const res = await request("/auth/register", {
            method: "POST",
            body: {
                name: "QA Test Specialist",
                employee_id: uniqueEmpId,
                role: "staff",
                email: uniqueEmail,
                password: "Password@123",
                phone_number: "+1 555-0188",
                batch: "BATCH-QA-01"
            }
        });
        assert(res.status === 201, "User registration returns 201 Created");
        assert(Boolean(res.data.token), "Registration returns JWT session token");
        assert(res.data.user.email === uniqueEmail, "Registered email matches user payload");
    }

    // Duplicate Registration Prevention
    {
        const res = await request("/auth/register", {
            method: "POST",
            body: {
                name: "Duplicate User",
                employee_id: uniqueEmpId,
                role: "staff",
                email: uniqueEmail,
                password: "Password@123"
            }
        });
        assert(res.status === 409, "Duplicate registration attempt rejected with 409 Conflict");
    }

    // Verified Session /auth/me
    {
        const res = await request("/auth/me", { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "GET /api/auth/me with valid token returns 200 OK");
        assert(res.data.user.email === "manager@stocksense.com", "Session user details correctly verified");
    }

    // ============================================================
    // 3. PRODUCT CATALOG CRUD & INITIAL STOCK ALLOCATION
    // ============================================================
    console.log("\n--- 3. Product Catalog CRUD & Master Data Tests ---");

    // Fetch warehouse & category to link
    const whRes = await request("/warehouses", { headers: { Authorization: `Bearer ${managerToken}` } });
    assert(whRes.status === 200 && whRes.data.data.length > 0, "Authenticated GET /api/warehouses returns facilities");
    testWarehouseId = whRes.data.data[0].id;

    const catRes = await request("/categories", { headers: { Authorization: `Bearer ${managerToken}` } });
    assert(catRes.status === 200 && catRes.data.data.length > 0, "Authenticated GET /api/categories returns categories");
    testCategoryId = catRes.data.data[0].id;

    // Create Product with Reorder Rules & Initial Stock Allocation
    const testSku = `TEST-PRD-${Date.now().toString().slice(-6)}`;
    {
        const res = await request("/products", {
            method: "POST",
            headers: { Authorization: `Bearer ${managerToken}` },
            body: {
                name: "Phase 4 High-Speed Optical Sensor",
                sku: testSku,
                category_id: testCategoryId,
                uom: "Units",
                description: "Infrared optic sensor for high-speed conveyor scanning",
                barcode: "840999112233",
                price: 189.50,
                min_stock: 20,
                max_stock: 100,
                reorder_qty: 40,
                preferred_vendor: "Keyence Photonics",
                initial_stocks: [
                    { warehouse_id: testWarehouseId, quantity: 12, bin_location: "SEC-OPT-01" }
                ]
            }
        });
        assert(res.status === 201, "POST /api/products returns 201 Created");
        assert(res.data.data.sku === testSku, "Created product has correct SKU");
        testProductId = res.data.data.id;
    }

    // Get Single Product by ID
    {
        const res = await request(`/products/${testProductId}`, { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "GET /api/products/:id returns 200 OK");
        assert(res.data.data.total_stock === 12, "Product initial stock correctly allocated to warehouse");
        assert(res.data.data.stock_status === "low_stock", "Product stock (12) <= min_stock (20) triggers low_stock status");
    }

    // Update Product Details & Reordering Rule
    {
        const res = await request(`/products/${testProductId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${managerToken}` },
            body: {
                name: "Phase 4 High-Speed Optical Sensor Gen2",
                min_stock: 15,
                max_stock: 120,
                reorder_qty: 50,
                preferred_vendor: "Keyence Global"
            }
        });
        assert(res.status === 200, "PUT /api/products/:id returns 200 OK");
        assert(res.data.data.name.includes("Gen2"), "Product name updated in catalog");
        assert(res.data.data.min_stock === 15, "Reordering rule min_stock updated");
    }

    // ============================================================
    // 4. SKU SEARCH & SMART FILTERS BENCHMARK (< 1s)
    // ============================================================
    console.log("\n--- 4. SKU Search & Smart Filters (< 1s Benchmark) ---");

    // Exact SKU search
    {
        const start = performance.now();
        const res = await request(`/products?sku=${testSku}`, { headers: { Authorization: `Bearer ${managerToken}` } });
        const duration = performance.now() - start;

        assert(res.status === 200, "Search by exact SKU returns 200 OK");
        assert(res.data.count >= 1, "SKU search found target product");
        assert(res.data.data[0].sku === testSku, "Returned product SKU matches query");
        assert(duration < 1000, `SKU search completed in ${duration.toFixed(2)}ms (well under 1000ms definition of done)`);
    }

    // Partial search across SKU / Name / Barcode
    {
        const start = performance.now();
        const res = await request(`/products?search=Optical`, { headers: { Authorization: `Bearer ${managerToken}` } });
        const duration = performance.now() - start;

        assert(res.status === 200, "Text search returns 200 OK");
        assert(res.data.count >= 1, "Text search found matching items");
        assert(duration < 1000, `Text search completed in ${duration.toFixed(2)}ms (< 1s)`);
    }

    // Smart Category Filter
    {
        const res = await request(`/products?category_id=${testCategoryId}`, { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "Filter by category_id returns 200 OK");
        assert(res.data.data.every(p => p.category_id === testCategoryId), "All returned products belong to selected category");
    }

    // Smart Stock Status Filter: Low Stock
    {
        const res = await request(`/products?status=low_stock`, { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "Filter by status=low_stock returns 200 OK");
        assert(res.data.data.every(p => p.total_stock <= p.min_stock), "All items in low_stock filter satisfy total_stock <= min_stock");
    }

    // Smart Warehouse Filter
    {
        const res = await request(`/products?warehouse_id=${testWarehouseId}`, { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "Filter by warehouse_id returns 200 OK");
    }

    // ============================================================
    // 5. LOW-STOCK ALERTS HOOKED TO REORDERING RULES & KPI FEED
    // ============================================================
    console.log("\n--- 5. Low-Stock Alerts & KPI Feed Integration ---");

    // Dedicated alerts endpoint
    {
        const res = await request("/products/alerts", { headers: { Authorization: `Bearer ${managerToken}` } });
        assert(res.status === 200, "GET /api/products/alerts returns 200 OK");
        assert(Array.isArray(res.data.data), "Alerts response contains array of alert items");
        assert(res.data.data.every(a => a.total_stock <= a.min_stock), "Every alerted product satisfies condition total_stock <= min_stock");

        const targetAlert = res.data.data.find(a => a.id === testProductId);
        assert(Boolean(targetAlert), "Newly created product with 12 units is present in reorder alerts");
        if (targetAlert) {
            assert(targetAlert.deficit === 3, "Alert correctly computes stock deficit (15 - 12 = 3 units)");
            assert(targetAlert.suggested_reorder_qty === 50, "Alert correctly suggests reorder quantity (50 units)");
        }
    }

    // KPI Feed in /api/health
    {
        const res = await request("/health");
        assert(res.status === 200, "GET /api/health returns 200 OK");
        assert(typeof res.data.low_stock_alerts_count === "number", "KPI feed exposes live low_stock_alerts_count");
        assert(res.data.low_stock_alerts_count >= 1, "Live KPI feed reflects current low-stock trigger count");
        assert(typeof res.data.total_units_in_stock === "number", "KPI feed exposes live total_units_in_stock");
    }

    // ============================================================
    // 6. CLEANUP & TEARDOWN
    // ============================================================
    console.log("\n--- 6. Cleanup & Reconcile ---");

    {
        // Zero out stock first before delete
        await request("/stock/adjust", {
            method: "PUT",
            headers: { Authorization: `Bearer ${managerToken}` },
            body: {
                product_id: testProductId,
                warehouse_id: testWarehouseId,
                quantity: 0,
                reason: "Phase 4 test cleanup"
            }
        });

        const delRes = await request(`/products/${testProductId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${managerToken}` }
        });
        assert(delRes.status === 200, "DELETE /api/products/:id cleanly removes test product");
    }

    console.log("\n============================================================");
    console.log(`\u2705 ALL TESTS PASSED! (${testsPassed} assertions passed, ${testsFailed} failed)`);
    console.log("============================================================\n");
}

runTests().catch(err => {
    console.error("\n\u2717 TEST SUITE ABORTED DUE TO ERROR:\n", err);
    process.exit(1);
});
