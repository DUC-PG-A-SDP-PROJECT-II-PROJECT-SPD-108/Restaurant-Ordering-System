/**
 * AURA BISTRO - TEST UTILITIES & HELPERS
 * Lightweight test harness using Node.js native fetch & assertions (Zero extra dependencies)
 */
import assert from 'node:assert';

export const API_BASE = process.env.API_URL || 'http://127.0.0.1:5050/api';

// ANSI Colors for Terminal
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

export function logHeader(title) {
  console.log(`\n${colors.cyan}${colors.bright}================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}================================================================${colors.reset}`);
}

export function logPass(msg) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`);
}

export function logFail(msg, err) {
  console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${msg}`);
  if (err) console.log(`    ${colors.gray}${err.message || err}${colors.reset}`);
}

export function logInfo(msg) {
  console.log(`  ${colors.gray}ℹ ${msg}${colors.reset}`);
}

/**
 * Universal JSON API Request Helper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof String)) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return {
    status: res.status,
    ok: res.ok,
    headers: res.headers,
    data
  };
}

/**
 * Authenticate and retrieve JWT Bearer token
 */
const tokenCache = {};

export async function loginAs(username, password) {
  if (tokenCache[username]) {
    return tokenCache[username];
  }

  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: { username, password }
  });

  if (!res.ok || !res.data?.token) {
    throw new Error(`Failed to login as ${username}: ${res.data?.error || res.status}`);
  }

  tokenCache[username] = {
    token: res.data.token,
    user: res.data.user,
    authHeader: { Authorization: `Bearer ${res.data.token}` }
  };

  return tokenCache[username];
}

export async function getAdminAuth() {
  return loginAs('admin', 'admin123');
}

export async function getManagerAuth() {
  return loginAs('manager', 'manager123');
}

export async function getKitchenAuth() {
  return loginAs('kitchen', 'kitchen123');
}

export async function getStaffAuth() {
  return loginAs('staff', 'staff123');
}

export { assert };
