import React, { createContext, useContext, useState, useEffect } from 'react';
import { PROMO_CODES } from '../data/mockData';

const CartContext = createContext();

const STORAGE_KEY = 'aura_bistro_cart';

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

  const [diningMode, setDiningMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).diningMode || 'dine-in';
    } catch (e) {}
    return 'dine-in';
  });

  const [tableNumber, setTableNumber] = useState(() => {
    try {
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
    tableNumber
  };

  return (
    <CartContext.Provider
      value={{
        items,
        diningMode,
        setDiningMode,
        tableNumber,
        setTableNumber,
        promoCode,
        discountPercent,
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
