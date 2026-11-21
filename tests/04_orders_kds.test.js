/**
 * TEST SUITE 4: CUSTOMER ORDERS & KITCHEN KDS LIFECYCLE TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  assert
} from './test-utils.js';

export async function runOrderTests() {
  logHeader('4. CUSTOMER ORDERS & KITCHEN KDS 4-STAGE LIFECYCLE TESTS');
  let passed = 0;
  let failed = 0;

  const testOrderCode = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  // Test 1: Place Customer Order with String Dish IDs
  try {
    const res = await apiRequest('/orders', {
      method: 'POST',
      body: {
        orderCode: testOrderCode,
        diningMode: 'dine-in',
        tableNumber: '04',
        customerName: 'Sophea Tester',
        customerPhone: '012 345 678',
        paymentMethod: 'khqr',
        paymentStatus: 'Paid',
        items: [
          { id: 'dish-1', quantity: 1, price: 38.50 },
          { id: 'dish-2', quantity: 2, price: 24.00 }
        ]
      }
    });

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert.strictEqual(res.data.orderCode, testOrderCode);
    assert.strictEqual(res.data.status, 'pending');

    // Subtotal: 38.50 + 48.00 = 86.50
    // Tax (10%): 8.65, Service (5%): 4.325 -> Total: 99.475 -> 99.48
    assert(res.data.totalAmount > 86.50, 'Total should include tax and service');

    logPass(`Order placed: ${testOrderCode} ($${res.data.totalAmount}) at Table #04`);
    passed++;
  } catch (err) {
    logFail('Place customer order failed', err);
    failed++;
  }

  // Test 2: Fetch Orders & Verify Table Number Formatting
  try {
    const res = await apiRequest('/orders');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Orders should be array');

    const found = res.data.find(o => o.orderCode === testOrderCode || o.id === testOrderCode);
    assert(found, `Order ${testOrderCode} must exist in active orders list`);
    assert.strictEqual(found.tableNumber, '04', 'Table number must be padded to "04"');
    assert.strictEqual(found.status, 'pending', 'Initial status must be "pending"');

    logPass(`Verified order in KDS queue with Table #${found.tableNumber} and status "${found.status}"`);
    passed++;
  } catch (err) {
    logFail('Fetch and verify order failed', err);
    failed++;
  }

  // Test 3: Status Transition: pending -> cooking
  try {
    const res = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      body: { status: 'cooking' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'cooking');
    logPass(`Stage 2: Order ${testOrderCode} transitioned to "COOKING" in kitchen`);
    passed++;
  } catch (err) {
    logFail('Transition to cooking failed', err);
    failed++;
  }

  // Test 4: Status Transition: cooking -> ready
  try {
    const res = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      body: { status: 'ready' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ready');
    logPass(`Stage 3: Order ${testOrderCode} transitioned to "READY" on pass counter`);
    passed++;
  } catch (err) {
    logFail('Transition to ready failed', err);
    failed++;
  }

  // Test 5: Status Transition: ready -> served
  try {
    const res = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      body: { status: 'served' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'served');
    logPass(`Stage 4: Order ${testOrderCode} transitioned to "SERVED" (Completed)`);
    passed++;
  } catch (err) {
    logFail('Transition to served failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('04_orders_kds.test.js')) {
  runOrderTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
