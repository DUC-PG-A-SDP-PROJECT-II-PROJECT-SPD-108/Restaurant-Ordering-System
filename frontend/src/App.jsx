import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import BottomNavBar from './components/BottomNavBar';
import CustomerMenu from './pages/CustomerMenu';
import TrackOrder from './pages/TrackOrder';
import CartPage from './pages/CartPage';
import AdminMenu from './pages/AdminMenu';
import Login from './pages/Login';
import CheckoutModal from './components/CheckoutModal';
import OrderReceiptModal from './components/OrderReceiptModal';
import CallWaiterModal from './components/CallWaiterModal';
import Toast from './components/Toast';

/**
 * Customer Web Application (Zero Admin / Kitchen elements)
 * URL: /
 */
function CustomerPortal({ showToast, theme, toggleTheme }) {
  const [currentView, setCurrentView] = useState('customer-view');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);

  const handleOrderPlaced = (newOrder) => {
    setReceiptOrder(newOrder);
  };

  const handleTrackFromReceipt = () => {
    setCurrentView('tracker-view');
  };

  return (
    <>
      {/* Customer Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenCart={() => setCurrentView('cart-view')}
        onOpenCallWaiter={() => setIsCallWaiterOpen(true)}
      />

      {/* Main Views Container */}
      <main className="main-content" id="app-container">
        {currentView === 'customer-view' && (
          <CustomerMenu
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onViewCart={() => setCurrentView('cart-view')}
            onShowToast={showToast}
            isMobileCartOpen={isMobileCartOpen}
            onOpenMobileCart={() => setCurrentView('cart-view')}
            onCloseMobileCart={() => setIsMobileCartOpen(false)}
          />
        )}

        {currentView === 'tracker-view' && (
          <TrackOrder
            onGoToMenu={() => setCurrentView('customer-view')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'cart-view' && (
          <CartPage
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onGoToMenu={() => setCurrentView('customer-view')}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on phone/tablet screens) */}
      <BottomNavBar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Table Service Call Waiter Modal */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        onShowToast={showToast}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Order Receipt Modal */}
      <OrderReceiptModal
        order={receiptOrder}
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        onTrackOrder={handleTrackFromReceipt}
      />
    </>
  );
}

/**
 * Dedicated Admin Login Portal
 * URL: /admin-panel-bistro-login
 */
function AdminLoginPortal({ showToast }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-app)'
      }}
    >
      <Login
        onSuccess={() => {
          showToast('Signed in to Bistro Admin Panel', 'success');
          navigate('/admin-panel-bistro', { replace: true });
        }}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}

/**
 * Dedicated Admin Management Console
 * URL: /admin-panel-bistro
 * Protected route: If not authenticated, redirects to /admin-panel-bistro-login.
 */
function AdminPortal({ showToast, theme, toggleTheme }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/admin-panel-bistro-login" replace />;
  }

  return (
    <AdminMenu
      onShowToast={showToast}
      onGoToCustomerWeb={() => navigate('/')}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

function AppContent() {
  const [toasts, setToasts] = useState([]);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('aura_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('aura_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Storefront (Root URL: /) */}
        <Route
          path="/"
          element={
            <CustomerPortal
              showToast={showToast}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          }
        />

        {/* Dedicated Admin Portal (URL: /admin-panel-bistro) */}
        <Route
          path="/admin-panel-bistro"
          element={
            <AdminPortal
              showToast={showToast}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          }
        />
        <Route
          path="/admin-panel-bistro/*"
          element={
            <AdminPortal
              showToast={showToast}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          }
        />

        {/* Dedicated Admin Login (URL: /admin-panel-bistro-login) */}
        <Route
          path="/admin-panel-bistro-login"
          element={
            <AdminLoginPortal
              showToast={showToast}
            />
          }
        />

        {/* Backward Compatibility Redirects */}
        <Route path="/admin" element={<Navigate to="/admin-panel-bistro" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin-panel-bistro" replace />} />
        <Route path="/login" element={<Navigate to="/admin-panel-bistro-login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/admin-panel-bistro-login" replace />} />

        {/* Any unknown URL falls back to Customer View */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MenuProvider>
          <CartProvider>
            <OrderProvider>
              <AppContent />
            </OrderProvider>
          </CartProvider>
        </MenuProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
