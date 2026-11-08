import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://watdyzpxjlcmxdjiowih.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_iq8ZjOrUgAjVcfnyCHj7Fw_9Zkpf5nW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Fetch all categories from Supabase
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'fa-solid fa-utensils',
      count: Number(cat.count || 0),
      description: cat.description || '',
      displayOrder: cat.display_order || 0
    }));
  } catch (err) {
    console.warn('Supabase getCategories error:', err.message);
    return null;
  }
}

/**
 * Create new category in Supabase
 */
export async function createCategory(cat) {
  try {
    const payload = {
      id: cat.id,
      name: cat.name,
      icon: cat.icon || 'fa-solid fa-utensils',
      count: Number(cat.count || 0)
    };
    if (cat.description) payload.description = cat.description;
    if (cat.displayOrder !== undefined) payload.display_order = cat.displayOrder;

    const { data, error } = await supabase
      .from('categories')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase createCategory error:', err.message);
    return null;
  }
}

/**
 * Update existing category in Supabase
 */
export async function updateCategory(id, updates) {
  try {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.count !== undefined) payload.count = updates.count;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase updateCategory error:', err.message);
    return null;
  }
}

/**
 * Delete category from Supabase
 */
export async function deleteCategory(id) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteCategory error:', err.message);
    return false;
  }
}

/**
 * Fetch all menu items from Supabase
 */
export async function getMenuItems() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    // Normalize snake_case PostgreSQL columns to camelCase for React components
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      rating: Number(item.rating || 5.0),
      reviewCount: item.review_count || 0,
      prepTime: item.prep_time || '15 mins',
      calories: item.calories || '500 kcal',
      image: item.image,
      description: item.description,
      isChefPick: Boolean(item.is_chef_pick),
      isVegetarian: Boolean(item.is_vegetarian),
      isSpicy: Boolean(item.is_spicy),
      inStock: Boolean(item.in_stock),
      stockCount: item.stock_count || 15,
      spiceLevels: Array.isArray(item.spice_levels) ? item.spice_levels : ['Mild', 'Medium', 'Hot'],
      addOns: Array.isArray(item.add_ons) ? item.add_ons : []
    }));
  } catch (err) {
    console.warn('Supabase getMenuItems error:', err.message);
    return null;
  }
}

/**
 * Save new menu item to Supabase
 */
export async function createMenuItem(item) {
  try {
    const payload = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      rating: item.rating || 5.0,
      review_count: item.reviewCount || 1,
      prep_time: item.prepTime || '15 mins',
      calories: item.calories || '500 kcal',
      image: item.image,
      description: item.description,
      is_chef_pick: Boolean(item.isChefPick),
      is_vegetarian: Boolean(item.isVegetarian),
      is_spicy: Boolean(item.isSpicy),
      in_stock: item.inStock !== false,
      stock_count: item.stockCount || 15,
      spice_levels: item.spiceLevels || ['Mild', 'Medium', 'Hot'],
      add_ons: item.addOns || []
    };
    const { data, error } = await supabase.from('menu_items').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase createMenuItem error:', err.message);
    return null;
  }
}

/**
 * Update menu item in Supabase
 */
export async function updateMenuItem(id, updates) {
  try {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.prepTime !== undefined) payload.prep_time = updates.prepTime;
    if (updates.calories !== undefined) payload.calories = updates.calories;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.isChefPick !== undefined) payload.is_chef_pick = updates.isChefPick;
    if (updates.isVegetarian !== undefined) payload.is_vegetarian = updates.isVegetarian;
    if (updates.isSpicy !== undefined) payload.is_spicy = updates.isSpicy;
    if (updates.inStock !== undefined) payload.in_stock = updates.inStock;
    if (updates.stockCount !== undefined) payload.stock_count = updates.stockCount;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('menu_items').update(payload).eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase updateMenuItem error:', err.message);
    return false;
  }
}

/**
 * Delete menu item from Supabase
 */
export async function deleteMenuItem(id) {
  try {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteMenuItem error:', err.message);
    return false;
  }
}

