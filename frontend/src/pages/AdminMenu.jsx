import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import DishFormModal from '../components/DishFormModal';
import CategoryFormModal from '../components/CategoryFormModal';
import VoucherFormModal from '../components/VoucherFormModal';
import OrderReceiptModal from '../components/OrderReceiptModal';
import ConfirmDialog from '../components/ConfirmDialog';
import KitchenDashboard from './KitchenDashboard';
import {
  getVouchers,
  updateVoucher as apiUpdateVoucher,
  deleteVoucher as apiDeleteVoucher
} from '../services/supabaseClient';

const RESTAURANT_TABLES = [
  { id: '01', name: 'Table 01', zone: 'Patio Terrace', capacity: 2 },
  { id: '02', name: 'Table 02', zone: 'Window View', capacity: 4 },
  { id: '03', name: 'Table 03', zone: 'Cozy Booth', capacity: 4 },
  { id: '04', name: 'Table 04', zone: 'Main Dining Hall', capacity: 6 },
  { id: '05', name: 'Table 05', zone: 'VIP Wine Lounge', capacity: 8 },
  { id: '06', name: 'Table 06', zone: 'Main Dining Hall', capacity: 4 },
  { id: '07', name: 'Table 07', zone: 'Patio Terrace', capacity: 2 },
  { id: '08', name: 'Table 08', zone: 'Chef Counter', capacity: 2 }
];

