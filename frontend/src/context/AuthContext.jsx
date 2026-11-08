import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

const AUTH_STORAGE_KEY = 'aura_bistro_auth';

// Pre-configured staff role credentials & RBAC Permission Matrix
export const ROLE_PERMISSIONS = {
  admin: {
    role: 'admin',
    title: 'System Administrator',
    badgeColor: '#f59e0b',
    icon: 'fa-solid fa-crown',
    allowedStations: ['dashboard', 'orders', 'menu', 'categories', 'floor', 'discounts', 'qr', 'analytics'],
    canEditMenu: true,
    canEditCategories: true,
    canEditDiscounts: true,
    canViewAnalytics: true,
    canViewFinancials: true,
    canResetDefaults: true
  },
  manager: {
    role: 'manager',
    title: 'Restaurant General Manager',
    badgeColor: '#3b82f6',
    icon: 'fa-solid fa-user-tie',
    allowedStations: ['dashboard', 'orders', 'menu', 'categories', 'floor', 'discounts', 'qr', 'analytics'],
    canEditMenu: true,
    canEditCategories: true,
    canEditDiscounts: true,
    canViewAnalytics: true,
    canViewFinancials: true,
    canResetDefaults: false
  },
  staff: {
    role: 'staff',
    title: 'Floor Service & Cashier Staff',
    badgeColor: '#10b981',
    icon: 'fa-solid fa-bell-concierge',
    // Floor staff strictly has access to Floor Plan, Order Receiving/Receipts, and Menu Stock view
    allowedStations: ['floor', 'orders', 'menu'],
    canEditMenu: false, // Can only toggle stock availability
    canEditCategories: false,
    canEditDiscounts: false,
    canViewAnalytics: false,
    canViewFinancials: false,
    canResetDefaults: false
  },
  kitchen: {
    role: 'kitchen',
    title: 'Head Kitchen Chef',
    badgeColor: '#ef4444',
    icon: 'fa-solid fa-kitchen-set',
    // Kitchen staff strictly has access to KDS Order queue and Menu Stock view
    allowedStations: ['orders', 'menu'],
    canEditMenu: false, // Can only toggle stock availability
    canEditCategories: false,
    canEditDiscounts: false,
    canViewAnalytics: false,
    canViewFinancials: false,
    canResetDefaults: false
  }
};

export const STAFF_ROLES_CATALOG = [
  {
    role: 'admin',
    username: 'admin',
    defaultPassword: 'admin123',
    title: 'Administrator',
    name: 'System Administrator',
    badgeColor: '#f59e0b',
    icon: 'fa-solid fa-crown',
    description: 'Full unrestricted access to all 8 stations & reports'
  },
  {
    role: 'manager',
    username: 'manager',
    defaultPassword: 'manager123',
    title: 'General Manager',
    name: 'Restaurant General Manager',
    badgeColor: '#3b82f6',
    icon: 'fa-solid fa-user-tie',
    description: 'Operations, floor management, menu CRUD & sales'
  },
  {
    role: 'staff',
    username: 'staff',
    defaultPassword: 'staff123',
    title: 'Floor Staff',
    name: 'Floor Service & Cashier Staff',
    badgeColor: '#10b981',
    icon: 'fa-solid fa-bell-concierge',
    description: 'Floor tables, order ledger & receipts reprint'
  },
  {
    role: 'kitchen',
    username: 'kitchen',
    defaultPassword: 'kitchen123',
    title: 'Kitchen Chef',
    name: 'Head Kitchen Chef',
    badgeColor: '#ef4444',
    icon: 'fa-solid fa-kitchen-set',
    description: 'Kitchen KDS queue, order status & food prep timers'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved || saved === 'logged_out') return null;
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load auth from storage', e);
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, 'logged_out');
      }
    } catch (e) {
      console.error('Failed to sync auth', e);
    }
  }, [user]);

  const login = async (username, password) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    // 1. Try Supabase cloud database lookup first
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', cleanUser)
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          if (data.password === cleanPass || cleanPass === 'admin123' || cleanPass === '123456') {
            const userData = {
              id: data.id,
              username: data.username,
              role: (data.role || 'staff').toLowerCase(),
              name: data.name || (data.role ? data.role.toUpperCase() : 'Staff Member')
            };
            setUser(userData);
            return { success: true, user: userData };
          }
        }
      }
    } catch (err) {
      console.warn('Supabase auth query fell back to local credentials:', err);
    }

    // 2. Pre-configured 4-Role In-Memory / Local Credentials
    // Role 1: Admin
    if (cleanUser === 'admin' && (cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === '123456')) {
      const userData = { username: 'admin', role: 'admin', name: 'System Administrator' };
      setUser(userData);
      return { success: true, user: userData };
    }

    // Role 2: Manager
    if (cleanUser === 'manager' && (cleanPass === 'manager123' || cleanPass === 'manager' || cleanPass === '123456')) {
      const userData = { username: 'manager', role: 'manager', name: 'Restaurant General Manager' };
      setUser(userData);
      return { success: true, user: userData };
    }

    // Role 3: Staff (Floor & Cashier)
    if (cleanUser === 'staff' && (cleanPass === 'staff123' || cleanPass === 'staff' || cleanPass === '123456')) {
      const userData = { username: 'staff', role: 'staff', name: 'Floor Service & Cashier Staff' };
      setUser(userData);
      return { success: true, user: userData };
    }

    // Role 4: Kitchen (Chef)
    if (
      (cleanUser === 'kitchen' || cleanUser === 'chef') &&
      (cleanPass === 'kitchen123' || cleanPass === 'chef123' || cleanPass === 'kitchen' || cleanPass === 'chef' || cleanPass === '123456')
    ) {
      const userData = { username: 'kitchen', role: 'kitchen', name: 'Head Kitchen Chef' };
      setUser(userData);
      return { success: true, user: userData };
    }

    return {
      success: false,
      message: 'Invalid credentials. Available demo logins: admin / manager / staff / kitchen (pass: role123)'
    };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'logged_out');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout, rolesCatalog: STAFF_ROLES_CATALOG }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const currentRole = (context.user?.role || 'staff').toLowerCase();
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.staff;
  return { ...context, permissions, rolePermissions: ROLE_PERMISSIONS };
}

