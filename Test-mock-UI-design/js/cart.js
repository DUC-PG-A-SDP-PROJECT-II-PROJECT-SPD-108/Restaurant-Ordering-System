/**
 * AURA BISTRO - SHOPPING CART CONTROLLER
 * Manages cart state, item customization permutations, tax, vouchers, and local persistence.
 */

class CartController {
  constructor() {
    this.storageKey = 'aura_bistro_cart';
    this.state = this.loadCartState();
    this.listeners = [];
  }

  // Load persisted cart from localStorage or defaults
  loadCartState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Unable to read cart from localStorage, using fresh state', e);
    }

    return {
      items: [],
      diningMode: 'dine-in', // 'dine-in' or 'takeout'
      tableNumber: '04',
      promoCode: null,
      discountPercent: 0
    };
  }

  // Save current cart state to localStorage
  saveCartState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Unable to save cart to localStorage', e);
    }
    this.notify();
  }

  // Subscribe UI components to cart updates
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  // Broadcast state change to listeners
  notify() {
    const summary = this.getSummary();
    this.listeners.forEach(cb => cb(this.state, summary));
  }

  // Generate unique item fingerprint based on customizations
  generateItemKey(dishId, spiceLevel, addOns) {
    const sortedAddons = (addOns || []).map(a => a.name).sort().join('|');
    return `${dishId}_${spiceLevel || 'standard'}_${sortedAddons}`;
  }

  /**
   * Add an item to the cart
   * @param {Object} dish - Dish object from MENU_ITEMS
   * @param {number} quantity - Number of portions
   * @param {string} spiceLevel - Selected spice/seasoning option
   * @param {Array} addOns - Selected add-on objects {name, price}
   * @param {string} note - Specific kitchen request for this dish
   */
  addItem(dish, quantity = 1, spiceLevel = '', addOns = [], note = '') {
    const itemKey = this.generateItemKey(dish.id, spiceLevel, addOns);
    const existingIndex = this.state.items.findIndex(i => i.itemKey === itemKey);

    // Calculate item unit price including add-ons
    const addOnsTotal = (addOns || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const unitPrice = Number(dish.price) + addOnsTotal;

    if (existingIndex > -1) {
      this.state.items[existingIndex].quantity += quantity;
    } else {
      this.state.items.push({
        itemKey,
        dishId: dish.id,
        name: dish.name,
        category: dish.category,
        image: dish.image,
        basePrice: Number(dish.price),
        unitPrice: unitPrice,
        quantity: quantity,
        spiceLevel: spiceLevel || (dish.spiceLevels ? dish.spiceLevels[0] : 'Standard'),
        addOns: addOns || [],
        note: note || ''
      });
    }

    this.saveCartState();
  }

  // Adjust item quantity
  updateQuantity(itemKey, delta) {
    const itemIndex = this.state.items.findIndex(i => i.itemKey === itemKey);
    if (itemIndex === -1) return;

    this.state.items[itemIndex].quantity += delta;

    if (this.state.items[itemIndex].quantity <= 0) {
      this.state.items.splice(itemIndex, 1);
    }

    this.saveCartState();
  }

  // Remove specific item configuration
  removeItem(itemKey) {
    this.state.items = this.state.items.filter(i => i.itemKey !== itemKey);
    this.saveCartState();
  }

  // Clear all items in cart
  clearCart() {
    this.state.items = [];
    this.saveCartState();
  }

  // Set dining mode
  setDiningMode(mode) {
    this.state.diningMode = mode;
    this.saveCartState();
  }

  // Set table number
  setTableNumber(tableNum) {
    this.state.tableNumber = tableNum;
    this.saveCartState();
  }

  // Apply promo coupon
  applyPromoCode(code) {
    const formatted = (code || '').trim().toUpperCase();
    if (!formatted) {
      return { success: false, message: 'Please enter a voucher code.' };
    }

    if (PROMO_CODES[formatted]) {
      this.state.promoCode = formatted;
      this.state.discountPercent = PROMO_CODES[formatted].discountPercent;
      this.saveCartState();
      return {
        success: true,
        discountPercent: this.state.discountPercent,
        message: `Voucher "${formatted}" applied! (${this.state.discountPercent}% OFF)`
      };
    }

    return { success: false, message: 'Invalid or expired promotional code.' };
  }

  // Remove applied promo code
  removePromoCode() {
    this.state.promoCode = null;
    this.state.discountPercent = 0;
    this.saveCartState();
  }

  // Compute total financials
  getSummary() {
    const subtotal = this.state.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalCount = this.state.items.reduce((sum, item) => sum + item.quantity, 0);

    const discountAmount = subtotal * (this.state.discountPercent / 100);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // VAT 10% on discounted subtotal
    const tax = discountedSubtotal * 0.10;

    // Service Fee 5%
    const serviceFee = discountedSubtotal > 0 ? discountedSubtotal * 0.05 : 0;

    const total = discountedSubtotal + tax + serviceFee;

    return {
      itemCount: totalCount,
      subtotal: subtotal,
      discountPercent: this.state.discountPercent,
      discountAmount: discountAmount,
      promoCode: this.state.promoCode,
      tax: tax,
      serviceFee: serviceFee,
      total: total,
      diningMode: this.state.diningMode,
      tableNumber: this.state.tableNumber
    };
  }
}

// Global cart controller instance
const cartController = new CartController();
