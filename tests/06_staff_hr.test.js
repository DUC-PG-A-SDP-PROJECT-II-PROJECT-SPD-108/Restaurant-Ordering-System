/**
 * TEST SUITE 6: STAFF & HR ROSTER CRUD TESTS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  getAdminAuth,
  loginAs,
  assert
} from './test-utils.js';

export async function runStaffTests() {
  logHeader('6. STAFF ROSTER, STAFF-X RESOLVER & HR MANAGEMENT TESTS');
  let passed = 0;
  let failed = 0;

  let adminAuth = null;
  let testStaffId = null;
  const testUsername = `waiter_${Date.now().toString().slice(-4)}`;

  try {
    adminAuth = await getAdminAuth();
  } catch (err) {
    logFail('Failed to obtain admin token for staff tests', err);
    return { passed: 0, failed: 1 };
  }

  // Test 1: Fetch Staff Roster
  try {
    const res = await apiRequest('/staff');
    assert.strictEqual(res.status, 200, 'Should return 200');
    assert(Array.isArray(res.data), 'Staff should be an array');
    assert(res.data.length >= 4, 'Should have initial staff users');

    const first = res.data[0];
    assert(first.id.startsWith('staff-'), 'ID should be formatted as "staff-X"');
    assert(first.role, 'Role must exist');

    logPass(`Fetched ${res.data.length} staff members with formatted IDs (e.g. ${first.id})`);
    passed++;
  } catch (err) {
    logFail('Fetch staff roster failed', err);
    failed++;
  }

  // Test 2: Create New Staff Member
  try {
    const res = await apiRequest('/staff', {
      method: 'POST',
      headers: adminAuth.authHeader,
      body: {
        username: testUsername,
        password: 'securepass123',
        name: 'Automated Test Waiter',
        role: 'staff',
        department: 'Front of House & Service',
        hourlyRate: 5.25,
        dutyStatus: 'on_duty'
      }
    });

    assert.strictEqual(res.status, 201, 'Should return 201 Created');
    assert(res.data.id.startsWith('staff-'), 'Staff ID should be "staff-X"');
    assert.strictEqual(res.data.username, testUsername);
    testStaffId = res.data.id;

    logPass(`Created new staff user "${testUsername}" with ID ${testStaffId}`);
    passed++;
  } catch (err) {
    logFail('Create staff failed', err);
    failed++;
  }

  // Test 3: Authenticate as the Newly Created Staff Member
  try {
    const auth = await loginAs(testUsername, 'securepass123');
    assert(auth.token, 'Should receive token');
    assert.strictEqual(auth.user.username, testUsername);
    assert.strictEqual(auth.user.role, 'staff');

    logPass(`New staff member "${testUsername}" authenticated successfully`);
    passed++;
  } catch (err) {
    logFail('Staff authentication failed', err);
    failed++;
  }

  // Test 4: Update Staff Details using 'staff-X' ID
  try {
    assert(testStaffId, 'Staff ID required');
    const res = await apiRequest(`/staff/${testStaffId}`, {
      method: 'PUT',
      headers: adminAuth.authHeader,
      body: {
        hourlyRate: 6.00,
        dutyStatus: 'off_duty'
      }
    });

    assert.strictEqual(res.status, 200);
    logPass(`Updated staff ${testStaffId} rate to $6.00/hr and dutyStatus to "off_duty"`);
    passed++;
  } catch (err) {
    logFail('Update staff failed', err);
    failed++;
  }

  // Test 5: Delete Staff Cleanup using 'staff-X' ID
  try {
    assert(testStaffId, 'Staff ID required');
    const res = await apiRequest(`/staff/${testStaffId}`, {
      method: 'DELETE',
      headers: adminAuth.authHeader
    });

    assert.strictEqual(res.status, 200);
    logPass(`Cleaned up and deleted test staff member ${testStaffId}`);
    passed++;
  } catch (err) {
    logFail('Delete staff failed', err);
    failed++;
  }

  return { passed, failed };
}

if (process.argv[1]?.endsWith('06_staff_hr.test.js')) {
  runStaffTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
