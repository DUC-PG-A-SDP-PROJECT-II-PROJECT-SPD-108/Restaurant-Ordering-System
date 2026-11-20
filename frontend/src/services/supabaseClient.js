import { createClient } from '@supabase/supabase-js';

// Re-export all API data operations from the secure Express Backend
export {
  apiLogin,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemStock,
  deleteMenuItem,
  getOrders,
  saveOrder,
  updateOrderStatus,
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser
} from './api';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://watdyzpxjlcmxdjiowih.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_iq8ZjOrUgAjVcfnyCHj7Fw_9Zkpf5nW';

/**
 * Lightweight Supabase Client reserved exclusively for:
 * 1. WebSocket Realtime Listeners (e.g. supabase.channel('schema-db-changes-orders'))
 * 2. Cross-device Live Order Event Broadcasting
 * All database CRUD mutations are strictly mediated by the Express Backend.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