/**
 * Fetch orders from Supabase
 */
export async function getOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(o => ({
      id: o.id,
      customerName: o.customer_name,
      phone: o.phone,
      address: o.address,
      diningMode: o.dining_mode,
      tableNumber: o.table_number,
      timestamp: o.timestamp,
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      items: Array.isArray(o.items) ? o.items : [],
      subtotal: Number(o.subtotal || 0),
      discount: Number(o.discount || 0),
      promoCode: o.promo_code,
      tax: Number(o.tax || 0),
      serviceFee: Number(o.service_fee || 0),
      total: Number(o.total || 0),
      specialNotes: o.special_notes
    }));
  } catch (err) {
    console.warn('Supabase getOrders error:', err.message);
    return null;
  }
}

/**
 * Insert order into Supabase
 */
export async function saveOrder(order) {
  try {
    const payload = {
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      dining_mode: order.diningMode,
      table_number: order.tableNumber,
      timestamp: order.timestamp,
      status: order.status || 'pending',
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      promo_code: order.promoCode,
      tax: order.tax,
      service_fee: order.serviceFee,
      total: order.total,
      special_notes: order.specialNotes
    };
    const { data, error } = await supabase.from('orders').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase saveOrder error:', err.message);
    return null;
  }
}

/**
 * Update order status in Supabase
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase updateOrderStatus error:', err.message);
    return false;
  }
}

/**
 * Fetch all discount vouchers from Supabase
 */
export async function getVouchers() {
  try {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(v => ({
      id: v.id,
      code: (v.code || '').toUpperCase(),
      discountPercent: Number(v.discount_percent || 0),
      description: v.description || '',
      isActive: v.is_active !== false,
      isFeatured: Boolean(v.is_featured),
      createdAt: v.created_at
    }));
  } catch (err) {
    console.warn('Supabase getVouchers error:', err.message);
    return null;
  }
}

/**
 * Create a new voucher in Supabase
 */
export async function createVoucher(v) {
  try {
    const payload = {
      code: (v.code || '').trim().toUpperCase(),
      discount_percent: Number(v.discountPercent || 0),
      description: v.description || '',
      is_active: v.isActive !== false,
      is_featured: Boolean(v.isFeatured)
    };
    const { data, error } = await supabase
      .from('vouchers')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      code: data.code,
      discountPercent: Number(data.discount_percent),
      description: data.description,
      isActive: data.is_active !== false,
      isFeatured: Boolean(data.is_featured),
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('Supabase createVoucher error:', err.message);
    return null;
  }
}

/**
 * Update existing voucher in Supabase
 */
export async function updateVoucher(id, updates) {
  try {
    const payload = {};
    if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();
    if (updates.discountPercent !== undefined) payload.discount_percent = Number(updates.discountPercent);
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;

    const { data, error } = await supabase
      .from('vouchers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      code: data.code,
      discountPercent: Number(data.discount_percent),
      description: data.description,
      isActive: data.is_active !== false,
      isFeatured: Boolean(data.is_featured),
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('Supabase updateVoucher error:', err.message);
    return null;
  }
}

/**
 * Delete a voucher from Supabase
 */
export async function deleteVoucher(id) {
  try {
    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteVoucher error:', err.message);
    return false;
  }
}

/**
 * Fetch all staff & user accounts from Supabase
 */
export async function getStaffUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase getStaffUsers error:', err.message);
    return null;
  }
}

/**
 * Create a new staff / user account in Supabase
 */
export async function createStaffUser(user) {
  try {
    const payload = {
      username: user.username,
      password: user.password || 'staff123',
      role: user.role || 'staff',
      name: user.name || user.username
    };
    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase createStaffUser error:', err.message);
    return null;
  }
}

/**
 * Update an existing staff / user account in Supabase
 */
export async function updateStaffUser(id, updates) {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Supabase updateStaffUser error:', err.message);
    return null;
  }
}

/**
 * Delete a staff user account from Supabase
 */
export async function deleteStaffUser(id) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteStaffUser error:', err.message);
    return false;
  }
}


