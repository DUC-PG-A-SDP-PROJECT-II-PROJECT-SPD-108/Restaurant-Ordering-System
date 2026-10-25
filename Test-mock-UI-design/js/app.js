/**
 * AURA BISTRO - APPLICATION CONTROLLER
 * Main UI event coordinator, modal controller, search/filter pipeline, and reactive renderer.
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. STATE & DOM REFERENCES
  // =========================================================================
  const state = {
    activeCategory: 'all',
    searchQuery: '',
    dietaryFilter: 'all', // 'all', 'vegetarian', 'spicy', 'chef'
    sortBy: 'featured',
    currentCustomizingDish: null,
    selectedTrackingOrderId: null,
    kdsFilterStatus: 'all'
  };

  // Nav Elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const navTabs = document.querySelectorAll('.nav-tab');
  const appViews = document.querySelectorAll('.app-view');
  const modeDineInBtn = document.getElementById('mode-dinein');
  const modeTakeoutBtn = document.getElementById('mode-takeout');
  const navCartCount = document.getElementById('nav-cart-count');
  const navCartTotal = document.getElementById('nav-cart-total');
  const activeOrdersCountBadge = document.getElementById('active-orders-count');
  const kitchenPendingCountBadge = document.getElementById('kitchen-pending-count');

  // Menu Elements
  const categoryPillsList = document.getElementById('category-pills-list');
  const dishesGrid = document.getElementById('dishes-grid-container');
  const menuEmptyState = document.getElementById('menu-empty-state');
  const menuSearchInput = document.getElementById('menu-search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const dietaryChips = document.querySelectorAll('.dietary-chip');
  const menuSortSelect = document.getElementById('menu-sort-select');
  const activeCategoryTitle = document.getElementById('active-category-title');
  const activeCategoryDesc = document.getElementById('active-category-desc');
  const itemsCountIndicator = document.getElementById('items-count-indicator');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const applyHeroVoucherBtn = document.getElementById('apply-hero-voucher-btn');
  const heroVoucherCode = document.getElementById('hero-voucher-code');

  // Cart Sidebar Elements
  const cartItemsContainer = document.getElementById('cart-items-container');
  const clearCartBtn = document.getElementById('clear-cart-btn');
  const tableSelectRow = document.getElementById('table-select-row');
  const tableNumberSelect = document.getElementById('table-number-select');
  const cartDiningModeText = document.getElementById('cart-dining-mode-text');
  const couponInput = document.getElementById('coupon-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponStatusMsg = document.getElementById('coupon-status-msg');
  const billSubtotal = document.getElementById('bill-subtotal');
  const billDiscountRow = document.getElementById('bill-discount-row');
  const billDiscount = document.getElementById('bill-discount');
  const discountPercentLabel = document.getElementById('discount-percent-label');
  const billTax = document.getElementById('bill-tax');
  const billService = document.getElementById('bill-service');
  const billTotal = document.getElementById('bill-total');
  const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');

  // Modals Elements
  const dishModal = document.getElementById('dish-modal');
  const dishModalContent = document.getElementById('dish-modal-content');
  const closeDishModalBtn = document.getElementById('close-dish-modal-btn');

  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutForm = document.getElementById('checkout-form');
  const closeCheckoutModalBtn = document.getElementById('close-checkout-modal-btn');
  const deliveryAddressGroup = document.getElementById('delivery-address-group');
  const modalCheckoutTotal = document.getElementById('modal-checkout-total');
  const modalCheckoutItemsCount = document.getElementById('modal-checkout-items-count');

  const receiptModal = document.getElementById('receipt-modal');
  const receiptPaperContent = document.getElementById('receipt-paper-content');
  const trackOrderModalBtn = document.getElementById('track-order-modal-btn');
  const printReceiptBtn = document.getElementById('print-receipt-btn');
  const closeReceiptBtn = document.getElementById('close-receipt-btn');

  // Live Tracker Elements
  const trackerOrdersContainer = document.getElementById('tracker-orders-container');
  const trackerPlaceholder = document.getElementById('tracker-placeholder');
  const trackerActiveContent = document.getElementById('tracker-active-content');
  const refreshTrackerBtn = document.getElementById('refresh-tracker-btn');
  const goToMenuBtn = document.getElementById('go-to-menu-btn');

  // KDS Elements
  const kdsOrdersGrid = document.getElementById('kds-orders-grid');
  const kdsTabBtns = document.querySelectorAll('.kds-tab-btn');
  const kdsSeedDemoBtn = document.getElementById('kds-seed-demo-btn');
  const kdsTotalOrders = document.getElementById('kds-total-orders');
  const kdsPrepOrders = document.getElementById('kds-prep-orders');
  const kdsReadyOrders = document.getElementById('kds-ready-orders');
  const kdsTotalRevenue = document.getElementById('kds-total-revenue');
  const kdsTabAllCount = document.getElementById('kds-tab-all-count');
  const kdsTabPendingCount = document.getElementById('kds-tab-pending-count');
  const kdsTabCookingCount = document.getElementById('kds-tab-cooking-count');
  const kdsTabReadyCount = document.getElementById('kds-tab-ready-count');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // =========================================================================
  // 2. THEME CONTROLLER
  // =========================================================================
  const initTheme = () => {
    const savedTheme = localStorage.getItem('aura_bistro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aura_bistro_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  };

  const updateThemeIcon = (theme) => {
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  };

  themeToggleBtn.addEventListener('click', toggleTheme);
  initTheme();

  // =========================================================================
  // 3. TOAST SYSTEM
  // =========================================================================
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  };

  // =========================================================================
  // 4. VIEW / TAB SWITCHER
  // =========================================================================
  const switchView = (targetViewId) => {
    appViews.forEach(view => {
      if (view.id === targetViewId) {
        view.style.display = 'block';
        view.classList.add('active-view');
      } else {
        view.style.display = 'none';
        view.classList.remove('active-view');
      }
    });

    navTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === targetViewId);
    });

    if (targetViewId === 'tracker-view') {
      renderTrackerView();
    } else if (targetViewId === 'kitchen-view') {
      renderKDSView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      orderManager.playAudioAlert('click');
      switchView(tab.dataset.view);
    });
  });

  goToMenuBtn.addEventListener('click', () => switchView('customer-view'));

  // =========================================================================
  // 5. DINING MODE (DINE-IN vs TAKEOUT)
  // =========================================================================
  const updateDiningModeUI = (mode) => {
    modeDineInBtn.classList.toggle('active', mode === 'dine-in');
    modeTakeoutBtn.classList.toggle('active', mode === 'takeout');
    cartDiningModeText.textContent = mode === 'dine-in' ? 'Dine-In' : 'Takeaway';

    if (mode === 'dine-in') {
      tableSelectRow.style.display = 'flex';
      deliveryAddressGroup.style.display = 'none';
      document.getElementById('hero-dining-label').innerHTML = `Dine-In Table: <strong>#${tableNumberSelect.value}</strong>`;
    } else {
      tableSelectRow.style.display = 'none';
      deliveryAddressGroup.style.display = 'flex';
      document.getElementById('hero-dining-label').innerHTML = `Service: <strong>Takeaway Counter</strong>`;
    }
  };

  modeDineInBtn.addEventListener('click', () => {
    cartController.setDiningMode('dine-in');
    updateDiningModeUI('dine-in');
    showToast('Dining mode set to Dine-In', 'info');
  });

  modeTakeoutBtn.addEventListener('click', () => {
    cartController.setDiningMode('takeout');
    updateDiningModeUI('takeout');
    showToast('Dining mode set to Takeaway', 'info');
  });

  tableNumberSelect.addEventListener('change', (e) => {
    cartController.setTableNumber(e.target.value);
    document.getElementById('hero-dining-label').innerHTML = `Dine-In Table: <strong>#${e.target.value}</strong>`;
    showToast(`Assigned to Table #${e.target.value}`, 'info');
  });

  // =========================================================================
  // 6. CATEGORIES & MENU RENDERING
  // =========================================================================
  const renderCategories = () => {
    categoryPillsList.innerHTML = MENU_CATEGORIES.map(cat => `
      <button class="cat-pill ${cat.id === state.activeCategory ? 'active' : ''}" data-category="${cat.id}">
        <i class="${cat.icon}"></i>
        <span>${cat.name}</span>
      </button>
    `).join('');

    categoryPillsList.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        renderCategories();
        filterAndRenderMenu();
        orderManager.playAudioAlert('click');
      });
    });
  };

  const getFilteredDishes = () => {
    return MENU_ITEMS.filter(dish => {
      // Category match
      const matchesCategory = state.activeCategory === 'all' || dish.category === state.activeCategory;

      // Search match
      const query = state.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        dish.name.toLowerCase().includes(query) || 
        dish.description.toLowerCase().includes(query) ||
        dish.category.toLowerCase().includes(query);

      // Dietary match
      let matchesDietary = true;
      if (state.dietaryFilter === 'vegetarian') matchesDietary = dish.isVegetarian;
      if (state.dietaryFilter === 'spicy') matchesDietary = dish.isSpicy;
      if (state.dietaryFilter === 'chef') matchesDietary = dish.isChefPick;

      return matchesCategory && matchesSearch && matchesDietary;
    }).sort((a, b) => {
      if (state.sortBy === 'price-low') return a.price - b.price;
      if (state.sortBy === 'price-high') return b.price - a.price;
      if (state.sortBy === 'rating') return b.rating - a.rating;
      return 0; // 'featured' keeps default catalog order
    });
  };

  const filterAndRenderMenu = () => {
    const dishes = getFilteredDishes();

    // Update Category Header Details
    const currentCatObj = MENU_CATEGORIES.find(c => c.id === state.activeCategory) || MENU_CATEGORIES[0];
    activeCategoryTitle.textContent = currentCatObj.name;
    itemsCountIndicator.textContent = `Showing ${dishes.length} item${dishes.length === 1 ? '' : 's'}`;

    if (dishes.length === 0) {
      dishesGrid.innerHTML = '';
      menuEmptyState.style.display = 'block';
      return;
    }

    menuEmptyState.style.display = 'none';
    dishesGrid.innerHTML = dishes.map(dish => `
      <div class="dish-card" data-dish-id="${dish.id}">
        <div class="dish-image-wrapper">
          <img src="${dish.image}" alt="${dish.name}" class="dish-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'">
          ${dish.isChefPick ? '<span class="dish-badge-pill hot"><i class="fa-solid fa-star"></i> Chef Pick</span>' : ''}
          ${dish.isVegetarian ? '<span class="dish-badge-pill veg"><i class="fa-solid fa-leaf"></i> Veg</span>' : ''}
          <div class="dish-rating-pill">
            <i class="fa-solid fa-star"></i>
            <span>${dish.rating.toFixed(1)}</span>
          </div>
        </div>

        <div class="dish-content">
          <div class="dish-header">
            <h3 class="dish-title">${dish.name}</h3>
            <span class="dish-price">$${dish.price.toFixed(2)}</span>
          </div>

          <p class="dish-desc">${dish.description}</p>

          <div class="dish-tags">
            <span class="dish-tag"><i class="fa-solid fa-clock"></i> ${dish.prepTime}</span>
            <span class="dish-tag"><i class="fa-solid fa-fire"></i> ${dish.calories}</span>
            ${dish.isSpicy ? '<span class="dish-tag text-danger"><i class="fa-solid fa-pepper-hot"></i> Spicy</span>' : ''}
          </div>

          <div class="dish-footer">
            <button class="btn-customize-link" data-customize-id="${dish.id}">
              <i class="fa-solid fa-sliders"></i> Customize
            </button>
            <button class="btn btn-add-cart" data-quick-add-id="${dish.id}">
              <i class="fa-solid fa-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach Event Listeners to rendered cards
    dishesGrid.querySelectorAll('[data-quick-add-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dishId = btn.dataset.quickAddId;
        const dish = MENU_ITEMS.find(d => d.id === dishId);
        if (dish) {
          cartController.addItem(dish, 1, dish.spiceLevels ? dish.spiceLevels[0] : 'Standard', []);
          showToast(`Added "${dish.name}" to cart!`, 'success');
        }
      });
    });

    dishesGrid.querySelectorAll('[data-customize-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dishId = btn.dataset.customizeId;
        openDishModal(dishId);
      });
    });
  };

  // Search & Filter Listeners
  menuSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    filterAndRenderMenu();
  });

  clearSearchBtn.addEventListener('click', () => {
    menuSearchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    filterAndRenderMenu();
  });

  dietaryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dietaryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.dietaryFilter = chip.dataset.filter;
      filterAndRenderMenu();
    });
  });

  menuSortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    filterAndRenderMenu();
  });

  resetFiltersBtn.addEventListener('click', () => {
    state.activeCategory = 'all';
    state.searchQuery = '';
    state.dietaryFilter = 'all';
    state.sortBy = 'featured';
    menuSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    menuSortSelect.value = 'featured';
    dietaryChips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
    renderCategories();
    filterAndRenderMenu();
  });

  // Hero voucher quick apply
  applyHeroVoucherBtn.addEventListener('click', () => {
    const result = cartController.applyPromoCode('AURAVIP15');
    couponInput.value = 'AURAVIP15';
    showToast(result.message, result.success ? 'success' : 'warning');
  });

  heroVoucherCode.addEventListener('click', () => {
    navigator.clipboard.writeText('AURAVIP15');
    showToast('Promo code AURAVIP15 copied to clipboard!', 'info');
  });

  // =========================================================================
  // 7. DISH CUSTOMIZATION MODAL
  // =========================================================================
  const openDishModal = (dishId) => {
    const dish = MENU_ITEMS.find(d => d.id === dishId);
    if (!dish) return;

    state.currentCustomizingDish = dish;

    const spiceOptionsHtml = (dish.spiceLevels || ['Standard']).map((spice, idx) => `
      <div class="spice-chip ${idx === 0 ? 'selected' : ''}" data-spice="${spice}">
        ${spice}
      </div>
    `).join('');

    const addOnsHtml = (dish.addOns || []).map(addon => `
      <label class="checkbox-option">
        <span>${addon.name}</span>
        <div>
          <strong class="text-accent">+$$${addon.price.toFixed(2)}</strong>
          <input type="checkbox" class="addon-checkbox" data-name="${addon.name}" data-price="${addon.price}" style="margin-left: 0.5rem;">
        </div>
      </label>
    `).join('');

    dishModalContent.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}" class="dish-modal-img">
      <div class="dish-modal-body-content">
        <h2 class="modal-dish-title">${dish.name}</h2>
        <div class="modal-dish-price" id="modal-live-price">$${dish.price.toFixed(2)}</div>
        <p class="modal-dish-desc">${dish.description}</p>

        <div class="custom-option-group">
          <div class="option-group-title"><i class="fa-solid fa-pepper-hot"></i> Spice &amp; Flavor Preference</div>
          <div class="spice-selector" id="modal-spice-selector">
            ${spiceOptionsHtml}
          </div>
        </div>

        ${dish.addOns && dish.addOns.length > 0 ? `
          <div class="custom-option-group">
            <div class="option-group-title"><i class="fa-solid fa-plus-circle"></i> Artisan Add-ons &amp; Upgrades</div>
            <div class="addons-list">
              ${addOnsHtml}
            </div>
          </div>
        ` : ''}

        <div class="custom-option-group">
          <div class="option-group-title"><i class="fa-solid fa-comment-dots"></i> Special Kitchen Request</div>
          <input type="text" id="modal-item-note" placeholder="e.g. dressing on the side, no onion" style="width:100%; background:var(--bg-subtle); padding:0.55rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); color:var(--text-main);">
        </div>

        <div style="display:flex; gap:1rem; align-items:center; margin-top:1.5rem;">
          <div class="cart-qty-controls" style="padding:4px 8px;">
            <button class="qty-btn" id="modal-qty-minus"><i class="fa-solid fa-minus"></i></button>
            <span class="qty-val" id="modal-qty-val" style="min-width:28px;">1</span>
            <button class="qty-btn" id="modal-qty-plus"><i class="fa-solid fa-plus"></i></button>
          </div>
          <button class="btn btn-primary btn-block" id="modal-add-to-cart-btn">
            <i class="fa-solid fa-cart-plus"></i> 
            <span>Add to Cart - <span id="modal-submit-price">$${dish.price.toFixed(2)}</span></span>
          </button>
        </div>
      </div>
    `;

    // Internal modal state
    let modalQty = 1;
    let selectedSpice = dish.spiceLevels ? dish.spiceLevels[0] : 'Standard';

    const updateModalCalculatedPrice = () => {
      const selectedAddons = Array.from(dishModalContent.querySelectorAll('.addon-checkbox:checked')).map(cb => ({
        name: cb.dataset.name,
        price: parseFloat(cb.dataset.price)
      }));

      const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
      const singlePrice = dish.price + addonsTotal;
      const finalPrice = singlePrice * modalQty;

      document.getElementById('modal-live-price').textContent = `$${singlePrice.toFixed(2)}`;
      document.getElementById('modal-submit-price').textContent = `$${finalPrice.toFixed(2)}`;
    };

    // Spice selection listener
    dishModalContent.querySelectorAll('.spice-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        dishModalContent.querySelectorAll('.spice-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedSpice = chip.dataset.spice;
      });
    });

    // Add-on checkboxes
    dishModalContent.querySelectorAll('.addon-checkbox').forEach(cb => {
      cb.addEventListener('change', updateModalCalculatedPrice);
    });

    // Qty minus / plus
    const qtyValEl = document.getElementById('modal-qty-val');
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
      if (modalQty > 1) {
        modalQty--;
        qtyValEl.textContent = modalQty;
        updateModalCalculatedPrice();
      }
    });

    document.getElementById('modal-qty-plus').addEventListener('click', () => {
      modalQty++;
      qtyValEl.textContent = modalQty;
      updateModalCalculatedPrice();
    });

    // Add to Cart Final Action
    document.getElementById('modal-add-to-cart-btn').addEventListener('click', () => {
      const selectedAddons = Array.from(dishModalContent.querySelectorAll('.addon-checkbox:checked')).map(cb => ({
        name: cb.dataset.name,
        price: parseFloat(cb.dataset.price)
      }));
      const note = document.getElementById('modal-item-note').value.trim();

      cartController.addItem(dish, modalQty, selectedSpice, selectedAddons, note);
      dishModal.style.display = 'none';
      showToast(`Added ${modalQty}x "${dish.name}" to order!`, 'success');
    });

    dishModal.style.display = 'flex';
  };

  closeDishModalBtn.addEventListener('click', () => {
    dishModal.style.display = 'none';
  });

  dishModal.addEventListener('click', (e) => {
    if (e.target === dishModal) dishModal.style.display = 'none';
  });

  // =========================================================================
  // 8. CART & BILL CONTROLLER (REACTIVE)
  // =========================================================================
  const renderCart = (cartState, summary) => {
    // 1. Update Header cart preview
    navCartCount.textContent = summary.itemCount;
    navCartTotal.textContent = `$${summary.total.toFixed(2)}`;

    // 2. Render Cart Item Rows
    if (cartState.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-view">
          <i class="fa-solid fa-basket-shopping"></i>
          <h4>Your cart is empty</h4>
          <p>Add mouthwatering dishes from our menu to start your order.</p>
        </div>
      `;
      proceedCheckoutBtn.disabled = true;
    } else {
      cartItemsContainer.innerHTML = cartState.items.map(item => `
        <div class="cart-item-row" data-key="${item.itemKey}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-customizations">
              <span>${item.spiceLevel}</span>
              ${item.addOns.length > 0 ? ` &bull; +${item.addOns.map(a => a.name).join(', ')}` : ''}
              ${item.note ? ` <br><em style="color:var(--warning)">Note: "${item.note}"</em>` : ''}
            </div>
            <div class="cart-item-price">$${(item.unitPrice * item.quantity).toFixed(2)}</div>
          </div>
          <div class="cart-qty-controls">
            <button class="qty-btn" data-qty-delta="-1" data-key="${item.itemKey}"><i class="fa-solid fa-minus"></i></button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" data-qty-delta="1" data-key="${item.itemKey}"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
      `).join('');

      proceedCheckoutBtn.disabled = false;

      // Attach qty buttons
      cartItemsContainer.querySelectorAll('[data-qty-delta]').forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = parseInt(btn.dataset.qtyDelta, 10);
          const key = btn.dataset.key;
          cartController.updateQuantity(key, delta);
        });
      });
    }

    // 3. Update Bill Breakdown
    billSubtotal.textContent = `$${summary.subtotal.toFixed(2)}`;

    if (summary.discountAmount > 0) {
      billDiscountRow.style.display = 'flex';
      discountPercentLabel.textContent = `${summary.discountPercent}%`;
      billDiscount.textContent = `-$${summary.discountAmount.toFixed(2)}`;
    } else {
      billDiscountRow.style.display = 'none';
    }

    billTax.textContent = `$${summary.tax.toFixed(2)}`;
    billService.textContent = `$${summary.serviceFee.toFixed(2)}`;
    billTotal.textContent = `$${summary.total.toFixed(2)}`;
  };

  // Subscribe cart changes
  cartController.subscribe(renderCart);

  // Clear Cart Action
  clearCartBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your current order?')) {
      cartController.clearCart();
      showToast('Order cart cleared', 'info');
    }
  });

  // Apply Coupon Action
  applyCouponBtn.addEventListener('click', () => {
    const code = couponInput.value.trim();
    const result = cartController.applyPromoCode(code);

    couponStatusMsg.style.display = 'block';
    couponStatusMsg.textContent = result.message;
    couponStatusMsg.className = `coupon-status ${result.success ? 'success' : 'error'}`;

    if (result.success) {
      showToast(result.message, 'success');
    }
  });

  // =========================================================================
  // 9. CHECKOUT & RECEIPT FLOW
  // =========================================================================
  proceedCheckoutBtn.addEventListener('click', () => {
    const summary = cartController.getSummary();
    if (summary.itemCount === 0) return;

    modalCheckoutTotal.textContent = `$${summary.total.toFixed(2)}`;
    modalCheckoutItemsCount.textContent = `${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'}`;
    checkoutModal.style.display = 'flex';
  });

  closeCheckoutModalBtn.addEventListener('click', () => {
    checkoutModal.style.display = 'none';
  });

  // Checkout Payment Method Radio styling
  const paymentCards = document.querySelectorAll('.payment-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Checkout Form Submission
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const customerName = document.getElementById('cust-name').value.trim();
    const customerPhone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const specialNotes = document.getElementById('order-special-notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    const summary = cartController.getSummary();
    const items = cartController.state.items;

    // Create Order via OrderManager
    const newOrder = orderManager.createOrder({
      customerName,
      phone: customerPhone,
      address,
      diningMode: cartController.state.diningMode,
      tableNumber: cartController.state.tableNumber,
      paymentMethod,
      specialNotes,
      cartSummary: summary,
      cartItems: items
    });

    // Reset and hide Checkout Modal
    checkoutForm.reset();
    checkoutModal.style.display = 'none';

    // Clear Cart
    cartController.clearCart();

    // Render & Open Receipt Modal
    openReceiptModal(newOrder);

    // Update active badges
    updateBadges();

    showToast(`Order ${newOrder.id} successfully placed!`, 'success');
  });

  const openReceiptModal = (order) => {
    receiptPaperContent.innerHTML = `
      <div style="text-align:center; margin-bottom:1rem; border-bottom:1px dashed var(--border-color); padding-bottom:0.75rem;">
        <h4 style="font-size:1.1rem; letter-spacing:1px;">AURA BISTRO &amp; LOUNGE</h4>
        <div style="font-size:0.75rem; color:var(--text-muted);">Phnom Penh, Cambodia &bull; Tel: +855 23 999 888</div>
        <div style="font-weight:800; font-size:1rem; margin-top:0.4rem; color:var(--primary);">${order.id}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(order.timestamp).toLocaleString()}</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.8rem;">
        <span><strong>Guest:</strong> ${order.customerName}</span>
        <span><strong>${order.diningMode === 'dine-in' ? `Table #${order.tableNumber}` : 'Takeaway'}</strong></span>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.8rem;">
        <span><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})</span>
        <span><strong>Phone:</strong> ${order.phone}</span>
      </div>

      <div style="border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color); padding:0.6rem 0; margin-bottom:0.6rem;">
        ${order.items.map(item => `
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.2rem;">
        <span>Subtotal</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--accent); margin-bottom:0.2rem;">
          <span>Voucher Discount</span>
          <span>-$${order.discount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.2rem;">
        <span>VAT Tax (10%)</span>
        <span>$${order.tax.toFixed(2)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.4rem;">
        <span>Service Fee (5%)</span>
        <span>$${order.serviceFee.toFixed(2)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.05rem; border-top:1px dashed var(--border-color); padding-top:0.5rem; color:var(--primary);">
        <span>TOTAL PAID:</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>
    `;

    state.selectedTrackingOrderId = order.id;
    receiptModal.style.display = 'flex';
  };

  trackOrderModalBtn.addEventListener('click', () => {
    receiptModal.style.display = 'none';
    switchView('tracker-view');
  });

  printReceiptBtn.addEventListener('click', () => {
    window.print();
  });

  closeReceiptBtn.addEventListener('click', () => {
    receiptModal.style.display = 'none';
  });

  // =========================================================================
  // 10. LIVE ORDER TRACKER VIEW
  // =========================================================================
  const renderTrackerView = () => {
    const orders = orderManager.orders;

    if (orders.length === 0) {
      trackerOrdersContainer.innerHTML = '<p class="text-muted">No orders placed yet.</p>';
      trackerPlaceholder.style.display = 'block';
      trackerActiveContent.style.display = 'none';
      return;
    }

    if (!state.selectedTrackingOrderId || !orderManager.getOrderById(state.selectedTrackingOrderId)) {
      state.selectedTrackingOrderId = orders[0].id;
    }

    // Render Order Cards List
    trackerOrdersContainer.innerHTML = orders.map(ord => {
      const isSelected = ord.id === state.selectedTrackingOrderId;
      let statusClass = `status-${ord.status}`;
      return `
        <div class="tracker-order-card ${isSelected ? 'selected' : ''}" data-track-id="${ord.id}">
          <div class="order-card-header">
            <span class="order-code">${ord.id}</span>
            <span class="order-status-badge ${statusClass}">${ord.status}</span>
          </div>
          <div class="order-card-meta">
            <span>${ord.items.length} items &bull; $${ord.total.toFixed(2)}</span>
            <span>${formatTimeAgo(ord.timestamp)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach card clicks
    trackerOrdersContainer.querySelectorAll('[data-track-id]').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedTrackingOrderId = card.dataset.trackId;
        renderTrackerView();
      });
    });

    // Render Detail Panel
    const activeOrder = orderManager.getOrderById(state.selectedTrackingOrderId);
    if (!activeOrder) return;

    trackerPlaceholder.style.display = 'none';
    trackerActiveContent.style.display = 'block';

    // Step calculation
    const statusMap = { 'pending': 1, 'cooking': 2, 'ready': 3, 'served': 4, 'cancelled': 0 };
    const currentStep = statusMap[activeOrder.status] || 1;
    const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / 3) * 100));

    trackerActiveContent.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
        <div>
          <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">ORDER TRACKING</span>
          <h2 style="font-size:1.6rem; color:var(--primary);">${activeOrder.id}</h2>
        </div>
        <div style="text-align:right;">
          <span class="order-status-badge status-${activeOrder.status}" style="font-size:0.85rem; padding:4px 12px;">
            ${activeOrder.status.toUpperCase()}
          </span>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">
            Placed: ${new Date(activeOrder.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </div>
        </div>
      </div>

      <!-- Timeline Stepper -->
      <div class="tracker-progress-stepper">
        <div class="stepper-progress-fill" style="width: ${progressPercent}%;"></div>

        <div class="step-node ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
          <div class="step-circle"><i class="fa-solid fa-receipt"></i></div>
          <div class="step-label">Order Placed</div>
          <div class="step-time">Confirmed</div>
        </div>

        <div class="step-node ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
          <div class="step-circle"><i class="fa-solid fa-fire-burner"></i></div>
          <div class="step-label">Cooking</div>
          <div class="step-time">In Kitchen</div>
        </div>

        <div class="step-node ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
          <div class="step-circle"><i class="fa-solid fa-bell-concierge"></i></div>
          <div class="step-label">Ready</div>
          <div class="step-time">Plated</div>
        </div>

        <div class="step-node ${currentStep >= 4 ? 'completed' : ''}">
          <div class="step-circle"><i class="fa-solid fa-champagne-glasses"></i></div>
          <div class="step-label">Served</div>
          <div class="step-time">Enjoy meal!</div>
        </div>
      </div>

      <!-- Order Details Summary -->
      <div class="tracker-receipt-summary">
        <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:0.75rem;">
          <span>Guest: ${activeOrder.customerName}</span>
          <span>${activeOrder.diningMode === 'dine-in' ? `Table #${activeOrder.tableNumber}` : 'Takeaway Pickup'}</span>
        </div>

        <table class="tracker-items-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Spice / Options</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${activeOrder.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.spiceLevel || 'Standard'} ${item.addOns.length ? `<br><small>+${item.addOns.join(', ')}</small>` : ''}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.15rem; margin-top:1.25rem; color:var(--text-main);">
          <span>Total Bill:</span>
          <span style="color:var(--primary);">$${activeOrder.total.toFixed(2)}</span>
        </div>
      </div>
    `;
  };

  refreshTrackerBtn.addEventListener('click', () => {
    renderTrackerView();
    showToast('Order status refreshed', 'info');
  });

  // =========================================================================
  // 11. KITCHEN DISPLAY SYSTEM (KDS) CONTROLLER
  // =========================================================================
  const renderKDSView = () => {
    const stats = orderManager.getKDSStats();
    kdsTotalOrders.textContent = stats.totalActive;
    kdsPrepOrders.textContent = stats.cooking;
    kdsReadyOrders.textContent = stats.ready;
    kdsTotalRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;

    // Tab counts
    const orders = orderManager.orders;
    kdsTabAllCount.textContent = stats.totalActive;
    kdsTabPendingCount.textContent = stats.pending;
    kdsTabCookingCount.textContent = stats.cooking;
    kdsTabReadyCount.textContent = stats.ready;

    // Filter tickets
    const filtered = orders.filter(o => {
      if (state.kdsFilterStatus === 'all') return ['pending', 'cooking', 'ready'].includes(o.status);
      if (state.kdsFilterStatus === 'completed') return ['served', 'cancelled'].includes(o.status);
      return o.status === state.kdsFilterStatus;
    });

    if (filtered.length === 0) {
      kdsOrdersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-light);">
          <i class="fa-solid fa-check-circle" style="font-size: 3rem; margin-bottom: 0.75rem;"></i>
          <h3>No orders in this station</h3>
          <p>Click "Simulate New Order" to generate test tickets.</p>
        </div>
      `;
      return;
    }

    kdsOrdersGrid.innerHTML = filtered.map(order => {
      let actionButtons = '';
      if (order.status === 'pending') {
        actionButtons = `
          <button class="btn btn-primary btn-block btn-sm" data-kds-action="cooking" data-order-id="${order.id}">
            <i class="fa-solid fa-fire-burner"></i> Start Cooking
          </button>
        `;
      } else if (order.status === 'cooking') {
        actionButtons = `
          <button class="btn btn-accent btn-block btn-sm" data-kds-action="ready" data-order-id="${order.id}">
            <i class="fa-solid fa-bell-concierge"></i> Mark Ready
          </button>
        `;
      } else if (order.status === 'ready') {
        actionButtons = `
          <button class="btn btn-secondary btn-block btn-sm" data-kds-action="served" data-order-id="${order.id}">
            <i class="fa-solid fa-circle-check"></i> Complete &amp; Serve
          </button>
        `;
      } else {
        actionButtons = `<span style="font-size:0.8rem; color:var(--text-light); font-weight:700;">ORDER CLOSED</span>`;
      }

      return `
        <div class="kds-ticket-card status-${order.status}">
          <div class="kds-ticket-header">
            <div>
              <span class="kds-order-num">${order.id}</span>
              <span class="order-status-badge status-${order.status}" style="margin-left: 0.4rem;">${order.status}</span>
            </div>
            <div class="kds-timer-pill">
              <i class="fa-solid fa-stopwatch"></i> ${formatTimeAgo(order.timestamp)}
            </div>
          </div>

          <div class="kds-ticket-body">
            <div class="kds-customer-row">
              <span><strong>Guest:</strong> ${order.customerName}</span>
              <span><strong>${order.diningMode === 'dine-in' ? `Table #${order.tableNumber}` : 'Takeaway'}</strong></span>
            </div>

            <ul class="kds-items-list">
              ${order.items.map(item => `
                <li class="kds-item-entry">
                  <div>
                    <span class="kds-item-qty">${item.quantity}x</span>
                    <span>${item.name}</span>
                    <span class="kds-item-note">&bull; ${item.spiceLevel} ${item.addOns.length ? `[+${item.addOns.join(', ')}]` : ''}</span>
                    ${item.note ? `<span class="kds-item-note text-warning">Note: "${item.note}"</span>` : ''}
                  </div>
                </li>
              `).join('')}
            </ul>

            ${order.specialNotes ? `
              <div class="kds-special-alert">
                <strong><i class="fa-solid fa-circle-exclamation"></i> Kitchen Note:</strong> ${order.specialNotes}
              </div>
            ` : ''}
          </div>

          <div class="kds-ticket-footer">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');

    // Attach KDS action handlers
    kdsOrdersGrid.querySelectorAll('[data-kds-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        const newStatus = btn.dataset.kdsAction;
        orderManager.updateOrderStatus(orderId, newStatus);
        renderKDSView();
        updateBadges();
        showToast(`Order ${orderId} moved to "${newStatus.toUpperCase()}"`, 'info');
      });
    });
  };

  kdsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      kdsTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.kdsFilterStatus = btn.dataset.status;
      renderKDSView();
    });
  });

  // Seed / Simulate demo order in KDS
  kdsSeedDemoBtn.addEventListener('click', () => {
    const demoItems = [
      { id: 'dish-5', name: 'Smoked Jalapeño Wagyu Smash Burger', price: 21.00, quantity: 2, spiceLevel: 'Smoky Medium Jalapeño', addOns: ['Applewood Smoked Bacon'], note: 'Extra sauce on side' },
      { id: 'dish-6', name: 'Spicy Firecracker Calamari', price: 16.50, quantity: 1, spiceLevel: 'Medium Zesty', addOns: [], note: '' }
    ];

    const demoOrder = orderManager.createOrder({
      customerName: 'Ly Heng',
      phone: '089 778 899',
      diningMode: 'dine-in',
      tableNumber: '03',
      paymentMethod: 'khqr',
      specialNotes: 'Table is celebrating an anniversary!',
      cartSummary: {
        subtotal: 58.50,
        discountAmount: 0,
        promoCode: null,
        tax: 5.85,
        serviceFee: 2.92,
        total: 67.27
      },
      cartItems: demoItems.map(d => ({
        dishId: d.id,
        name: d.name,
        unitPrice: d.price,
        quantity: d.quantity,
        spiceLevel: d.spiceLevel,
        addOns: d.addOns.map(name => ({ name })),
        note: d.note
      }))
    });

    renderKDSView();
    updateBadges();
    showToast(`Simulated Order ${demoOrder.id} sent to kitchen!`, 'success');
  });

  // =========================================================================
  // 12. HELPERS & BADGES
  // =========================================================================
  const updateBadges = () => {
    const active = orderManager.getActiveOrders();
    const pending = active.filter(o => o.status === 'pending');

    if (active.length > 0) {
      activeOrdersCountBadge.style.display = 'inline-block';
      activeOrdersCountBadge.textContent = active.length;
    } else {
      activeOrdersCountBadge.style.display = 'none';
    }

    if (pending.length > 0) {
      kitchenPendingCountBadge.style.display = 'inline-block';
      kitchenPendingCountBadge.textContent = pending.length;
    } else {
      kitchenPendingCountBadge.style.display = 'none';
    }
  };

  const formatTimeAgo = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  };

  // Re-check order status updates
  orderManager.subscribe(() => {
    updateBadges();
    if (document.getElementById('tracker-view').style.display !== 'none') {
      renderTrackerView();
    }
    if (document.getElementById('kitchen-view').style.display !== 'none') {
      renderKDSView();
    }
  });

  // =========================================================================
  // 13. APP BOOTSTRAP
  // =========================================================================
  renderCategories();
  filterAndRenderMenu();
  cartController.notify();
  updateBadges();
  updateDiningModeUI(cartController.state.diningMode);

  // Periodic elapsed time refresher (every 30 seconds)
  setInterval(() => {
    if (document.getElementById('kitchen-view').style.display !== 'none') {
      renderKDSView();
    }
  }, 30000);

});
