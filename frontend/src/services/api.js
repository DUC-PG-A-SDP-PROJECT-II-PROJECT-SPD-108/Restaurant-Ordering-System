import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT Token if logged in
api.interceptors.request.use((config) => {
  try {
    const savedAuth = localStorage.getItem('aura_bistro_auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {}
  return config;
});

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized (401). Triggering logout event.');
      try {
        localStorage.removeItem('aura_bistro_auth');
        window.dispatchEvent(new CustomEvent('aura_auth_expired'));
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   0. AUTHENTICATION API
   ========================================================================== */
export async function apiLogin(username, password) {
  try {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  } catch (err) {
    console.warn('Backend apiLogin failed:', err.response?.data?.error || err.message);
    return null;
  }
}

/* ==========================================================================
   1. CATEGORIES API
   ========================================================================== */
export async function getCategories() {
  try {
    const res = await api.get('/categories');
    return (res.data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'fa-solid fa-utensils',
      count: Number(cat.count || 0),
      description: cat.description || '',
      displayOrder: cat.display_order || cat.displayOrder || 0
    }));
  } catch (err) {
    console.warn('Backend getCategories failed:', err.message);
    return null;
  }
}

export async function createCategory(cat) {
  try {
    const res = await api.post('/categories', cat);
    return res.data;
  } catch (err) {
    console.warn('Backend createCategory failed:', err.message);
    return null;
  }
}

export async function updateCategory(id, updates) {
  try {
    const res = await api.put(`/categories/${id}`, updates);
    return res.data;
  } catch (err) {
    console.warn('Backend updateCategory failed:', err.message);
    return null;
  }
}

export async function deleteCategory(id) {
  try {
    await api.delete(`/categories/${id}`);
    return true;
  } catch (err) {
    console.warn('Backend deleteCategory failed:', err.message);
    return false;
  }
}

/* ==========================================================================
   2. MENU ITEMS API
   ========================================================================== */
export async function getMenuItems() {
  try {
    const res = await api.get('/menu');
    return (res.data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category || (item.categoryName ? item.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'mains'),
      categoryName: item.categoryName || item.category || 'Mains',
      categoryId: item.categoryId || item.dbId,
      dbId: item.dbId,
      price: Number(item.price),
      rating: Number(item.rating || 5.0),
      reviewCount: item.reviewCount || 12,
      prepTime: item.prepTime || '15 mins',
      calories: item.calories || '500 kcal',
      image: item.image,
      description: item.description,
      isChefPick: Boolean(item.isChefPick || item.is_chef_pick),
      isVegetarian: Boolean(item.isVegetarian || item.is_vegetarian),
      isSpicy: Boolean(item.isSpicy || item.is_spicy),
      inStock: item.isAvailable !== undefined ? Boolean(item.isAvailable) : (item.inStock !== false),
      stockCount: item.stockCount || 15,
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      addOns: []
    }));
  } catch (err) {
    console.warn('Backend getMenuItems failed:', err.message);
    return null;
  }
}

export async function createMenuItem(item) {
  try {
    const res = await api.post('/menu', item);
    return res.data;
  } catch (err) {
    console.warn('Backend createMenuItem failed:', err.message);
    return null;
  }
}

export async function updateMenuItem(id, updates) {
  try {
    await api.put(`/menu/${id}`, updates);
    return true;
  } catch (err) {
    console.warn('Backend updateMenuItem failed:', err.message);
    return false;
  }
}

export async function toggleMenuItemStock(id) {
  try {
    const res = await api.patch(`/menu/${id}/toggle`);
    return res.data;
  } catch (err) {
    console.warn('Backend toggleMenuItemStock failed:', err.message);
    return null;
  }
}

export async function deleteMenuItem(id) {
  try {
    await api.delete(`/menu/${id}`);
    return true;
  } catch (err) {
    console.warn('Backend deleteMenuItem failed:', err.message);
    return false;
  }
}

/* ==========================================================================
   3. ORDERS API
   ========================================================================== */
export async function getOrders() {
  try {
    const res = await api.get('/orders');
    return (res.data || []).map(o => {
      let normStatus = o.status || 'pending';
      if (normStatus === 'preparing') normStatus = 'cooking';
      if (normStatus === 'completed' || normStatus === 'delivered') normStatus = 'served';

      return {
        id: o.orderCode || o.id,
        dbId: o.dbId || o.id,
        customerName: o.customerName || o.customer_name || 'Guest',
        phone: o.customerPhone || o.phone || '',
        address: o.deliveryAddress || o.address || '',
        diningMode: o.diningMode || (o.orderType === 'dine_in' ? 'dine-in' : o.orderType) || 'dine-in',
        tableNumber: o.tableNumber ? String(o.tableNumber).padStart(2, '0') : null,
        timestamp: o.createdAt || o.timestamp || new Date().toISOString(),
        status: normStatus,
        paymentMethod: o.paymentMethod || o.payment_method || 'cash',
        paymentStatus: o.paymentStatus || o.payment_status || 'unpaid',
        items: (o.items || []).map(it => ({
          id: it.id || it.menuItemId,
          name: it.name || 'Dish',
          price: Number(it.unitPrice || it.price || 0),
          quantity: Number(it.quantity || 1),
          image: it.image,
          spiceLevel: it.spiceLevel || 'Standard',
          addOns: it.addOns || []
        })),
        subtotal: Number(o.subtotal || o.totalAmount * 0.85 || 0),
        discount: Number(o.discount || 0),
        promoCode: o.promoCode || o.promo_code,
        tax: Number(o.tax || o.totalAmount * 0.10 || 0),
        serviceFee: Number(o.serviceFee || o.service_fee || o.totalAmount * 0.05 || 0),
        total: Number(o.total || o.totalAmount || 0),
        specialNotes: o.specialNotes || o.customerNotes || o.special_notes || ''
      };
    });
  } catch (err) {
    console.warn('Backend getOrders failed:', err.message);
    return null;
  }
}

