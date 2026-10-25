import React, { createContext, useContext, useState, useEffect } from 'react';
import { SEED_ORDERS, MENU_ITEMS } from '../data/mockData';
import { playAudioAlert } from '../utils/audio';

const OrderContext = createContext();

const STORAGE_KEY = 'aura_bistro_orders';

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Unable to load orders from localStorage', e);
    }
    return [...SEED_ORDERS];
  });

  const [activeOrderId, setActiveOrderId] = useState(() => {
    return orders.length > 0 ? orders[0].id : null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  const generateOrderId = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${num}`;
  };

  const createOrder = ({
    customerName,
    phone,
    address,
    diningMode,
    tableNumber,
    paymentMethod,
    specialNotes,
    cartSummary,
    cartItems
  }) => {
    const newOrder = {
      id: generateOrderId(),
      customerName: customerName || 'Valued Guest',
      phone: phone || 'N/A',
      address: address || '',
      diningMode: diningMode || 'dine-in',
      tableNumber: diningMode === 'dine-in' ? (tableNumber || '04') : null,
      paymentMethod: paymentMethod || 'khqr',
      paymentStatus: paymentMethod === 'cash' ? 'Pay at Counter' : 'Paid Online',
      status: 'pending',
      specialNotes: specialNotes || '',
      timestamp: new Date().toISOString(),
      items: cartItems.map(item => ({
        id: item.dishId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        spiceLevel: item.spiceLevel,
        addOns: item.addOns.map(a => a.name),
        note: item.note
      })),
      subtotal: cartSummary.subtotal,
      discount: cartSummary.discountAmount,
      promoCode: cartSummary.promoCode,
      tax: cartSummary.tax,
      serviceFee: cartSummary.serviceFee,
      total: cartSummary.total
    };

    setOrders(prev => [newOrder, ...prev]);
    setActiveOrderId(newOrder.id);
    playAudioAlert('order-placed');
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      })
    );

    if (newStatus === 'ready') {
      playAudioAlert('order-ready');
    } else {
      playAudioAlert('click');
    }
  };

  const simulateDemoOrder = () => {
    const sampleNames = ['Kosal Vichea', 'Leakhena Kim', 'Piseth Seng', 'Bopha Chea', 'Sovann Sok'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomTable = String(Math.floor(1 + Math.random() * 5)).padStart(2, '0');
    const randomDish1 = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
    const randomDish2 = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];

    const subtotal = Number(randomDish1.price) + Number(randomDish2.price);
    const tax = subtotal * 0.10;
    const service = subtotal * 0.05;
    const total = subtotal + tax + service;

    const simulatedOrder = {
      id: generateOrderId(),
      customerName: randomName,
      phone: `01${Math.floor(1 + Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
      diningMode: Math.random() > 0.3 ? 'dine-in' : 'takeout',
      tableNumber: randomTable,
      address: '',
      paymentMethod: 'khqr',
      paymentStatus: 'Paid Online',
      status: 'pending',
      specialNotes: 'Simulated customer live order.',
      timestamp: new Date().toISOString(),
      items: [
        { id: randomDish1.id, name: randomDish1.name, price: Number(randomDish1.price), quantity: 1, spiceLevel: 'Standard', addOns: [] },
        { id: randomDish2.id, name: randomDish2.name, price: Number(randomDish2.price), quantity: 1, spiceLevel: 'Standard', addOns: [] }
      ],
      subtotal,
      discount: 0,
      promoCode: null,
      tax,
      serviceFee: service,
      total
    };

    setOrders(prev => [simulatedOrder, ...prev]);
    playAudioAlert('order-placed');
    return simulatedOrder;
  };

  // Computations
  const activeOrders = orders.filter(o => ['pending', 'cooking', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['served', 'cancelled'].includes(o.status));
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const cookingOrders = activeOrders.filter(o => o.status === 'cooking');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');

  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const kdsStats = {
    totalActive: activeOrders.length,
    pending: pendingOrders.length,
    cooking: cookingOrders.length,
    ready: readyOrders.length,
    totalRevenue: todayRevenue
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrders,
        completedOrders,
        activeOrderId,
        setActiveOrderId,
        kdsStats,
        createOrder,
        updateOrderStatus,
        simulateDemoOrder
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
