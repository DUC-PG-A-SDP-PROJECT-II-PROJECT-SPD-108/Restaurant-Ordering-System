/**
 * AURA BISTRO - ORDERS & KITCHEN DISPLAY SYSTEM (KDS) MANAGER
 * Manages order lifecycle, status state transitions, audio feedback, and order tracking.
 */

class OrderManager {
  constructor() {
    this.storageKey = 'aura_bistro_orders';
    this.orders = this.loadOrders();
    this.listeners = [];
  }

  // Load orders from localStorage or initialize with seed data
  loadOrders() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Unable to load orders from localStorage', e);
    }

    // Default to seed orders for rich first-impression experience
    const initialOrders = typeof SEED_ORDERS !== 'undefined' ? [...SEED_ORDERS] : [];
    this.saveOrders(initialOrders);
    return initialOrders;
  }

  saveOrders(ordersList = this.orders) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(ordersList));
    } catch (e) {
      console.error('Unable to save orders to localStorage', e);
    }
    this.notify();
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify() {
    this.listeners.forEach(cb => cb(this.orders));
  }

  // Generate human-friendly order code
  generateOrderId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${num}`;
  }

  /**
   * Create and record a new order
   */
  createOrder({ customerName, phone, address, diningMode, tableNumber, paymentMethod, specialNotes, cartSummary, cartItems }) {
    const newOrder = {
      id: this.generateOrderId(),
      customerName: customerName || 'Valued Guest',
      phone: phone || 'N/A',
      address: address || '',
      diningMode: diningMode || 'dine-in',
      tableNumber: diningMode === 'dine-in' ? (tableNumber || '04') : null,
      paymentMethod: paymentMethod || 'khqr',
      paymentStatus: paymentMethod === 'cash' ? 'Pay at Counter' : 'Paid Online',
      status: 'pending', // 'pending' | 'cooking' | 'ready' | 'served' | 'cancelled'
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

    // Prepend to top of orders list
    this.orders.unshift(newOrder);
    this.saveOrders();

    // Play pleasant order placed chime
    this.playAudioAlert('order-placed');

    return newOrder;
  }

  // Update order status from KDS or simulation
  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = newStatus;
    if (newStatus === 'ready') {
      this.playAudioAlert('order-ready');
    } else {
      this.playAudioAlert('click');
    }

    this.saveOrders();
    return true;
  }

  // Retrieve an individual order by ID
  getOrderById(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  // Retrieve active orders (pending, cooking, ready)
  getActiveOrders() {
    return this.orders.filter(o => ['pending', 'cooking', 'ready'].includes(o.status));
  }

  // Retrieve completed orders
  getCompletedOrders() {
    return this.orders.filter(o => ['served', 'cancelled'].includes(o.status));
  }

  // Calculate kitchen stats
  getKDSStats() {
    const active = this.getActiveOrders();
    const pending = active.filter(o => o.status === 'pending').length;
    const cooking = active.filter(o => o.status === 'cooking').length;
    const ready = active.filter(o => o.status === 'ready').length;
    
    const todayTotalRevenue = this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      totalActive: active.length,
      pending,
      cooking,
      ready,
      totalRevenue: todayTotalRevenue
    };
  }

  // Web Audio API Synthesizer for subtle modern sound effects (no external files needed)
  playAudioAlert(type = 'click') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'order-placed') {
        // Joyful dual chime (major triad)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      } else if (type === 'order-ready') {
        // High alert ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        // Soft button tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      // Audio playback fails silently if browser blocks before user gesture
    }
  }
}

// Global order manager instance
const orderManager = new OrderManager();