export async function saveOrder(order) {
  try {
    const payload = {
      orderCode: order.id,
      orderId: order.id,
      id: order.id,
      orderType: order.diningMode === 'dine-in' ? 'dine_in' : (order.diningMode || 'dine_in'),
      diningMode: order.diningMode,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.phone,
      deliveryAddress: order.address,
      deliveryFee: order.deliveryFee || 0.0,
      customerNotes: order.specialNotes || '',
      specialNotes: order.specialNotes || '',
      paymentMethod: order.paymentMethod || 'cash',
      paymentStatus: order.paymentStatus || 'unpaid',
      voucherCode: order.promoCode || order.voucherCode || null,
      promoCode: order.promoCode || order.voucherCode || null,
      discountAmount: Number(order.discount || order.discountAmount || 0),
      subtotal: Number(order.subtotal || 0),
      tax: Number(order.tax || 0),
      serviceFee: Number(order.serviceFee || 0),
      totalAmount: Number(order.total || order.totalAmount || 0),
      items: (order.items || []).map(it => ({
        menuItemId: it.id || it.dishId,
        id: it.id || it.dishId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.price || it.unitPrice
      }))
    };
    const res = await api.post('/orders', payload);
    return res.data;
  } catch (err) {
    console.warn('Backend saveOrder failed:', err.message);
    return null;
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    let normStatus = status;
    if (status === 'preparing') normStatus = 'cooking';
    if (status === 'completed' || status === 'delivered') normStatus = 'served';
    await api.patch(`/orders/${orderId}/status`, { status: normStatus });
    return true;
  } catch (err) {
    console.warn('Backend updateOrderStatus failed:', err.message);
    return false;
  }
}

/* ==========================================================================
   4. VOUCHERS API
   ========================================================================== */
export async function getVouchers() {
  try {
    const res = await api.get('/vouchers');
    return res.data;
  } catch (err) {
    console.warn('Backend getVouchers failed:', err.message);
    return null;
  }
}

export async function verifyVoucher(code, subtotal = 0) {
  try {
    const res = await api.post('/vouchers/verify', { code, subtotal });
    return res.data;
  } catch (err) {
    console.warn('Backend verifyVoucher failed:', err.response?.data?.error || err.message);
    return { valid: false, error: err.response?.data?.error || err.message };
  }
}

export async function createVoucher(v) {
  try {
    const res = await api.post('/vouchers', v);
    return res.data;
  } catch (err) {
    console.warn('Backend createVoucher failed:', err.message);
    return null;
  }
}

export async function updateVoucher(id, updates) {
  try {
    const res = await api.put(`/vouchers/${id}`, updates);
    return res.data;
  } catch (err) {
    console.warn('Backend updateVoucher failed:', err.message);
    return null;
  }
}

export async function deleteVoucher(id) {
  try {
    await api.delete(`/vouchers/${id}`);
    return true;
  } catch (err) {
    console.warn('Backend deleteVoucher failed:', err.message);
    return false;
  }
}

/* ==========================================================================
   5. STAFF & HR API
   ========================================================================== */
export async function getStaffUsers() {
  try {
    const res = await api.get('/staff');
    return res.data;
  } catch (err) {
    console.warn('Backend getStaffUsers failed:', err.message);
    return null;
  }
}

export async function createStaffUser(user) {
  try {
    const res = await api.post('/staff', user);
    return res.data;
  } catch (err) {
    console.warn('Backend createStaffUser failed:', err.message);
    return null;
  }
}

export async function updateStaffUser(id, updates) {
  try {
    const res = await api.put(`/staff/${id}`, updates);
    return res.data;
  } catch (err) {
    console.warn('Backend updateStaffUser failed:', err.message);
    return null;
  }
}

export async function deleteStaffUser(id) {
  try {
    await api.delete(`/staff/${id}`);
    return true;
  } catch (err) {
    console.warn('Backend deleteStaffUser failed:', err.message);
    return false;
  }
}

/* ==========================================================================
   6. RESTAURANT TABLES API
   ========================================================================== */
export async function getTables() {
  try {
    const res = await api.get('/tables');
    return res.data;
  } catch (err) {
    console.warn('Backend getTables failed:', err.message);
    return null;
  }
}

export async function updateTableStatus(id, status) {
  try {
    const res = await api.patch(`/tables/${id}/status`, { status });
    return res.data;
  } catch (err) {
    console.warn('Backend updateTableStatus failed:', err.message);
    return null;
  }
}

export default api;
