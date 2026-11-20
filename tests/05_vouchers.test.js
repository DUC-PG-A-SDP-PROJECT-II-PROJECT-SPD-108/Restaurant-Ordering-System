/**
 * TEST SUITE 5: VOUCHERS & PROMOTION CODES TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  getAdminAuth,
  assert
} from './test-utils.js';

export async function runVoucherTests() {
  logHeader('5. VOUCHERS, PROMO CODES & DISCOUNT VERIFICATION TESTS');
  let passed = 0;
  let failed = 0;

  let adminAuth = null;
  let testVoucherId = null;
  const testPromoCode = `TESTPROMO${Math.floor(10 + Math.random() * 89)}`;

  try {
    adminAuth = await getAdminAuth();
  } catch (err) {
    logFail('Failed to obtain admin token for voucher tests', err);
    return { passed: 0, failed: 1 };
  }

  // Test 1: Fetch Existing Vouchers
  try {
    const res = await apiRequest('/vouchers');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Vouchers should be an array');
    assert(res.data.length > 0, 'Should have initial seed vouchers');

    logPass(`Fetched ${res.data.length} active promo codes`);
    passed++;
  } catch (err) {
    logFail('Fetch vouchers failed', err);
    failed++;
  }

  // Test 2: Verify Seed Voucher at Checkout (AURAVIP15)
  try {
    const res = await apiRequest('/vouchers/verify', {
      method: 'POST',
      body: { code: 'AURAVIP15' }
    });

    assert.strictEqual(res.status, 200, 'Should return 200');
    assert.strictEqual(res.data.valid, true);
    assert.strictEqual(res.data.discountPercent, 15);

    logPass('Verified seed voucher "AURAVIP15" -> 15% discount');
    passed++;
  } catch (err) {
    logFail('Verify seed voucher failed', err);
    failed++;
  }

  // Test 3: Create New Dynamic Voucher as Admin
  try {
    const res = await apiRequest('/vouchers', {
      method: 'POST',
      headers: adminAuth.authHeader,
      body: {
        code: testPromoCode,
        discountPercent: 30,
        description: 'Automated 30% discount test',
        isActive: 1
      }
    });

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert(res.data.id, 'Created voucher should have ID');
    assert.strictEqual(res.data.code, testPromoCode);
    testVoucherId = res.data.id;

    logPass(`Created dynamic voucher "${testPromoCode}" (30% OFF)`);
    passed++;
  } catch (err) {
    logFail('Create voucher failed', err);
    failed++;
  }

  // Test 4: Verify Newly Created Voucher at Checkout
  try {
    const res = await apiRequest('/vouchers/verify', {
      method: 'POST',
      body: { code: testPromoCode }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.valid, true);
    assert.strictEqual(res.data.discountPercent, 30);

    logPass(`Newly created voucher "${testPromoCode}" verified dynamically at checkout`);
    passed++;
  } catch (err) {
    logFail('Verify newly created voucher failed', err);
    failed++;
  }

  // Test 5: Disable Voucher & Verify Rejection
  try {
    assert(testVoucherId, 'Voucher ID required');
    const updateRes = await apiRequest(`/vouchers/${testVoucherId}`, {
      method: 'PUT',
      headers: adminAuth.authHeader,
      body: { isActive: 0 }
    });
    assert.strictEqual(updateRes.status, 200);

    const verifyRes = await apiRequest('/vouchers/verify', {
      method: 'POST',
      body: { code: testPromoCode }
    });
    assert.strictEqual(verifyRes.status, 404, 'Disabled voucher should be rejected');

    logPass(`Disabled voucher "${testPromoCode}" correctly rejected with 404`);
    passed++;
  } catch (err) {
    logFail('Disable voucher check failed', err);
    failed++;
  }

  // Test 6: Delete Voucher Cleanup
  try {
    assert(testVoucherId, 'Voucher ID required');
    const res = await apiRequest(`/vouchers/${testVoucherId}`, {
      method: 'DELETE',
      headers: adminAuth.authHeader
    });
    assert.strictEqual(res.status, 200);
    logPass(`Cleaned up test voucher "${testPromoCode}"`);
    passed++;
  } catch (err) {
    logFail('Delete voucher failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('05_vouchers.test.js')) {
  runVoucherTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
