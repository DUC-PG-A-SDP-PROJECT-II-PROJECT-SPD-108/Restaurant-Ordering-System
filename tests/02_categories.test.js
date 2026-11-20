/**
 * TEST SUITE 2: CATEGORY MANAGEMENT TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  getAdminAuth,
  assert
} from './test-utils.js';

export async function runCategoryTests() {
  logHeader('2. CATEGORY CRUD & SLUG MAPPING TESTS');
  let passed = 0;
  let failed = 0;

  let adminAuth = null;
  let testCatId = null;

  try {
    adminAuth = await getAdminAuth();
  } catch (err) {
    logFail('Failed to obtain admin token for category tests', err);
    return { passed: 0, failed: 1 };
  }

  // Test 1: Fetch Categories
  try {
    const res = await apiRequest('/categories');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Data should be an array');
    assert(res.data.length >= 6, 'Should have standard 6 categories');

    const mains = res.data.find(c => c.id === 'mains' || c.name.includes('Mains'));
    assert(mains, 'Should find Mains category');
    assert.strictEqual(mains.id, 'mains', 'Mains category should map to "mains" slug');

    logPass(`Fetched ${res.data.length} categories with correct slug IDs (starters, mains, steaks...)`);
    passed++;
  } catch (err) {
    logFail('Fetch categories failed', err);
    failed++;
  }

  // Test 2: Create Category
  try {
    const res = await apiRequest('/categories', {
      method: 'POST',
      headers: adminAuth.authHeader,
      body: {
        name: 'Automated Test Category',
        icon: 'fa-solid fa-flask',
        description: 'Temporary category for automated test suite',
        displayOrder: 99
      }
    });

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert(res.data.id, 'Created category should have ID');
    assert.strictEqual(res.data.name, 'Automated Test Category');
    assert.strictEqual(res.data.displayOrder, 99);
    testCatId = res.data.id;

    logPass(`Category created successfully with ID #${testCatId} and displayOrder 99`);
    passed++;
  } catch (err) {
    logFail('Create category failed', err);
    failed++;
  }

  // Test 3: Update Category
  try {
    assert(testCatId, 'Test category ID required');
    const res = await apiRequest(`/categories/${testCatId}`, {
      method: 'PUT',
      headers: adminAuth.authHeader,
      body: {
        name: 'Updated Test Category',
        icon: 'fa-solid fa-flask-vial',
        displayOrder: 100
      }
    });

    assert.strictEqual(res.status, 200, 'Should return 200');
    assert.strictEqual(res.data.name, 'Updated Test Category');
    assert.strictEqual(res.data.displayOrder, 100);

    logPass(`Category #${testCatId} updated successfully`);
    passed++;
  } catch (err) {
    logFail('Update category failed', err);
    failed++;
  }

  // Test 4: Delete Category Cleanup
  try {
    assert(testCatId, 'Test category ID required');
    const res = await apiRequest(`/categories/${testCatId}`, {
      method: 'DELETE',
      headers: adminAuth.authHeader
    });

    assert.strictEqual(res.status, 200, 'Should return 200 on delete');
    logPass(`Category #${testCatId} deleted and cleaned up`);
    passed++;
  } catch (err) {
    logFail('Delete category failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('02_categories.test.js')) {
  runCategoryTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
