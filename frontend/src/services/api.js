import axios from 'axios';
import { supabase, getMenuItems, getOrders, saveOrder, updateOrderStatus } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export { supabase, getMenuItems, getOrders, saveOrder, updateOrderStatus };
export default api;

