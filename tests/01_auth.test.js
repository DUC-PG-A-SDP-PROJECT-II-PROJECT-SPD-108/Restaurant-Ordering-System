/**
 * TEST SUITE 1: AUTHENTICATION & RBAC PERMISSIONS
 */
import {
  logHeader,
  logPass,
  logFail,
  apiRequest,
  loginAs,
  getAdminAuth,
  getStaffAuth,
  assert
} from './test-utils.js';

export async function runAuthTests() {
  logHeader('1. AUTHENTICATION & RBAC PERMISSION TESTS');
  let passed = 0;
  let failed = 0;

  // Test 1: Admin Login
  try {
    const admin = await loginAs('admin', 'admin123');
    assert(admin.token, 'Token should exist');
    assert.strictEqual(admin.user.role, 'admin', 'Role should be admin');
    logPass('Admin login returns valid JWT token and admin role');
    passed++;
  } catch (err) {
    logFail('Admin login failed', err);
    failed++;
  }

  // Test 2: Manager, Kitchen, Staff logins
  const roles = [
    { username: 'manager', password: 'manager123', expectedRole: 'manager' },
    { username: 'kitchen', password: 'kitchen123', expectedRole: 'kitchen' },
    { username: 'staff', password: 'staff123', expectedRole: 'staff' }
  ];

  for (const r of roles) {
    try {
      const auth = await loginAs(r.username, r.password);
      assert.strictEqual(auth.user.role, r.expectedRole);
      logPass(`${r.expectedRole.toUpperCase()} login succeeded with correct role`);
      passed++;
    } catch (err) {
      logFail(`${r.expectedRole} login failed`, err);
      failed++;
    }
  }

  // Test 3: Invalid credentials
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrongpassword' }
    });
    assert.strictEqual(res.status, 401, 'Should return 401 for wrong password');
    logPass('Wrong password correctly rejected with 401 Unauthorized');
    passed++;
  } catch (err) {
    logFail('Invalid credentials check failed', err);
    failed++;
  }

  // Test 4: Missing token on protected route
  try {
    const res = await apiRequest('/categories', {
      method: 'POST',
      body: { name: 'Unauthorized Category' }
    });
    assert.strictEqual(res.status, 401, 'Should return 401 without Bearer token');
    logPass('Protected mutation without token rejected with 401 Access token required');
    passed++;
  } catch (err) {
    logFail('Missing token check failed', err);
    failed++;
  }

  // Test 5: RBAC Role Protection (Staff cannot create categories)
  try {
    const staff = await getStaffAuth();
    const res = await apiRequest('/categories', {
      method: 'POST',
      headers: staff.authHeader,
      body: { name: 'Staff Forbidden Category' }
    });
    assert.strictEqual(res.status, 403, 'Staff role should be rejected with 403');
    logPass('Staff role forbidden from creating categories (403 Insufficient permissions)');
    passed++;
  } catch (err) {
    logFail('RBAC staff role restriction check failed', err);
    failed++;
  }

  return { passed, failed };
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith('01_auth.test.js')) {
  runAuthTests().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
