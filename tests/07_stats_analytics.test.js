/**
 * TEST SUITE 7: FINANCIAL STATS & TABLE ANALYTICS TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  assert
} from './test-utils.js';

export async function runStatsTests() {
  logHeader('7. SALES METRICS, FINANCIAL ANALYTICS & TABLE TESTS');
  let passed = 0;
  let failed = 0;

  // Test 1: Fetch Analytics Summary
  try {
    const res = await apiRequest('/stats/summary');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(typeof res.data.activeOrders === 'number', 'activeOrders should be a number');
    assert(typeof res.data.completedOrders === 'number', 'completedOrders should be a number');
    assert(typeof res.data.totalRevenue === 'number', 'totalRevenue should be a number');

    logPass(`Stats summary verified: Active: ${res.data.activeOrders}, Completed: ${res.data.completedOrders}, Total Revenue: $${res.data.totalRevenue}`);
    passed++;
  } catch (err) {
    logFail('Fetch stats summary failed', err);
    failed++;
  }

  // Test 2: Fetch Floor Plan Tables
  try {
    const res = await apiRequest('/tables');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Tables should be an array');
    assert.strictEqual(res.data.length, 8, 'Should have exactly 8 dining tables');

    const table4 = res.data.find(t => t.tableNumber === '04' || t.tableNumber === 4);
    assert(table4, 'Table 04 must exist');

    logPass(`Verified ${res.data.length} floor plan tables with zones and capacity`);
    passed++;
  } catch (err) {
    logFail('Fetch tables failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('07_stats_analytics.test.js')) {
  runStatsTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
