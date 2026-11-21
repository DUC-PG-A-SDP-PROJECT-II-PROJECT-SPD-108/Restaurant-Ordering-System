/**
 * TEST SUITE 3: MENU ITEMS & DISH CRUD TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  getAdminAuth,
  assert
} from './test-utils.js';

export async function runMenuTests() {
  logHeader('3. MENU ITEMS, DISH-X RESOLVER & STOCK TOGGLING TESTS');
  let passed = 0;
  let failed = 0;

  let adminAuth = null;
  let testDishId = null;

  try {
    adminAuth = await getAdminAuth();
  } catch (err) {
    logFail('Failed to obtain admin token for menu tests', err);
    return { passed: 0, failed: 1 };
  }

  // Test 1: Fetch Menu
  try {
    const res = await apiRequest('/menu');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Data should be an array');
    assert(res.data.length > 0, 'Menu items should not be empty');

    const first = res.data[0];
    assert(first.id.startsWith('dish-'), 'ID should be formatted as "dish-X"');
    assert(typeof first.price === 'number', 'Price should be number');
    assert(typeof first.inStock === 'boolean', 'inStock should be boolean');

    logPass(`Fetched ${res.data.length} dishes with formatted IDs (e.g. ${first.id})`);
    passed++;
  } catch (err) {
    logFail('Fetch menu failed', err);
    failed++;
  }

  // Test 2: Create Dish with Slug Category ('mains') and Empty Image (Tests Fallback)
  try {
    const res = await apiRequest('/menu', {
      method: 'POST',
      headers: adminAuth.authHeader,
      body: {
        name: 'Automated Truffle Pasta Test',
        category: 'pastas', // String slug resolution
        price: 26.50,
        description: 'Automated test recipe',
        image: '' // Should receive gourmet Unsplash fallback
      }
    });

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert(res.data.id.startsWith('dish-'), 'Created dish should have "dish-X" ID');
    assert.strictEqual(res.data.categoryId, 4, 'Slug "pastas" should resolve to category ID 4');
    testDishId = res.data.id;

    logPass(`Created dish ${testDishId} with slug "pastas" -> categoryId 4`);
    passed++;
  } catch (err) {
    logFail('Create dish failed', err);
    failed++;
  }

  // Test 3: Toggle Stock using 'dish-X' string ID
  try {
    assert(testDishId, 'Test dish ID required');
    const res = await apiRequest(`/menu/${testDishId}/toggle`, {
      method: 'PATCH',
      headers: adminAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'Should return 200 on stock toggle');
    assert.strictEqual(res.data.isAvailable, false, 'Stock should toggle to false');
    assert.strictEqual(res.data.inStock, false, 'inStock should toggle to false');

    logPass(`Stock toggled for ${testDishId} using string ID (now Out of Stock)`);
    passed++;
  } catch (err) {
    logFail('Toggle stock failed', err);
    failed++;
  }

  // Test 4: Update Dish
  try {
    assert(testDishId, 'Test dish ID required');
    const res = await apiRequest(`/menu/${testDishId}`, {
      method: 'PUT',
      headers: adminAuth.authHeader,
      body: {
        price: 29.99,
        description: 'Updated gourmet recipe'
      }
    });

    assert.strictEqual(res.status, 200, 'Should return 200 on update');
    logPass(`Updated dish ${testDishId} price to $29.99`);
    passed++;
  } catch (err) {
    logFail('Update dish failed', err);
    failed++;
  }

  // Test 5: Delete Dish Cleanup
  try {
    assert(testDishId, 'Test dish ID required');
    const res = await apiRequest(`/menu/${testDishId}`, {
      method: 'DELETE',
      headers: adminAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'Should return 200 on delete');
    logPass(`Deleted and cleaned up test dish ${testDishId}`);
    passed++;
  } catch (err) {
    logFail('Delete dish failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('03_menu_dishes.test.js')) {
  runMenuTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
