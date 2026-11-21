/**
 * TEST SUITE 8: COMPLETE END-TO-END RESTAURANT WORKFLOW (E2E)
 * Simulates real-world lifecycle from Menu Creation -> Customer Ordering -> Kitchen KDS -> Final Billing
 */
import {
  logHeader,
  logPass,
  logFail,
  logInfo,
  apiRequest,
  getAdminAuth,
  getManagerAuth,
  getKitchenAuth,
  getStaffAuth,
  assert
} from './test-utils.js';

export async function runE2EWorkflowTests() {
  logHeader('8. COMPLETE END-TO-END RESTAURANT SIMULATION (E2E)');
  let passed = 0;
  let failed = 0;

  const timestamp = Date.now().toString().slice(-4);
  const testOrderCode = `ORD-E2E-${timestamp}`;
  const testVoucherCode = `VIP${timestamp}`;
  let dishId = null;
  let voucherId = null;

  try {
    // -------------------------------------------------------------------------
    // Step 1: Manager signs in and creates a Seasonal Special dish
    // -------------------------------------------------------------------------
    logInfo('Step 1: General Manager creates Seasonal Dish...');
    const manager = await getManagerAuth();

    const dishRes = await apiRequest('/menu', {
      method: 'POST',
      headers: manager.authHeader,
      body: {
        name: `A5 Wagyu & Black Truffle Carpaccio #${timestamp}`,
        category: 'starters',
        price: 35.00,
        description: 'Ultra-thin marbled Wagyu with white truffle ponzu and crispy capers'
      }
    });

    assert.strictEqual(dishRes.status, 201, 'Dish should be created');
    dishId = dishRes.data.id;
    logPass(`Manager published dish: "${dishRes.data.name}" (${dishId}) at $35.00`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 2: Admin creates a promotional voucher
    // -------------------------------------------------------------------------
    logInfo('Step 2: Admin publishes VIP Promo Voucher...');
    const admin = await getAdminAuth();

    const voucherRes = await apiRequest('/vouchers', {
      method: 'POST',
      headers: admin.authHeader,
      body: {
        code: testVoucherCode,
        discountPercent: 20,
        description: '20% VIP Grand Dining Special',
        isActive: 1
      }
    });

    assert.strictEqual(voucherRes.status, 201, 'Voucher should be created');
    voucherId = voucherRes.data.id;
    logPass(`Admin published voucher "${testVoucherCode}" (20% OFF)`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 3: Customer at Table #04 scans QR and verifies voucher code
    // -------------------------------------------------------------------------
    logInfo('Step 3: Customer scans QR at Table #04 and applies voucher...');
    const verifyRes = await apiRequest('/vouchers/verify', {
      method: 'POST',
      body: { code: testVoucherCode }
    });

    assert.strictEqual(verifyRes.status, 200, 'Voucher verification should succeed');
    assert.strictEqual(verifyRes.data.valid, true);
    assert.strictEqual(verifyRes.data.discountPercent, 20);
    logPass(`Customer applied voucher: "${testVoucherCode}" (20% OFF confirmed)`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 4: Customer submits order (Dine-in Table #04)
    // -------------------------------------------------------------------------
    logInfo('Step 4: Customer places order via Bakong KHQR checkout...');
    const orderRes = await apiRequest('/orders', {
      method: 'POST',
      body: {
        orderCode: testOrderCode,
        diningMode: 'dine-in',
        tableNumber: '04',
        customerName: 'Ah Nich (VIP Guest)',
        customerPhone: '012 889 901',
        paymentMethod: 'khqr',
        paymentStatus: 'Paid',
        specialNotes: 'Carpaccio cold with extra truffle slices please.',
        items: [
          { id: dishId, quantity: 2, price: 35.00 }
        ]
      }
    });

    assert.strictEqual(orderRes.status, 201, 'Order should be created');
    assert.strictEqual(orderRes.data.orderCode, testOrderCode);
    assert.strictEqual(orderRes.data.status, 'pending');
    logPass(`Order #${testOrderCode} received ($${orderRes.data.totalAmount}) at Table #04`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 5: Kitchen Chef receives ticket and begins cooking
    // -------------------------------------------------------------------------
    logInfo('Step 5: Kitchen Chef receives live KDS ticket and starts cooking...');
    const chef = await getKitchenAuth();

    const cookingRes = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      headers: chef.authHeader,
      body: { status: 'cooking' }
    });

    assert.strictEqual(cookingRes.status, 200);
    assert.strictEqual(cookingRes.data.status, 'cooking');
    logPass(`KDS Station: Order #${testOrderCode} moved to [COOKING] in kitchen`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 6: Kitchen Chef finishes plating and marks food Ready
    // -------------------------------------------------------------------------
    logInfo('Step 6: Chef completes plating and rings ready bell chime...');
    const readyRes = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      headers: chef.authHeader,
      body: { status: 'ready' }
    });

    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.data.status, 'ready');
    logPass(`Pass Counter: Order #${testOrderCode} moved to [READY TO SERVE]`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 7: Floor Server delivers food to Table #04 and completes ticket
    // -------------------------------------------------------------------------
    logInfo('Step 7: Floor Staff serves dishes to Table #04...');
    const staff = await getStaffAuth();

    const servedRes = await apiRequest(`/orders/${testOrderCode}/status`, {
      method: 'PATCH',
      headers: staff.authHeader,
      body: { status: 'served' }
    });

    assert.strictEqual(servedRes.status, 200);
    assert.strictEqual(servedRes.data.status, 'served');
    logPass(`Floor Service: Order #${testOrderCode} delivered and marked [SERVED]`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 8: Verify Real-Time Executive Overview Revenue Analytics
    // -------------------------------------------------------------------------
    logInfo('Step 8: Verifying Executive Overview sales reports...');
    const statsRes = await apiRequest('/stats/summary');
    assert.strictEqual(statsRes.status, 200);
    assert(statsRes.data.totalRevenue > 0, 'Total revenue should reflect order sale');
    logPass(`Financial Analytics: Revenue updated to $${statsRes.data.totalRevenue.toFixed(2)}`);
    passed++;

    // -------------------------------------------------------------------------
    // Step 9: Automatic Clean-up of Test Entities
    // -------------------------------------------------------------------------
    logInfo('Step 9: Cleaning up test artifacts...');
    if (dishId) {
      await apiRequest(`/menu/${dishId}`, { method: 'DELETE', headers: admin.authHeader });
    }
    if (voucherId) {
      await apiRequest(`/vouchers/${voucherId}`, { method: 'DELETE', headers: admin.authHeader });
    }
    logPass('E2E Test Artifacts cleaned up successfully');
    passed++;

  } catch (err) {
    logFail('E2E Workflow Test encountered an error', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('08_e2e_workflow.test.js')) {
  runE2EWorkflowTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
