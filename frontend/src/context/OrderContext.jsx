import React, { createContext, useContext, useState, useEffect } from 'react';
import { SEED_ORDERS, MENU_ITEMS } from '../data/mockData';
import { playAudioAlert } from '../utils/audio';
import {
  supabase,
  getOrders,
  saveOrder,
  updateOrderStatus as updateOrderStatusInSupabase
} from '../services/supabaseClient';

const OrderContext = createContext();

const STORAGE_KEY = 'aura_bistro_orders';
const SERVICE_REQUESTS_KEY = 'aura_bistro_service_requests';

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

  const [serviceRequests, setServiceRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(SERVICE_REQUESTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Unable to load service requests', e);
    }
    return [
      {
        id: 'SR-101',
        tableNumber: '04',
        serviceType: 'water',
        label: 'Refill Water & Ice',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3 * 60000).toISOString()
      }
    ];
  });

  const [activeOrderId, setActiveOrderId] = useState(() => {
    return orders.length > 0 ? orders[0].id : null;
  });

  // Fetch live orders from Backend & poll for real-time live sync
  useEffect(() => {
    let isMounted = true;

    async function loadOrdersFromBackend() {
      try {
        const remoteOrders = await getOrders();
        if (isMounted && remoteOrders && Array.isArray(remoteOrders) && remoteOrders.length > 0) {
          setOrders(remoteOrders);
          setActiveOrderId(prev => {
            if (!prev && remoteOrders.length > 0) return remoteOrders[0].id;
            return prev;
          });
        }
      } catch (err) {
        console.warn('Failed to load orders from backend, using local fallback:', err);
      }
    }

    loadOrdersFromBackend();

    // Auto poll every 3.5 seconds to sync KDS & Customer in real-time
    const pollInterval = setInterval(loadOrdersFromBackend, 3500);

    // Cross-tab and same-tab instant synchronization
    const handleSync = (e) => {
      if (!e.key || e.key === 'aura_bistro_order_sync') {
        loadOrdersFromBackend();
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('bistro_order_updated', handleSync);

    // Subscribe to realtime order notifications from Supabase if connected
    const channel = supabase
      .channel('schema-db-changes-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadOrdersFromBackend();
            playAudioAlert('order-placed');
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(ord =>
                ord.id === payload.new.id
                  ? { ...ord, status: payload.new.status }
                  : ord
              )
            );
            if (payload.new.status === 'ready') {
              playAudioAlert('order-ready');
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(ord => ord.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('bistro_order_updated', handleSync);
      supabase.removeChannel(channel);
    };
  }, []);

  // Save to localStorage as backup cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  // Sync service requests to localStorage & notify other tabs
  useEffect(() => {
    try {
      localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(serviceRequests));
    } catch (e) {
      console.error('Failed to save service requests', e);
    }
  }, [serviceRequests]);

  useEffect(() => {
    const handleServiceSync = (e) => {
      if (!e.key || e.key === SERVICE_REQUESTS_KEY || e.key === 'aura_bistro_service_sync') {
        try {
          const saved = localStorage.getItem(SERVICE_REQUESTS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setServiceRequests(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleServiceSync);
    window.addEventListener('bistro_service_updated', handleServiceSync);
    return () => {
      window.removeEventListener('storage', handleServiceSync);
      window.removeEventListener('bistro_service_updated', handleServiceSync);
    };
  }, []);

  const requestService = ({ tableNumber = '01', serviceType = 'waiter', customMessage = '' }) => {
    const typeCatalog = {
      waiter: { label: 'Call Server', icon: 'fa-solid fa-bell' },
      water: { label: 'Refill Water & Ice', icon: 'fa-solid fa-glass-water' },
      bill: { label: 'Request Final Bill', icon: 'fa-solid fa-receipt' },
      clean: { label: 'Clear & Clean Table', icon: 'fa-solid fa-broom' }
    };

    const meta = typeCatalog[serviceType] || typeCatalog.waiter;
    const newRequest = {
      id: `SR-${Math.floor(100 + Math.random() * 900)}`,
      tableNumber: String(tableNumber).padStart(2, '0'),
      serviceType,
      label: meta.label,
      icon: meta.icon,
      note: customMessage,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    setServiceRequests(prev => {
      const updated = [newRequest, ...prev.filter(r => !(r.tableNumber === newRequest.tableNumber && r.serviceType === serviceType && r.status === 'pending'))];
      try {
        localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(updated));
        localStorage.setItem('aura_bistro_service_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('bistro_service_updated'));
      } catch (e) {}
      return updated;
    });

    playAudioAlert('bell-chime');
    return newRequest;
  };

  const resolveServiceRequest = (requestId) => {
    setServiceRequests(prev => {
      const updated = prev.map(r => (r.id === requestId ? { ...r, status: 'resolved', resolvedAt: new Date().toISOString() } : r));
      try {
        localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(updated));
        localStorage.setItem('aura_bistro_service_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('bistro_service_updated'));
      } catch (e) {}
      return updated;
    });
    playAudioAlert('click');
  };

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
    paymentStatus,
    transactionHash,
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
      paymentStatus: paymentStatus || (paymentMethod === 'cash' ? 'Pay at Counter' : 'Paid'),
      transactionHash: transactionHash || null,
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

    // Notify other tabs immediately
    try {
      localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bistro_order_updated'));
    } catch (e) {}

    // Async persist to Backend
    saveOrder(newOrder).then(() => {
      try {
        localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('bistro_order_updated'));
      } catch (e) {}
    }).catch(err => {
      console.warn('Could not persist order:', err);
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    let normStatus = newStatus;
    if (newStatus === 'preparing') normStatus = 'cooking';
    if (newStatus === 'completed' || newStatus === 'delivered') normStatus = 'served';

    setOrders(prev =>
      prev.map(order => {
        if (order.id === orderId || order.orderCode === orderId) {
          return { ...order, status: normStatus };
        }
        return order;
      })
    );

    if (normStatus === 'ready') {
      playAudioAlert('order-ready');
    } else {
      playAudioAlert('click');
    }

    try {
      localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bistro_order_updated'));
    } catch (e) {}

    // Async persist to Backend
    updateOrderStatusInSupabase(orderId, normStatus).then(() => {
      try {
        localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('bistro_order_updated'));
      } catch (e) {}
    }).catch(err => {
      console.warn('Could not update order status in backend:', err);
    });
  };

  const simulateDemoOrder = () => {
    const sampleNames = ['Kosal Vichea', 'Leakhena Kim', 'Piseth Seng', 'Bopha Chea', 'Sovann Sok'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomTable = String(Math.floor(1 + Math.random() * 8)).padStart(2, '0');
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
      paymentStatus: 'Paid',
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

    try {
      localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
      window.dispatchEvent(new CustomEvent('bistro_order_updated'));
    } catch (e) {}

    // Async persist to Backend
    saveOrder(simulatedOrder).then(() => {
      try {
        localStorage.setItem('aura_bistro_order_sync', Date.now().toString());
        window.dispatchEvent(new CustomEvent('bistro_order_updated'));
      } catch (e) {}
    }).catch(err => {
      console.warn('Could not persist simulated order:', err);
    });

    return simulatedOrder;
  };

  // Computations with normalized 4 stages: pending -> cooking -> ready -> served
  const activeOrders = orders.filter(o => ['pending', 'cooking', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['served', 'completed', 'delivered', 'cancelled'].includes(o.status));
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const cookingOrders = activeOrders.filter(o => ['cooking', 'preparing'].includes(o.status));
  const readyOrders = activeOrders.filter(o => o.status === 'ready');
  const activeServiceRequests = serviceRequests.filter(r => r.status === 'pending');

  const todayRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const kdsStats = {
    totalActive: activeOrders.length,
    pending: pendingOrders.length,
    cooking: cookingOrders.length,
    ready: readyOrders.length,
    totalRevenue: todayRevenue,
    activeServiceCalls: activeServiceRequests.length
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
        simulateDemoOrder,
        serviceRequests,
        activeServiceRequests,
        requestService,
        resolveServiceRequest
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
