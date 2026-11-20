/**
 * AURA BISTRO - MASTER TEST RUNNER
 * Executes all automated test suites and produces a unified test report.
 */
import { logHeader, colors, apiRequest } from './test-utils.js';
import { runAuthTests } from './01_auth.test.js';
import { runCategoryTests } from './02_categories.test.js';
import { runMenuTests } from './03_menu_dishes.test.js';
import { runOrderTests } from './04_orders_kds.test.js';
import { runVoucherTests } from './05_vouchers.test.js';
import { runStaffTests } from './06_staff_hr.test.js';
import { runStatsTests } from './07_stats_analytics.test.js';
import { runE2EWorkflowTests } from './08_e2e_workflow.test.js';

async function main() {
  const startTime = Date.now();

  console.log(`${colors.cyan}${colors.bright}`);
  console.log(`╔══════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║      AURA BISTRO (ROS) - AUTOMATED END-TO-END TEST HARNESS               ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  // 1. Check Backend Server Health
  console.log(`\n${colors.gray}Checking Backend Server on http://localhost:5000/api/health...${colors.reset}`);
  try {
    const health = await apiRequest('/health');
    if (!health.ok) {
      throw new Error(`Health returned HTTP ${health.status}`);
    }
    console.log(`${colors.green}✔ Backend Server is HEALTHY & RUNNING.${colors.reset}`);
  } catch (err) {
    console.error(`\n${colors.red}${colors.bright}✖ ERROR: Backend Server is not reachable at http://localhost:5000!${colors.reset}`);
    console.error(`${colors.yellow}Please start the backend server first (e.g. run "run.bat" or "npm --prefix backend run dev") and retry.${colors.reset}\n`);
    process.exit(1);
  }

  const testSuites = [
    { name: 'Auth & RBAC', fn: runAuthTests },
    { name: 'Categories', fn: runCategoryTests },
    { name: 'Menu & Dishes', fn: runMenuTests },
    { name: 'Orders & KDS', fn: runOrderTests },
    { name: 'Vouchers & Promo', fn: runVoucherTests },
    { name: 'Staff & HR', fn: runStaffTests },
    { name: 'Stats & Analytics', fn: runStatsTests },
    { name: 'E2E Full Workflow', fn: runE2EWorkflowTests }
  ];

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of testSuites) {
    try {
      const res = await suite.fn();
      results.push({ name: suite.name, ...res });
      totalPassed += res.passed;
      totalFailed += res.failed;
    } catch (err) {
      console.error(`Unexpected suite error in ${suite.name}:`, err);
      results.push({ name: suite.name, passed: 0, failed: 1 });
      totalFailed += 1;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print Summary Table
  console.log(`\n${colors.bright}================================================================${colors.reset}`);
  console.log(`${colors.bright}  AUTOMATED TEST RESULTS SUMMARY REPORT                          ${colors.reset}`);
  console.log(`${colors.bright}================================================================${colors.reset}`);
  console.log(`  ${'Test Suite'.padEnd(28)} | ${'Passed'.padEnd(8)} | ${'Failed'.padEnd(8)} | Status`);
  console.log(`  -----------------------------|----------|----------|--------`);

  for (const r of results) {
    const statusText = r.failed === 0 ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(
      `  ${r.name.padEnd(28)} | ${String(r.passed).padEnd(8)} | ${String(r.failed).padEnd(8)} | ${statusText}`
    );
  }

  console.log(`  -----------------------------|----------|----------|--------`);
  console.log(
    `  ${colors.bright}${'TOTAL'.padEnd(28)} | ${String(totalPassed).padEnd(8)} | ${String(totalFailed).padEnd(8)} | ${totalFailed === 0 ? `${colors.green}ALL PASS` : `${colors.red}FAILURES`}${colors.reset}`
  );
  console.log(`\n  ${colors.gray}Total Duration: ${durationSec}s${colors.reset}`);

  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 ALL ${totalPassed} AUTOMATED TESTS COMPLETED WITH ZERO ERRORS!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ ${totalFailed} TEST(S) FAILED. Please review the logs above.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
