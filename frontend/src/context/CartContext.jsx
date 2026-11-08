import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROMO_CODES } from '../data/mockData';
import { getVouchers } from '../services/supabaseClient';

const CartContext = createContext();

const STORAGE_KEY = 'aura_bistro_cart';
const VOUCHERS_STORAGE_KEY = 'aura_bistro_vouchers';

const DEFAULT_VOUCHERS = [
  { id: 1, code: 'AURAVIP15', discountPercent: 15, description: '15% Off VIP Dining Special', isActive: true, isFeatured: true },
  { id: 2, code: 'WELCOME10', discountPercent: 10, description: '10% Off First-Time Guest', isActive: true, isFeatured: false },
  { id: 3, code: 'CHEF25', discountPercent: 25, description: '25% Off Chef Masterclass Promo', isActive: true, isFeatured: false },
  { id: 4, code: 'BISTRO20', discountPercent: 20, description: '20% Weekend Celebration Discount', isActive: true, isFeatured: false }
];

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.items || [];
      }
    } catch (e) {
      console.warn('Unable to load cart from localStorage', e);
    }
    return [];
  });

  const [isQrScanned, setIsQrScanned] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        return Boolean(urlParams.get('table'));
      }
    } catch (e) {}
    return false;
  });

  const [diningMode, setDiningMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('table')) return 'dine-in';
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).diningMode || 'dine-in';
    } catch (e) {}
    return 'dine-in';
  });

  const [tableNumber, setTableNumber] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTable = urlParams.get('table');
        if (urlTable) return urlTable.padStart(2, '0');
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).tableNumber || '04';
    } catch (e) {}
    return '04';
  });

  const [promoCode, setPromoCode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).promoCode || null;
    } catch (e) {}
    return null;
  });

  const [discountPercent, setDiscountPercent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).discountPercent || 0;
    } catch (e) {}
    return 0;
  });

  const [vouchers, setVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem(VOUCHERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Unable to load cached vouchers:', e);
    }
    return DEFAULT_VOUCHERS;
  });

  // Sync vouchers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
    } catch (e) {}
  }, [vouchers]);

  // Intra-tab and cross-tab listener for voucher updates from Admin
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(VOUCHERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setVouchers(parsed);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('aura_vouchers_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('aura_vouchers_updated', handleSync);
    };
  }, []);

  // Load live vouchers from Supabase with polling
  useEffect(() => {
    let isMounted = true;
    async function fetchVouchers() {
      try {
        const data = await getVouchers();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setVouchers(prev => {
            // Merge with local featured flags if any
            return data.map(rem => {
              const localMatch = prev.find(p => p.id === rem.id || p.code === rem.code);
              return {
                ...rem,
                isFeatured: rem.isFeatured !== undefined ? rem.isFeatured : (localMatch ? localMatch.isFeatured : rem.code === 'AURAVIP15')
              };
            });
          });
        }
      } catch (err) {
        console.warn('Unable to load live vouchers:', err);
      }
    }

    fetchVouchers();
    const interval = setInterval(fetchVouchers, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items,
        diningMode,
        tableNumber,
        promoCode,
        discountPercent
      }));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items, diningMode, tableNumber, promoCode, discountPercent]);

  const generateItemKey = (dishId, spiceLevel, addOns) => {
    const sortedAddons = (addOns || []).map(a => a.name).sort().join('|');
    return `${dishId}_${spiceLevel || 'standard'}_${sortedAddons}`;
  };

  const addItem = (dish, quantity = 1, spiceLevel = '', addOns = [], note = '') => {
    const itemKey = generateItemKey(dish.id, spiceLevel, addOns);
    const addOnsTotal = (addOns || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const unitPrice = Number(dish.price) + addOnsTotal;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.itemKey === itemKey);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            itemKey,
            dishId: dish.id,
            name: dish.name,
            category: dish.category,
            image: dish.image,
            basePrice: Number(dish.price),
            unitPrice,
            quantity,
            spiceLevel: spiceLevel || (dish.spiceLevels ? dish.spiceLevels[0] : 'Standard'),
            addOns: addOns || [],
            note: note || ''
          }
        ];
      }
    });
  };

  const updateQuantity = (itemKey, delta) => {
    setItems(prevItems => {
      return prevItems
        .map(item => {
          if (item.itemKey === itemKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeItem = (itemKey) => {
    setItems(prevItems => prevItems.filter(i => i.itemKey !== itemKey));
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyPromoCode = (code) => {
    const formatted = (code || '').trim().toUpperCase();
    if (!formatted) {
      return { success: false, message: 'Please enter a voucher code.' };
    }

    // 1. Check live vouchers from Supabase
    const matchedVoucher = vouchers.find(v => (v.code || '').toUpperCase() === formatted);
    if (matchedVoucher) {
      if (!matchedVoucher.isActive) {
        return { success: false, message: `Promo code "${formatted}" is currently inactive or disabled.` };
      }
      const disc = matchedVoucher.discountPercent;
      setPromoCode(formatted);
      setDiscountPercent(disc);
      return {
        success: true,
        discountPercent: disc,
        message: `Voucher "${formatted}" applied! (${disc}% OFF)`
      };
    }

    // 2. Fallback to mock promo codes
    if (PROMO_CODES[formatted]) {
      const disc = PROMO_CODES[formatted].discountPercent;
      setPromoCode(formatted);
      setDiscountPercent(disc);
      return {
        success: true,
        discountPercent: disc,
        message: `Voucher "${formatted}" applied! (${disc}% OFF)`
      };
    }

    return { success: false, message: 'Invalid or expired promotional code.' };
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setDiscountPercent(0);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * 0.10;
  const serviceFee = discountedSubtotal > 0 ? discountedSubtotal * 0.05 : 0;
  const total = discountedSubtotal + tax + serviceFee;

  const activeVouchers = vouchers.filter(v => v.isActive);
  const featuredVoucher =
    activeVouchers.find(v => v.isFeatured) ||
    (activeVouchers.length > 0 ? activeVouchers[0] : null);

  const summary = {
    itemCount,
    subtotal,
    discountPercent,
    discountAmount,
    promoCode,
    tax,
    serviceFee,
    total,
    diningMode,
    tableNumber,
    isQrScanned
  };

  return (
    <CartContext.Provider
      value={{
        items,
        diningMode,
        setDiningMode,
        tableNumber,
        setTableNumber,
        isQrScanned,
        promoCode,
        discountPercent,
        vouchers,
        setVouchers,
        featuredVoucher,
        summary,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyPromoCode,
        removePromoCode
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
