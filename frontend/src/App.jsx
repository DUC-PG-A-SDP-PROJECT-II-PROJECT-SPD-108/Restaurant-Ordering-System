import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import Navbar from './components/Navbar';
import CustomerMenu from './pages/CustomerMenu';
import TrackOrder from './pages/TrackOrder';
import KitchenDashboard from './pages/KitchenDashboard';
import CheckoutModal from './components/CheckoutModal';
import OrderReceiptModal from './components/OrderReceiptModal';
import Toast from './components/Toast';

function AppContent() {
  const [currentView, setCurrentView] = useState('customer-view');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
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

  const handleOrderPlaced = (newOrder) => {
    setReceiptOrder(newOrder);
  };

  const handleTrackFromReceipt = (order) => {
    setCurrentView('tracker-view');
  };

  return (
    <>
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenCart={() => setIsMobileCartOpen(true)}
      />

      {/* Main Views Container */}
      <main className="main-content" id="app-container">
        {currentView === 'customer-view' && (
          <CustomerMenu
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onShowToast={showToast}
            isMobileCartOpen={isMobileCartOpen}
            onCloseMobileCart={() => setIsMobileCartOpen(false)}
          />
        )}

        {currentView === 'tracker-view' && (
          <TrackOrder
            onGoToMenu={() => setCurrentView('customer-view')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'kitchen-view' && (
          <KitchenDashboard onShowToast={showToast} />
        )}
      </main>

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

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <OrderProvider>
        <AppContent />
      </OrderProvider>
    </CartProvider>
  );
}