export default function AdminMenu({ onShowToast, onGoToCustomerWeb, theme, toggleTheme }) {
  const {
    dishes,
    categories,
    toggleStock,
    deleteDish,
    resetMenuToDefault,
    addCategory,
    updateCategory,
    deleteCategory
  } = useMenu();
  const { orders, kdsStats, activeServiceRequests, resolveServiceRequest } = useOrders();
  const { user, logout, permissions } = useAuth();

  const [activeStation, setActiveStation] = useState(() => {
    const allowed = permissions?.allowedStations || ['dashboard', 'orders', 'menu'];
    if (user?.role === 'kitchen' && allowed.includes('orders')) return 'orders';
    if (user?.role === 'staff' && allowed.includes('floor')) return 'floor';
    return allowed[0] || 'dashboard';
  }); // 'dashboard' | 'orders' | 'menu' | 'categories' | 'floor' | 'discounts' | 'qr' | 'analytics'

  // Enforce role-based station restriction when switching users or roles
  useEffect(() => {
    if (permissions?.allowedStations && !permissions.allowedStations.includes(activeStation)) {
      const fallback =
        user?.role === 'kitchen' && permissions.allowedStations.includes('orders')
          ? 'orders'
          : user?.role === 'staff' && permissions.allowedStations.includes('floor')
          ? 'floor'
          : permissions.allowedStations[0] || 'orders';
      setActiveStation(fallback);
    }
  }, [permissions, user?.role, activeStation]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedTableForQr, setSelectedTableForQr] = useState('01');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Vouchers state (synced with Customer Hero Banner)
  const [vouchers, setVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_bistro_vouchers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 1, code: 'AURAVIP15', discountPercent: 15, description: '15% Off VIP Dining Special', isActive: true, isFeatured: true },
      { id: 2, code: 'WELCOME10', discountPercent: 10, description: '10% Off First-Time Guest', isActive: true, isFeatured: false },
      { id: 3, code: 'CHEF25', discountPercent: 25, description: '25% Off Chef Masterclass Promo', isActive: true, isFeatured: false },
      { id: 4, code: 'BISTRO20', discountPercent: 20, description: '20% Weekend Celebration Discount', isActive: true, isFeatured: false }
    ];
  });

  // Automatically sync vouchers to localStorage and notify other components immediately
  useEffect(() => {
    try {
      localStorage.setItem('aura_bistro_vouchers', JSON.stringify(vouchers));
      window.dispatchEvent(new Event('aura_vouchers_updated'));
    } catch (e) {}
  }, [vouchers]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherSearchQuery, setVoucherSearchQuery] = useState('');

  // Selected Order for Receipt Print
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Sales Date Filter
  const [salesDateFilter, setSalesDateFilter] = useState('all'); // 'today' | '7days' | 'month' | 'all'
  const [salesSearchQuery, setSalesSearchQuery] = useState('');

  // Table QR Print mode
  const [qrPrintAll, setQrPrintAll] = useState(false);

  // Clean Custom Dialog State (Replaces native browser alerts & confirms)
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
    icon: 'fa-solid fa-trash-can',
    isAlert: false,
    onConfirm: null
  });

  const openConfirmDialog = (config) => {
    setDialogConfig({
      isOpen: true,
      title: config.title || 'Are you sure?',
      message: config.message || '',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      confirmVariant: config.confirmVariant || 'danger',
      icon: config.icon || 'fa-solid fa-trash-can',
      isAlert: Boolean(config.isAlert),
      onConfirm: config.onConfirm || null
    });
  };

  const closeConfirmDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Print Mode Handlers for Table QR and Sales Reports
  const handlePrintQr = (printAll = false) => {
    setQrPrintAll(printAll);
    document.body.classList.add('printing-qr-mode');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSalesReport = () => {
    document.body.classList.add('printing-sales-mode');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCsv = (ordersToExport) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      if (onShowToast) onShowToast('No sales records to export for this date range.', 'info');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Time',
      'Customer Name',
      'Phone',
      'Dining Mode',
      'Table Number',
      'Items Ordered',
      'Payment Method',
      'Payment Status',
      'Subtotal ($)',
      'Voucher Code',
      'Discount ($)',
      'VAT Tax ($)',
      'Service Fee ($)',
      'Total ($)',
      'Order Status'
    ];

    const rows = ordersToExport.map((o) => {
      const d = o.timestamp ? new Date(o.timestamp) : new Date();
      const itemsList = (o.items || []).map(i => `${i.quantity || 1}x ${i.name || ''}`).join('; ');
      return [
        o.id || '',
        d.toLocaleDateString('en-CA'),
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        `"${(o.customerName || 'Walk-in Guest').replace(/"/g, '""')}"`,
        `"${(o.phone || 'N/A').replace(/"/g, '""')}"`,
        o.diningMode || 'dine-in',
        o.diningMode === 'dine-in' ? (o.tableNumber || '01') : 'Takeaway',
        `"${itemsList.replace(/"/g, '""')}"`,
        o.paymentMethod === 'khqr' ? 'Bakong KHQR' : String(o.paymentMethod || 'CASH').toUpperCase(),
        o.paymentStatus || 'Paid',
        Number(o.subtotal || 0).toFixed(2),
        o.promoCode || 'NONE',
        Number(o.discount || 0).toFixed(2),
        Number(o.tax || 0).toFixed(2),
        Number(o.serviceFee || 0).toFixed(2),
        Number(o.total || 0).toFixed(2),
        String(o.status || 'completed').toUpperCase()
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filterTag = salesDateFilter.toUpperCase();
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `Bistro_Sales_Report_${filterTag}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast(`Exported ${ordersToExport.length} orders to CSV successfully!`, 'success');
    }
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-qr-mode');
      document.body.classList.remove('printing-sales-mode');
      document.body.classList.remove('printing-receipt-mode');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Load live vouchers from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadVouchers() {
      try {
        const data = await getVouchers();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setVouchers(data);
        }
      } catch (err) {
        console.warn('Unable to load vouchers from Supabase:', err);
      }
    }
    loadVouchers();
  }, []);

  const handleOpenAddVoucherModal = () => {
    setEditingVoucher(null);
    setIsVoucherModalOpen(true);
  };

  const handleOpenEditVoucherModal = (voucher) => {
    setEditingVoucher(voucher);
    setIsVoucherModalOpen(true);
  };

  const handleToggleVoucherStatus = async (voucher) => {
    const newStatus = !voucher.isActive;
    setVouchers(prev => prev.map(v => v.id === voucher.id ? { ...v, isActive: newStatus } : v));
    try {
      await apiUpdateVoucher(voucher.id, { isActive: newStatus });
      if (onShowToast) onShowToast(`Voucher "${voucher.code}" ${newStatus ? 'activated' : 'disabled'}`, 'info');
    } catch (e) {
      console.warn('Error updating voucher status:', e);
    }
  };

  const handleDeleteVoucher = (voucher) => {
    openConfirmDialog({
      title: 'Delete Promo Voucher?',
      message: `Are you sure you want to permanently delete the promo code "${voucher.code}" (${voucher.discountPercent}% OFF)? This discount code will no longer be available for customer checkout.`,
      confirmText: 'Delete Voucher',
      cancelText: 'Keep Voucher',
      confirmVariant: 'danger',
      icon: 'fa-solid fa-tags',
      onConfirm: async () => {
        closeConfirmDialog();
        setVouchers(prev => prev.filter(v => v.id !== voucher.id));
        try {
          await apiDeleteVoucher(voucher.id);
          if (onShowToast) onShowToast(`Deleted voucher "${voucher.code}"`, 'info');
        } catch (e) {
          console.warn('Error deleting voucher:', e);
        }
      }
    });
  };

  const handleSaveVoucherSuccess = (saved) => {
    setVouchers(prev => {
      const isSetAsFeatured = Boolean(saved.isFeatured);
      const updated = prev.map(v => {
        if (v.id === saved.id || v.code === saved.code) {
          return saved;
        }
        return isSetAsFeatured ? { ...v, isFeatured: false } : v;
      });
      if (!updated.some(v => v.id === saved.id || v.code === saved.code)) {
        if (isSetAsFeatured) {
          return [saved, ...updated.map(v => ({ ...v, isFeatured: false }))];
        }
        return [saved, ...updated];
      }
      return updated;
    });
  };

  const handleSetFeaturedVoucher = (voucherId) => {
    setVouchers(prev =>
      prev.map(v => ({
        ...v,
        isFeatured: v.id === voucherId
      }))
    );
    const target = vouchers.find(v => v.id === voucherId);
    if (onShowToast && target) {
      onShowToast(`⭐ "${target.code}" is now the active Homepage Banner Offer!`, 'success');
    }
  };

  // Filter dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesCat = selectedCategory === 'all' || dish.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const outOfStockCount = dishes.filter(d => !d.inStock).length;

  const handleOpenAddModal = () => {
    setEditingDish(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleDeleteDish = (dish) => {
    openConfirmDialog({
      title: 'Delete Menu Dish?',
      message: `Are you sure you want to remove "${dish.name}" from the active menu? Diners will no longer see this dish in the storefront.`,
      confirmText: 'Delete Dish',
      cancelText: 'Keep Dish',
      confirmVariant: 'danger',
      icon: 'fa-solid fa-trash-can',
      onConfirm: () => {
        closeConfirmDialog();
        deleteDish(dish.id);
        if (onShowToast) onShowToast(`Removed "${dish.name}"`, 'info');
      }
    });
  };

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (cat) => {
    if (cat.id === 'all') {
      openConfirmDialog({
        title: 'System Category Protected',
        message: 'The "All Dishes" root category is part of the system foundation and cannot be deleted.',
        confirmText: 'Understood',
        confirmVariant: 'warning',
        icon: 'fa-solid fa-shield-halved',
        isAlert: true,
        onConfirm: () => closeConfirmDialog()
      });
      return;
    }
    const dishCount = dishes.filter(d => d.category === cat.id).length;
    let confirmMsg = `Are you sure you want to delete the category "${cat.name}"?`;
    if (dishCount > 0) {
      confirmMsg = `WARNING: "${cat.name}" currently contains ${dishCount} dish(es)!\nDeleting this category will orphan these dishes. Are you sure you wish to delete it?`;
    }

    openConfirmDialog({
      title: `Delete Category "${cat.name}"?`,
      message: confirmMsg,
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      icon: 'fa-solid fa-layer-group',
      onConfirm: () => {
        closeConfirmDialog();
        deleteCategory(cat.id);
        if (onShowToast) onShowToast(`Deleted category "${cat.name}"`, 'info');
      }
    });
  };

  const handleResetDefaultsWithConfirm = () => {
    openConfirmDialog({
      title: 'Reset Menu to Factory Presets?',
      message: 'This will reset all menu dishes, categories, and inventory counts back to sample defaults. Any custom items created will be refreshed.',
      confirmText: 'Reset to Defaults',
      cancelText: 'Cancel',
      confirmVariant: 'warning',
      icon: 'fa-solid fa-rotate-left',
      onConfirm: () => {
        closeConfirmDialog();
        resetMenuToDefault();
        if (onShowToast) onShowToast('Reset menu data to factory defaults', 'info');
      }
    });
  };

  // Filtered categories for category station
  const filteredCategories = categories.filter((cat) => {
    if (!categorySearchQuery) return true;
    const q = categorySearchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.id.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  const getTableOrder = (tableNum) => {
    return orders.find(
      (o) =>
        o.diningMode === 'dine-in' &&
        o.tableNumber === tableNum &&
        ['pending', 'cooking', 'ready'].includes(o.status)
    );
  };

  const getTableStatus = (tableNum) => {
    const activeOrder = getTableOrder(tableNum);
    if (!activeOrder) return { status: 'available', label: 'Available', color: 'var(--accent)' };
    if (activeOrder.status === 'pending') return { status: 'pending', label: 'Order Pending', color: 'var(--warning)', order: activeOrder };
    if (activeOrder.status === 'cooking') return { status: 'cooking', label: 'Cooking in Kitchen', color: '#3b82f6', order: activeOrder };
    return { status: 'ready', label: 'Food Served', color: '#8b5cf6', order: activeOrder };
  };

  const getTableServiceCall = (tableNum) => {
    if (!activeServiceRequests) return null;
    return activeServiceRequests.find(r => r.tableNumber === String(tableNum).padStart(2, '0'));
  };

  const occupiedTablesCount = RESTAURANT_TABLES.filter(t => getTableStatus(t.id).status !== 'available').length;
  const dineInCount = orders.filter(o => o.diningMode === 'dine-in').length;
  const takeoutCount = orders.filter(o => o.diningMode === 'takeout').length;
  const totalOrdersCount = orders.length;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const stationMeta = {
    dashboard: { title: 'Executive Overview Dashboard', icon: 'fa-solid fa-chart-pie' },
    orders: { title: 'Order Receiving (Kitchen KDS)', icon: 'fa-solid fa-fire-burner' },
    menu: { title: 'Menu & Stock Management', icon: 'fa-solid fa-bowl-food' },
    categories: { title: 'Category Management', icon: 'fa-solid fa-layer-group' },
    floor: { title: 'Interactive Floor Plan & Tables', icon: 'fa-solid fa-map' },
    discounts: { title: 'Discounts & Promo Codes', icon: 'fa-solid fa-tags' },
    qr: { title: 'Table QR Placard Generator', icon: 'fa-solid fa-qrcode' },
    analytics: { title: 'Sales & Business Analytics', icon: 'fa-solid fa-chart-line' }
  };

  return (
    <div className="admin-shell">
      {/* 1. LEFT VERTICAL SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <div
            className="admin-sidebar-logo-icon"
            style={{
              background: '#ffffff',
              padding: '3px',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <img
              src="./images/logo.png"
              alt="Bistro Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="admin-sidebar-brand-name">Bistro</div>
            <span className="admin-sidebar-brand-badge">ADMIN CONSOLE</span>
          </div>
        </div>

        {/* Vertical Navigation Links (Strictly filtered by RBAC Role Permissions) */}
        <ul className="admin-nav-list">
          {/* 1. DASHBOARD */}
          {permissions?.allowedStations?.includes('dashboard') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('dashboard');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-chart-pie"></i>
                  <span>Dashboard</span>
                </div>
              </button>
            </li>
          )}

          {/* 2. ORDER RECEIVING (KDS) */}
          {permissions?.allowedStations?.includes('orders') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'orders' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('orders');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-fire-burner"></i>
                  <span>Order Receiving</span>
                </div>
                {kdsStats.pending > 0 && (
                  <span
                    className="admin-nav-badge"
                    style={{ background: 'var(--warning)', color: '#fff' }}
                  >
                    {kdsStats.pending}
                  </span>
                )}
              </button>
            </li>
          )}

          {/* 3. MENU & STOCK */}
          {permissions?.allowedStations?.includes('menu') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'menu' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('menu');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-bowl-food"></i>
                  <span>Menu &amp; Stock</span>
                </div>
                {outOfStockCount > 0 && (
                  <span
                    className="admin-nav-badge"
                    style={{ background: 'var(--danger)', color: '#fff' }}
                  >
                    {outOfStockCount} Out
                  </span>
                )}
              </button>
            </li>
          )}

          {/* 4. CATEGORIES */}
          {permissions?.allowedStations?.includes('categories') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'categories' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('categories');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-layer-group"></i>
                  <span>Categories</span>
                </div>
                <span
                  className="admin-nav-badge"
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {categories.filter(c => c.id !== 'all').length}
                </span>
              </button>
            </li>
          )}

          {/* 5. FLOOR PLAN */}
          {permissions?.allowedStations?.includes('floor') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'floor' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('floor');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-map"></i>
                  <span>Floor Plan</span>
                </div>
                {occupiedTablesCount > 0 && (
                  <span
                    className="admin-nav-badge"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {occupiedTablesCount}/8
                  </span>
                )}
              </button>
            </li>
          )}

          {/* 6. DISCOUNTS & VOUCHERS */}
          {permissions?.allowedStations?.includes('discounts') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'discounts' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('discounts');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-tags"></i>
                  <span>Discounts &amp; Vouchers</span>
                </div>
                <span
                  className="admin-nav-badge"
                  style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--primary)', fontWeight: 800 }}
                >
                  {vouchers.filter(v => v.isActive).length}
                </span>
              </button>
            </li>
          )}

          {/* 7. TABLE QR PLACARDS */}
          {permissions?.allowedStations?.includes('qr') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'qr' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('qr');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-qrcode"></i>
                  <span>Table QR Cards</span>
                </div>
              </button>
            </li>
          )}

          {/* 8. SALES ANALYTICS */}
          {permissions?.allowedStations?.includes('analytics') && (
            <li>
              <button
                type="button"
                className={`admin-nav-btn ${activeStation === 'analytics' ? 'active' : ''}`}
                onClick={() => {
                  setActiveStation('analytics');
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="admin-nav-btn-content">
                  <i className="fa-solid fa-chart-line"></i>
                  <span>Sales Reports</span>
                </div>
              </button>
            </li>
          )}
        </ul>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          {/* User Profile Pill */}
          <div className="admin-user-pill">
            <div
              className="admin-user-avatar"
              style={{
                background:
                  user?.role === 'admin'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : user?.role === 'manager'
                    ? 'rgba(59, 130, 246, 0.2)'
                    : user?.role === 'kitchen'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                color:
                  user?.role === 'admin'
                    ? '#f59e0b'
                    : user?.role === 'manager'
                    ? '#3b82f6'
                    : user?.role === 'kitchen'
                    ? '#ef4444'
                    : '#10b981'
              }}
            >
              <i
                className={
                  user?.role === 'admin'
                    ? 'fa-solid fa-crown'
                    : user?.role === 'manager'
                    ? 'fa-solid fa-user-tie'
                    : user?.role === 'kitchen'
                    ? 'fa-solid fa-kitchen-set'
                    : 'fa-solid fa-bell-concierge'
                }
              ></i>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || (user?.role ? user.role.toUpperCase() : 'Staff Member')}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Role:{' '}
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    color:
                      user?.role === 'admin'
                        ? '#f59e0b'
                        : user?.role === 'manager'
                        ? '#3b82f6'
                        : user?.role === 'kitchen'
                        ? '#ef4444'
                        : '#10b981'
                  }}
                >
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Switch to Customer Storefront */}
          {onGoToCustomerWeb && (
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-block"
              onClick={onGoToCustomerWeb}
              title="Return to Customer Storefront URL"
              style={{ justifyContent: 'center', gap: '0.5rem' }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Customer Store
            </button>
          )}

          {/* Sign Out Button */}
          <button
            type="button"
            className="btn btn-ghost text-danger btn-sm btn-block"
            onClick={() => {
              logout();
              if (onShowToast) onShowToast('Signed out of Bistro Admin Panel', 'info');
            }}
            style={{ justifyContent: 'center', gap: '0.5rem' }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN RIGHT CONTENT AREA */}
      <div className="admin-content-shell">
        {/* Top Header Bar */}
        <header className="admin-top-bar">
          <div className="admin-top-bar-left">
            <button
              type="button"
              className="icon-button"
              style={{ display: 'inline-flex', marginRight: '0.5rem' }}
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              aria-label="Toggle Navigation Sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            <h2 className="admin-station-title">
              <i className={stationMeta[activeStation]?.icon || 'fa-solid fa-utensils'} style={{ color: 'var(--primary)' }}></i>
              <span>{stationMeta[activeStation]?.title || 'Station Console'}</span>
            </h2>
          </div>

          <div className="admin-top-bar-right">
            {/* Quick KPI Strip in Header (Filtered by permission) */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {permissions?.canViewFinancials && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)'
                  }}
                >
                  Today's Sales: <strong style={{ color: 'var(--primary)' }}>${kdsStats.totalRevenue.toFixed(2)}</strong>
                </span>
              )}

              <span
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)'
                }}
              >
                Active Orders: <strong style={{ color: 'var(--warning)' }}>{kdsStats.totalActive}</strong>
              </span>

              {permissions?.allowedStations?.includes('floor') && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)'
                  }}
                >
                  Tables: <strong style={{ color: 'var(--accent)' }}>{occupiedTablesCount}/8 Occupied</strong>
                </span>
              )}

              {/* Live Guest Table Service Call Alert */}
              {activeServiceRequests && activeServiceRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (permissions?.allowedStations?.includes('floor')) {
                      setActiveStation('floor');
                    }
                  }}
                  style={{
                    padding: '4px 11px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: permissions?.allowedStations?.includes('floor') ? 'pointer' : 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Guest table assistance requested"
                >
                  <i className="fa-solid fa-bell-concierge"></i>
                  <span>{activeServiceRequests.length} Table Call{activeServiceRequests.length > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>

            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                type="button"
                className="icon-button"
                onClick={toggleTheme}
                title="Switch Theme"
              >
                <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
              </button>
            )}

            {/* Reset Defaults (Admin only) */}
            {permissions?.canResetDefaults && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleResetDefaultsWithConfirm}
                title="Reset sample menu data"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            )}
          </div>
        </header>

        {/* Main Station Body */}
        <main className="admin-body-container">
          {!permissions?.allowedStations?.includes(activeStation) ? (
            <div
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                maxWidth: '560px',
                margin: '3rem auto',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  marginBottom: '1.25rem'
                }}
              >
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800 }}>
                Access Restricted
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your account role (<strong>{user?.role ? user.role.toUpperCase() : 'STAFF'}</strong>) does not have authorization to view the <strong>{stationMeta[activeStation]?.title || activeStation}</strong> station.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const fallback = permissions?.allowedStations?.[0] || 'orders';
                  setActiveStation(fallback);
                }}
              >
                <i className="fa-solid fa-arrow-left"></i> Return to Authorized Station
              </button>
            </div>
          ) : (
            <>
          {/* =============================================================== */}
          {/* STATION 0: EXECUTIVE OVERVIEW DASHBOARD                         */}
          {/* =============================================================== */}
          {activeStation === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Welcome Hero Banner */}
              <div
                style={{
                  padding: '1.5rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ● SUPABASE CONNECTED
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                    Welcome back, {user?.name || 'Administrator'} 👋
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Here is your live restaurant performance snapshot and order processing center.
                  </p>
                </div>

                {/* Quick Action Shortcuts */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {permissions?.canEditMenu && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleOpenAddModal}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Dish
                    </button>
                  )}

                  {permissions?.allowedStations?.includes('orders') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveStation('orders')}
                    >
                      <i className="fa-solid fa-fire-burner"></i> Open KDS ({kdsStats.pending})
                    </button>
                  )}

                  {permissions?.allowedStations?.includes('floor') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveStation('floor')}
                    >
                      <i className="fa-solid fa-map"></i> Floor Plan ({occupiedTablesCount}/8)
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Primary KPI Stat Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {/* 1. Total Revenue Card */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL REVENUE</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-dollar-sign"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: '0.4rem 0 0.2rem' }}>
                    ${kdsStats.totalRevenue.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <i className="fa-solid fa-arrow-trend-up"></i>
                    <span>Live synced with orders</span>
                  </div>
                </div>

                {/* 2. Total Orders Card */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ORDERS PROCESSED</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-receipt"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem' }}>
                    {totalOrdersCount} Orders
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🍽️ {dineInCount} Dine-In &bull; 🛵 {takeoutCount} Takeaway
                  </div>
                </div>

                {/* 3. Kitchen Queue Card */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>KITCHEN QUEUE</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-fire-burner"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', margin: '0.4rem 0 0.2rem' }}>
                    {kdsStats.totalActive} Active
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {kdsStats.pending} Pending &bull; {kdsStats.cooking} Cooking &bull; {kdsStats.ready} Ready
                  </div>
                </div>

                {/* 4. Table Occupancy Card */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TABLE OCCUPANCY</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-chair"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', margin: '0.4rem 0 0.2rem' }}>
                    {occupiedTablesCount} / 8 Tables
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {Math.round((occupiedTablesCount / 8) * 100)}% Dining Room Occupied
                  </div>
                </div>
              </div>

              {/* Main Split Grid: Live Orders Stream & Channel Breakdown */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Left Card: Recent Live Orders Stream */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                        Recent Live Orders
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest incoming customer tickets</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setActiveStation('orders')}
                    >
                      View KDS ➔
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.slice(0, 5).map((order) => {
                      const statusColor =
                        order.status === 'pending'
                          ? 'var(--warning)'
                          : order.status === 'cooking'
                          ? '#3b82f6'
                          : order.status === 'ready'
                          ? 'var(--accent)'
                          : '#64748b';

                      return (
                        <div
                          key={order.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: `${statusColor}20`,
                                color: statusColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8rem'
                              }}
                            >
                              {order.diningMode === 'dine-in' ? `T${order.tableNumber || '01'}` : '🛵'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                {order.id} &bull; {order.customerName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {order.items ? order.items.length : 0} items &bull; {order.diningMode === 'dine-in' ? `Table #${order.tableNumber}` : 'Takeaway Pickup'}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                              ${Number(order.total || 0).toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center', marginTop: '0.25rem' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  background: `${statusColor}20`,
                                  color: statusColor
                                }}
                              >
                                {order.status}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '2px 7px', fontSize: '0.72rem', gap: '3px' }}
                                onClick={() => setSelectedReceiptOrder(order)}
                                title="Print 80mm Receipt"
                              >
                                <i className="fa-solid fa-receipt"></i> Print
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Card: Order Queue Meters & Channels */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-chart-simple" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                      Operational Breakdown
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kitchen workload and dining mode distribution</span>
                  </div>

                  {/* KDS Status Progress Meters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        <span>🟡 Pending Tickets</span>
                        <span>{kdsStats.pending} orders</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${totalOrdersCount > 0 ? (kdsStats.pending / totalOrdersCount) * 100 : 0}%`, height: '100%', background: 'var(--warning)', borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        <span>🔵 Cooking in Kitchen</span>
                        <span>{kdsStats.cooking} orders</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${totalOrdersCount > 0 ? (kdsStats.cooking / totalOrdersCount) * 100 : 0}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        <span>🟢 Ready to Serve</span>
                        <span>{kdsStats.ready} orders</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${totalOrdersCount > 0 ? (kdsStats.ready / totalOrdersCount) * 100 : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Channel Breakdown Box */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-around',
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {dineInCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🍽️ Dine-In ({totalOrdersCount > 0 ? Math.round((dineInCount / totalOrdersCount) * 100) : 0}%)
                      </div>
                    </div>

                    <div style={{ borderRight: '1px solid var(--border-color)' }}></div>

                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {takeoutCount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🛵 Takeaway ({totalOrdersCount > 0 ? Math.round((takeoutCount / totalOrdersCount) * 100) : 0}%)
                      </div>
                    </div>

                    <div style={{ borderRight: '1px solid var(--border-color)' }}></div>

                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {dishes.length}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🍲 Active Dishes
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Dishes & Quick Floor Plan Glance */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Popular Dishes Widget */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-trophy" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                      Culinary Highlights
                    </h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setActiveStation('menu')}
                    >
                      Manage All ➔
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {dishes.slice(0, 4).map((dish, idx) => (
                      <div
                        key={dish.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', width: '20px' }}>
                            #{idx + 1}
                          </span>
                          <img
                            src={dish.image}
                            alt={dish.name}
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{dish.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dish.category} &bull; {dish.prepTime}</div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.88rem' }}>
                          ${Number(dish.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Floor Plan Glance */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                      Floor Plan Quick Glance
                    </h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setActiveStation('floor')}
                    >
                      Full Map ➔
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                    {RESTAURANT_TABLES.map((t) => {
                      const tInfo = getTableStatus(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => setActiveStation('floor')}
                          style={{
                            padding: '0.75rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${tInfo.color}`,
                            background: `${tInfo.color}15`,
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.name}</div>
                          <div style={{ fontSize: '0.68rem', color: tInfo.color, fontWeight: 700 }}>
                            {tInfo.status === 'available' ? 'Free' : tInfo.status.toUpperCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION 1: ORDER RECEIVING (KDS)                                */}
          {/* =============================================================== */}
          {activeStation === 'orders' && (
            <KitchenDashboard onShowToast={onShowToast} />
          )}

          {/* =============================================================== */}
          {/* STATION 2: MENU & STOCK MANAGEMENT                              */}
          {/* =============================================================== */}
          {activeStation === 'menu' && (
            <div>
              {/* Category Quick Filter Pills Strip */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.6rem',
                  marginBottom: '1rem',
                  alignItems: 'center'
                }}
              >
                {categories.map((c) => {
                  const isSelected = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 3px 10px var(--primary-glow)' : 'none'
                      }}
                    >
                      <i className={c.icon || 'fa-solid fa-utensils'}></i>
                      <span>{c.name}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)'
                        }}
                      >
                        {c.count ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Controls Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                  <input
                    type="text"
                    placeholder="Search dish name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.6rem 1rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)'
                    }}
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '0.6rem 1rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="all">All Categories ({dishes.length})</option>
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.count ?? 0})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  {permissions?.allowedStations?.includes('categories') && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveStation('categories')}
                      title="Manage menu categories & taxonomy"
                      style={{ gap: '0.4rem' }}
                    >
                      <i className="fa-solid fa-layer-group" style={{ color: 'var(--primary)' }}></i>
                      <span>Categories ({categories.filter(c => c.id !== 'all').length})</span>
                    </button>
                  )}

                  {permissions?.canEditMenu && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleOpenAddModal}
                    >
                      <i className="fa-solid fa-plus"></i> Add New Dish
                    </button>
                  )}
                </div>
              </div>

              {/* Dishes Table */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  overflowX: 'auto'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Dish</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Price</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Stock Status</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Dietary / Tags</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No dishes matched your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDishes.map((dish) => (
                        <tr key={dish.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img
                                src={dish.image}
                                alt={dish.name}
                                style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: 700 }}>{dish.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {dish.description}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>
                            {dish.category}
                          </td>

                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                            ${Number(dish.price).toFixed(2)}
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button
                              type="button"
                              onClick={() => toggleStock(dish.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: dish.inStock ? 'var(--accent-light)' : 'var(--danger-light)',
                                color: dish.inStock ? 'var(--accent-hover)' : 'var(--danger)',
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer'
                              }}
                              title="Click to toggle availability"
                            >
                              <i className={dish.inStock ? 'fa-solid fa-check-circle' : 'fa-solid fa-ban'}></i>
                              {dish.inStock ? 'In Stock' : 'Sold Out'}
                            </button>
                          </td>

                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {dish.isChefPick && (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--primary-light)', color: 'var(--primary-hover)', borderRadius: '4px' }}>
                                  Chef Pick
                                </span>
                              )}
                              {dish.isVegetarian && (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--accent-light)', color: 'var(--accent-hover)', borderRadius: '4px' }}>
                                  Veg
                                </span>
                              )}
                              {dish.isSpicy && (
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '4px' }}>
                                  Spicy
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              {permissions?.canEditMenu ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleOpenEditModal(dish)}
                                    title="Edit dish"
                                  >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-ghost text-danger"
                                    onClick={() => handleDeleteDish(dish)}
                                    title="Delete dish"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-subtle)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Role restricted to stock availability toggle"
                                >
                                  <i className="fa-solid fa-lock" style={{ fontSize: '0.65rem' }}></i> Stock Only
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION: CATEGORY MANAGEMENT                                    */}
          {/* =============================================================== */}
          {activeStation === 'categories' && (
            <div>
              {/* Category KPI Metrics Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                {/* 1. Total Categories */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIVE CATEGORIES</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-layer-group"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: '0.4rem 0 0.2rem' }}>
                    {categories.filter(c => c.id !== 'all').length} Categories
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Plus 1 system-wide master filter
                  </div>
                </div>

                {/* 2. Total Menu Items Assigned */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ASSIGNED DISHES</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-utensils"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', margin: '0.4rem 0 0.2rem' }}>
                    {dishes.length} Items
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Organized across customer menu
                  </div>
                </div>

                {/* 3. Top Category */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>LARGEST SECTION</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-crown"></i>
                    </span>
                  </div>
                  {(() => {
                    const nonAll = categories.filter(c => c.id !== 'all');
                    const sorted = [...nonAll].sort((a, b) => (b.count || 0) - (a.count || 0));
                    const top = sorted[0];
                    return (
                      <>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {top ? top.name : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {top ? `${top.count ?? 0} dishes listed` : 'No categories yet'}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 4. Cloud Sync Status */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CLOUD SYNC</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0 0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    Supabase Live
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Realtime postgres sync active
                  </div>
                </div>
              </div>

              {/* Action & Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <input
                    type="text"
                    placeholder="Search categories by name, slug or description..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddCategoryModal}
                  style={{ gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-plus"></i> Add New Category
                </button>
              </div>

              {/* Categories Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {filteredCategories.map((cat) => {
                  const isAll = cat.id === 'all';
                  const catDishes = isAll ? dishes : dishes.filter(d => d.category === cat.id);

                  return (
                    <div
                      key={cat.id}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        position: 'relative'
                      }}
                    >
                      {/* Top Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                background: isAll
                                  ? 'linear-gradient(135deg, var(--bg-subtle), var(--border-color))'
                                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.25))',
                                color: isAll ? 'var(--text-main)' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.3rem',
                                border: '1px solid var(--border-color)',
                                flexShrink: 0
                              }}
                            >
                              <i className={cat.icon || 'fa-solid fa-utensils'}></i>
                            </div>

                            <div>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                {cat.name}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: '4px' }}>
                                  slug: {cat.id}
                                </code>
                                {isAll && (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    SYSTEM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Live Items Count Pill */}
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: catDishes.length > 0 ? 'var(--accent-light)' : 'var(--bg-subtle)',
                              color: catDishes.length > 0 ? 'var(--accent-hover)' : 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {catDishes.length} {catDishes.length === 1 ? 'Dish' : 'Dishes'}
                          </span>
                        </div>

                        {/* Description */}
                        {cat.description && (
                          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {cat.description}
                          </p>
                        )}

                        {/* Preview Dishes in this category */}
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Menu Items Preview:
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                            {catDishes.length > 0 ? (
                              catDishes.slice(0, 3).map((d) => (
                                <span
                                  key={d.id}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {d.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No dishes assigned yet.
                              </span>
                            )}
                            {catDishes.length > 3 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                +{catDishes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setActiveStation('menu');
                          }}
                          style={{ gap: '0.35rem', fontSize: '0.78rem' }}
                        >
                          <i className="fa-solid fa-eye"></i> View Dishes ({catDishes.length})
                        </button>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenEditCategoryModal(cat)}
                            title="Edit Category Details & Icon"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-danger"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={isAll}
                            title={isAll ? 'System category cannot be deleted' : 'Delete category'}
                            style={{
                              opacity: isAll ? 0.3 : 1,
                              cursor: isAll ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    marginTop: '1rem'
                  }}
                >
                  <i className="fa-solid fa-layer-group" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}></i>
                  <h4 style={{ margin: '0 0 0.5rem' }}>No Categories Found</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No categories match your search term "{categorySearchQuery}".
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setCategorySearchQuery('')}
                    style={{ marginTop: '1rem' }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION 3: INTERACTIVE FLOOR PLAN & TABLE MANAGEMENT             */}
          {/* =============================================================== */}
          {activeStation === 'floor' && (
            <div>
              <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Restaurant Floor Plan Status</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Real-time dining room occupancy synced with active kitchen orders.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></span> Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span> Order Placed
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span> Cooking
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }}></span> Food Served
                  </span>
                </div>
              </div>

              {/* Active Guest Assistance Requests Queue */}
              {activeServiceRequests && activeServiceRequests.length > 0 && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                      <strong style={{ fontSize: '0.9rem', color: '#ef4444' }}>
                        Active Guest Assistance Requests ({activeServiceRequests.length})
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staff Attention Needed</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {activeServiceRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong style={{ color: '#ef4444' }}>Table {req.tableNumber}:</strong>
                        <span>{req.label}</span>
                        {req.note && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({req.note})</span>}
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                          onClick={() => {
                            resolveServiceRequest(req.id);
                            if (onShowToast) onShowToast(`Resolved service call for Table ${req.tableNumber}`, 'success');
                          }}
                        >
                          <i className="fa-solid fa-check"></i> Done
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {RESTAURANT_TABLES.map((table) => {
                  const tableInfo = getTableStatus(table.id);
                  const order = tableInfo.order;
                  const serviceCall = getTableServiceCall(table.id);

                  return (
                    <div
                      key={table.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: serviceCall ? '2px solid #ef4444' : `2px solid ${tableInfo.color}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        boxShadow: serviceCall ? '0 4px 15px rgba(239, 68, 68, 0.25)' : 'var(--shadow-sm)',
                        position: 'relative'
                      }}
                    >
                      {/* Active Table Call Alert Banner */}
                      {serviceCall && (
                        <div
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>
                            <i className={serviceCall.icon || 'fa-solid fa-bell'}></i>
                            <span>{serviceCall.label}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                            onClick={() => {
                              resolveServiceRequest(serviceCall.id);
                              if (onShowToast) onShowToast(`Resolved call for Table ${table.id}`, 'success');
                            }}
                          >
                            <i className="fa-solid fa-check"></i> Done
                          </button>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{table.name}</h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {table.zone} &bull; {table.capacity} Seats
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: `${tableInfo.color}20`,
                            color: tableInfo.color,
                            border: `1px solid ${tableInfo.color}`
                          }}
                        >
                          {tableInfo.label}
                        </span>
                      </div>

                      {order ? (
                        <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span><strong>Guest:</strong> {order.customerName}</span>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>${order.total.toFixed(2)}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Order ID: <strong>{order.id}</strong> &bull; {order.items.length} items</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '2px 7px', fontSize: '0.72rem', gap: '3px' }}
                              onClick={() => setSelectedReceiptOrder(order)}
                              title="Print 80mm Receipt"
                            >
                              <i className="fa-solid fa-receipt"></i> Print
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          Ready for next customer scan
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-block"
                          onClick={() => {
                            setSelectedTableForQr(table.id);
                            setActiveStation('qr');
                          }}
                        >
                          <i className="fa-solid fa-qrcode"></i> View Table QR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION 4: DISCOUNTS & PROMOTIONAL VOUCHERS                     */}
          {/* =============================================================== */}
          {activeStation === 'discounts' && (
            <div>
              {/* Voucher KPI Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL VOUCHERS</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-tags"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: '0.4rem 0 0.2rem' }}>
                    {vouchers.length} Promo Codes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {vouchers.filter(v => v.isActive).length} currently active at checkout
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>MAX DISCOUNT RATE</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-percent"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', margin: '0.4rem 0 0.2rem' }}>
                    {vouchers.length > 0 ? Math.max(...vouchers.map(v => Number(v.discountPercent) || 0)) : 0}% OFF
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Highest single savings rate
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER SAVINGS</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-piggy-bank"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem' }}>
                    ${orders.reduce((sum, o) => sum + Number(o.discount || 0), 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Total discounts granted to date
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>SUPABASE REALTIME</span>
                    <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-cloud-check"></i>
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0 0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    Live Synced
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Instant validation at checkout
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <input
                    type="text"
                    placeholder="Search promo codes or descriptions..."
                    value={voucherSearchQuery}
                    onChange={(e) => setVoucherSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 1rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddVoucherModal}
                  style={{ gap: '0.4rem' }}
                >
                  <i className="fa-solid fa-plus"></i> Create New Voucher
                </button>
              </div>

              {/* Vouchers Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {vouchers
                  .filter((v) => {
                    if (!voucherSearchQuery) return true;
                    const q = voucherSearchQuery.toLowerCase();
                    return (
                      (v.code || '').toLowerCase().includes(q) ||
                      (v.description || '').toLowerCase().includes(q)
                    );
                  })
                  .map((voucher) => (
                    <div
                      key={voucher.id || voucher.code}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        opacity: voucher.isActive ? 1 : 0.75,
                        transition: 'var(--transition)'
                      }}
                    >
                      <div>
                        {/* Header: Code Pill & Discount % */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                letterSpacing: '1px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--primary)',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px dashed var(--primary)'
                              }}
                            >
                              {voucher.code}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 6px' }}
                              onClick={() => {
                                navigator.clipboard.writeText(voucher.code);
                                if (onShowToast) onShowToast(`Copied "${voucher.code}" to clipboard!`, 'success');
                              }}
                              title="Copy code"
                            >
                              <i className="fa-regular fa-copy"></i>
                            </button>
                          </div>

                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              background: 'var(--accent-light)',
                              color: 'var(--accent-hover)',
                              border: '1px solid var(--accent)'
                            }}
                          >
                            {voucher.discountPercent}% OFF
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {voucher.description || `${voucher.discountPercent}% off total guest bill`}
                        </p>

                        {/* Status Switch */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: 'var(--bg-subtle)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            Status:{' '}
                            <strong style={{ color: voucher.isActive ? 'var(--accent)' : '#94a3b8' }}>
                              {voucher.isActive ? 'Active (Live)' : 'Disabled'}
                            </strong>
                          </span>
                          <button
                            type="button"
                            className={`btn btn-sm ${voucher.isActive ? 'btn-ghost' : 'btn-secondary'}`}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              color: voucher.isActive ? 'var(--warning)' : 'var(--accent)'
                            }}
                            onClick={() => handleToggleVoucherStatus(voucher)}
                          >
                            {voucher.isActive ? 'Disable Code' : 'Enable Code'}
                          </button>
                        </div>

                        {/* Featured on Customer Homepage Banner Pill / Action */}
                        <div style={{ marginTop: '0.65rem' }}>
                          {voucher.isFeatured ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid #f59e0b',
                                color: 'var(--primary)',
                                fontSize: '0.74rem',
                                fontWeight: 800
                              }}
                            >
                              <i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i>
                              <span>Active Homepage Banner Offer</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleSetFeaturedVoucher(voucher.id)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                fontSize: '0.73rem',
                                color: 'var(--text-muted)',
                                border: '1px dashed var(--border-color)',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                              title="Set this discount as the primary offer on the customer storefront banner"
                            >
                              <i className="fa-regular fa-star"></i> Set as Hero Banner Offer
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--border-color)',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEditVoucherModal(voucher)}
                          title="Edit Voucher Rate & Description"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost text-danger"
                          onClick={() => handleDeleteVoucher(voucher)}
                          title="Delete Voucher"
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION 5: TABLE QR PLACARD GENERATOR                           */}
          {/* =============================================================== */}
          {activeStation === 'qr' && (
            <div>
              {/* Action Bar (Hidden during Print) */}
              <div
                className="qr-action-bar no-print"
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>Table QR Code Placard Generator</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Print elegant QR tent placards and place them on tables. Guests scan with phone camera to order directly.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePrintQr(false)}
                  >
                    <i className="fa-solid fa-print"></i> Print Table {selectedTableForQr} Card
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handlePrintQr(true)}
                  >
                    <i className="fa-solid fa-layer-group"></i> Print All 8 Table Cards
                  </button>
                </div>
              </div>

              {/* Table Switcher Bar (Hidden during Print) */}
              <div
                className="qr-table-selector-bar no-print"
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}
              >
                {RESTAURANT_TABLES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-sm ${selectedTableForQr === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedTableForQr(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Placard Container (Printable) */}
              <div className="qr-placards-print-wrapper">
                {qrPrintAll ? (
                  // Print all 8 table cards (one per page)
                  RESTAURANT_TABLES.map((table) => (
                    <div
                      key={table.id}
                      className="qr-placard-printable"
                      style={{
                        maxWidth: '420px',
                        margin: '0 auto 2.5rem',
                        background: '#ffffff',
                        color: '#0f172a',
                        borderRadius: '20px',
                        padding: '2.5rem 2rem',
                        boxShadow: 'var(--shadow-lg)',
                        border: '3px solid #1e293b',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
                        <div
                          style={{
                            background: '#ffffff',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '52px'
                          }}
                        >
                          <img
                            src="./images/logo.png"
                            alt="Bistro Logo"
                            style={{ height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      </div>

                      <h3 style={{ margin: '0 0 0.15rem', letterSpacing: '1.5px', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800 }}>
                        BISTRO
                      </h3>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                        GOOD FOOD &bull; GOOD MOOD
                      </div>

                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '1.25rem',
                          borderRadius: '16px',
                          border: '2px solid #e2e8f0',
                          display: 'inline-block',
                          marginBottom: '1.25rem'
                        }}
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                            `${appOrigin}/?table=${table.id}`
                          )}`}
                          alt={`Table ${table.id} QR Code`}
                          style={{ width: '210px', height: '210px', display: 'block' }}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: '1.75rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          letterSpacing: '1px',
                          marginBottom: '0.2rem'
                        }}
                      >
                        TABLE {table.id}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.85rem' }}>
                        {table.zone} &bull; Capacity: {table.capacity} Guests
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 1rem', lineHeight: 1.4 }}>
                        Scan this QR code with your smartphone camera to browse our live digital menu and order dishes directly to your table.
                      </p>

                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#64748b',
                          paddingTop: '0.75rem',
                          borderTop: '1px dashed #cbd5e1'
                        }}
                      >
                        Direct Link: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{appOrigin}/?table={table.id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  // Print single active table card
                  (() => {
                    const currentTable = RESTAURANT_TABLES.find(t => t.id === selectedTableForQr) || RESTAURANT_TABLES[0];
                    return (
                      <div
                        className="qr-placard-printable"
                        style={{
                          maxWidth: '420px',
                          margin: '0 auto 2.5rem',
                          background: '#ffffff',
                          color: '#0f172a',
                          borderRadius: '20px',
                          padding: '2.5rem 2rem',
                          boxShadow: 'var(--shadow-lg)',
                          border: '3px solid #1e293b',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '52px'
                            }}
                          >
                            <img
                              src="./images/logo.png"
                              alt="Bistro Logo"
                              style={{ height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        </div>

                        <h3 style={{ margin: '0 0 0.15rem', letterSpacing: '1.5px', color: '#0f172a', fontSize: '1.3rem', fontWeight: 800 }}>
                          BISTRO
                        </h3>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                          GOOD FOOD &bull; GOOD MOOD
                        </div>

                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            border: '2px solid #e2e8f0',
                            display: 'inline-block',
                            marginBottom: '1.25rem'
                          }}
                        >
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                              `${appOrigin}/?table=${currentTable.id}`
                            )}`}
                            alt={`Table ${currentTable.id} QR Code`}
                            style={{ width: '210px', height: '210px', display: 'block' }}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: '1.75rem',
                            fontWeight: 900,
                            color: '#0f172a',
                            letterSpacing: '1px',
                            marginBottom: '0.2rem'
                          }}
                        >
                          TABLE {currentTable.id}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.85rem' }}>
                          {currentTable.zone} &bull; Capacity: {currentTable.capacity} Guests
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 1rem', lineHeight: 1.4 }}>
                          Scan this QR code with your smartphone camera to browse our live digital menu and order dishes directly to your table.
                        </p>

                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#64748b',
                            paddingTop: '0.75rem',
                            borderTop: '1px dashed #cbd5e1'
                          }}
                        >
                          Direct Link: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{appOrigin}/?table={currentTable.id}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* STATION 6: SALES & BUSINESS ANALYTICS                           */}
          {/* =============================================================== */}
          {activeStation === 'analytics' && (() => {
            // Filter orders by date range
            const filteredSalesOrders = orders.filter((o) => {
              if (!o.timestamp) return true;
              const orderDate = new Date(o.timestamp);
              const now = new Date();
              if (salesDateFilter === 'today') {
                return (
                  orderDate.getDate() === now.getDate() &&
                  orderDate.getMonth() === now.getMonth() &&
                  orderDate.getFullYear() === now.getFullYear()
                );
              }
              if (salesDateFilter === '7days') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= sevenDaysAgo;
              }
              if (salesDateFilter === 'month') {
                return (
                  orderDate.getMonth() === now.getMonth() &&
                  orderDate.getFullYear() === now.getFullYear()
                );
              }
              return true; // 'all'
            }).filter((o) => {
              if (!salesSearchQuery) return true;
              const q = salesSearchQuery.toLowerCase();
              return (
                (o.id || '').toLowerCase().includes(q) ||
                (o.customerName || '').toLowerCase().includes(q) ||
                (o.phone || '').includes(q)
              );
            });

            const salesGross = filteredSalesOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
            const salesCount = filteredSalesOrders.length;
            const salesAOV = salesCount > 0 ? salesGross / salesCount : 0;
            const salesDiscounts = filteredSalesOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

            const salesKhqr = filteredSalesOrders.filter((o) => o.paymentMethod === 'khqr');
            const salesKhqrAmount = salesKhqr.reduce((sum, o) => sum + Number(o.total || 0), 0);
            const salesCash = filteredSalesOrders.filter((o) => o.paymentMethod === 'cash');
            const salesCashAmount = salesCash.reduce((sum, o) => sum + Number(o.total || 0), 0);
            const salesCard = filteredSalesOrders.filter((o) => o.paymentMethod !== 'khqr' && o.paymentMethod !== 'cash');
            const salesCardAmount = salesCard.reduce((sum, o) => sum + Number(o.total || 0), 0);

            // Aggregate item sales
            const dishSalesMap = {};
            filteredSalesOrders.forEach((o) => {
              (o.items || []).forEach((item) => {
                const name = item.name || 'Unknown Item';
                if (!dishSalesMap[name]) {
                  dishSalesMap[name] = { name, count: 0, revenue: 0, price: item.price };
                }
                dishSalesMap[name].count += Number(item.quantity || 1);
                dishSalesMap[name].revenue += Number(item.price || 0) * Number(item.quantity || 1);
              });
            });
            const topDishes = Object.values(dishSalesMap).sort((a, b) => b.count - a.count);

            return (
              <div className="sales-report-printable">
                {/* Header Strip with Date Filter Pills & Print Report Button */}
                <div
                  className="no-print"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>Sales &amp; Financial Performance</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Audited revenue metrics, payment channel breakdown, and transaction ledger.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Time Filter Pills */}
                    <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
                      {[
                        { id: 'today', label: 'Today' },
                        { id: '7days', label: '7 Days' },
                        { id: 'month', label: 'This Month' },
                        { id: 'all', label: 'All Time' }
                      ].map((tf) => (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() => setSalesDateFilter(tf.id)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: salesDateFilter === tf.id ? 'var(--primary)' : 'transparent',
                            color: salesDateFilter === tf.id ? '#ffffff' : 'var(--text-muted)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handlePrintSalesReport}
                      style={{ gap: '0.4rem' }}
                    >
                      <i className="fa-solid fa-print"></i> Print Sales Report
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleExportCsv(filteredSalesOrders)}
                      style={{
                        gap: '0.4rem',
                        background: '#10b981',
                        borderColor: '#10b981',
                        color: '#ffffff'
                      }}
                      title="Download full audited order ledger as CSV / Excel"
                    >
                      <i className="fa-solid fa-file-excel"></i> Export CSV / Excel
                    </button>
                  </div>
                </div>

                {/* Print Title Only Visible on Paper */}
                <div style={{ display: 'none' }} className="print-header-block">
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>BISTRO &bull; FINANCIAL SALES REPORT</h2>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Period: {salesDateFilter.toUpperCase()} &bull; Generated: {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 4 Financial KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* 1. Gross Revenue */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>GROSS SALES</span>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-dollar-sign"></i>
                      </span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', margin: '0.4rem 0 0.2rem' }}>
                      ${salesGross.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total sales volume for selected range
                    </div>
                  </div>

                  {/* 2. Orders & Average Order Value */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ORDER VOLUME</span>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-receipt"></i>
                      </span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.2rem' }}>
                      {salesCount} Orders
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Avg. Ticket: <strong>${salesAOV.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* 3. Bakong KHQR Settled */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>BAKONG KHQR</span>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.12)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-qrcode"></i>
                      </span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e11d48', margin: '0.4rem 0 0.2rem' }}>
                      ${salesKhqrAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {salesGross > 0 ? Math.round((salesKhqrAmount / salesGross) * 100) : 0}% of revenue &bull; {salesKhqr.length} orders
                    </div>
                  </div>

                  {/* 4. Cash at Counter */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CASH COLLECTED</span>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-money-bill-wave"></i>
                      </span>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', margin: '0.4rem 0 0.2rem' }}>
                      ${salesCashAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {salesGross > 0 ? Math.round((salesCashAmount / salesGross) * 100) : 0}% of revenue &bull; {salesCash.length} orders
                    </div>
                  </div>
                </div>

                {/* Split: Payment Methods Breakdown & Top Selling Dishes */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  {/* Payment Breakdown Card */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '1.5rem'
                    }}
                  >
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-wallet" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                      Payment Channel Distribution
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* KHQR Meter */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span>
                            <i className="fa-solid fa-qrcode" style={{ color: '#e11d48', marginRight: '0.3rem' }}></i>
                            Bakong KHQR (NBC Settled)
                          </span>
                          <span>${salesKhqrAmount.toFixed(2)} ({salesGross > 0 ? Math.round((salesKhqrAmount / salesGross) * 100) : 0}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${salesGross > 0 ? (salesKhqrAmount / salesGross) * 100 : 0}%`, height: '100%', background: '#e11d48', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Cash Meter */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span>
                            <i className="fa-solid fa-money-bill-wave" style={{ color: 'var(--accent)', marginRight: '0.3rem' }}></i>
                            Cash at Register
                          </span>
                          <span>${salesCashAmount.toFixed(2)} ({salesGross > 0 ? Math.round((salesCashAmount / salesGross) * 100) : 0}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${salesGross > 0 ? (salesCashAmount / salesGross) * 100 : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Card / COD Meter */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span>
                            <i className="fa-solid fa-credit-card" style={{ color: '#3b82f6', marginRight: '0.3rem' }}></i>
                            Credit / Debit Cards
                          </span>
                          <span>${salesCardAmount.toFixed(2)} ({salesGross > 0 ? Math.round((salesCardAmount / salesGross) * 100) : 0}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${salesGross > 0 ? (salesCardAmount / salesGross) * 100 : 0}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                      {/* Promo Discounts Given */}
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span>
                          <i className="fa-solid fa-tags" style={{ color: 'var(--primary)', marginRight: '0.35rem' }}></i>
                          Voucher Discounts Given:
                        </span>
                        <strong style={{ color: 'var(--primary)' }}>-${salesDiscounts.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Top Selling Dishes Ranking */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '1.5rem'
                    }}
                  >
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>
                      <i className="fa-solid fa-fire" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                      Top Selling Dishes (Ranked by Quantity)
                    </h4>

                    {topDishes.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                        No dish order data for this range.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {topDishes.slice(0, 5).map((dish, idx) => (
                          <div
                            key={dish.name}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0.6rem',
                              borderBottom: '1px solid var(--border-color)',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: idx === 0 ? 'var(--primary)' : 'var(--bg-subtle)',
                                  color: idx === 0 ? '#fff' : 'var(--text-muted)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}
                              >
                                {idx + 1}
                              </span>
                              <strong>{dish.name}</strong>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div>
                                <strong>{dish.count} sold</strong>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                ${dish.revenue.toFixed(2)} total
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Transactions Ledger Table */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                        <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                        Order Transactions Ledger ({filteredSalesOrders.length} records)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Detailed transaction log with instant 80mm receipt reprint
                      </span>
                    </div>

                    <div className="no-print">
                      <input
                        type="text"
                        placeholder="Filter by Order ID or guest..."
                        value={salesSearchQuery}
                        onChange={(e) => setSalesSearchQuery(e.target.value)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          color: 'var(--text-main)',
                          width: '220px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Guest</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Items</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }} className="no-print">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSalesOrders.length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No orders found for the selected time filter.
                            </td>
                          </tr>
                        ) : (
                          filteredSalesOrders.map((o) => (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                                {o.id}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                {o.customerName || 'Walk-in'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: o.diningMode === 'dine-in' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                    color: o.diningMode === 'dine-in' ? '#2563eb' : 'var(--primary)',
                                    fontWeight: 700
                                  }}
                                >
                                  {o.diningMode === 'dine-in' ? `Table ${o.tableNumber || '01'}` : 'Takeaway'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'N/A'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                                  {o.paymentMethod === 'khqr' ? 'Bakong KHQR' : String(o.paymentMethod || 'CASH').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                ${Number(o.total || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: o.status === 'ready' ? 'var(--accent-light)' : 'rgba(245, 158, 11, 0.15)',
                                    color: o.status === 'ready' ? 'var(--accent-hover)' : 'var(--primary)'
                                  }}
                                >
                                  {o.status}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} className="no-print">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setSelectedReceiptOrder(o)}
                                  title="Print 80mm Guest Bill / Receipt"
                                  style={{ gap: '0.35rem', padding: '3px 8px', fontSize: '0.75rem' }}
                                >
                                  <i className="fa-solid fa-receipt"></i> Print
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
            </>
          )}
        </main>
      </div>

      {/* Dish Add/Edit Modal (Permission protected) */}
      <DishFormModal
        isOpen={isModalOpen && Boolean(permissions?.canEditMenu)}
        onClose={() => setIsModalOpen(false)}
        editingDish={editingDish}
        onShowToast={onShowToast}
      />

      {/* Category Add/Edit Modal (Permission protected) */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen && Boolean(permissions?.canEditCategories)}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onShowToast={onShowToast}
      />

      {/* Voucher Add/Edit Modal (Permission protected) */}
      <VoucherFormModal
        isOpen={isVoucherModalOpen && Boolean(permissions?.canEditDiscounts)}
        onClose={() => setIsVoucherModalOpen(false)}
        editingVoucher={editingVoucher}
        onSaveSuccess={handleSaveVoucherSuccess}
        onShowToast={onShowToast}
      />

      {/* Order Receipt Modal for Printing Receipts in Admin */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
        isAdminView={true}
      />

      {/* Clean Custom Confirmation & Alert Dialog (Replaces native browser alert/confirm) */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        confirmVariant={dialogConfig.confirmVariant}
        icon={dialogConfig.icon}
        isAlert={dialogConfig.isAlert}
        onConfirm={dialogConfig.onConfirm}
        onCancel={closeConfirmDialog}
      />
    </div>
  );
}
