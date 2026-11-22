import React from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNavBar({ currentView, setCurrentView }) {
  const { summary } = useCart();
  const { activeOrders } = useOrders();
  const { t, language } = useLanguage();

  return (
    <nav className="mobile-bottom-nav-bar" aria-label="Mobile Bottom Navigation">
      {/* 1. Menu Tab */}
      <button
        type="button"
        className={`bottom-nav-item ${currentView === 'customer-view' ? 'active' : ''}`}
        onClick={() => setCurrentView('customer-view')}
        aria-label="Menu"
      >
        <div className="bottom-nav-icon-wrapper">
          <i className="fa-solid fa-book-open"></i>
        </div>
        <span className="bottom-nav-label">{t('menuOrder') || 'Menu'}</span>
      </button>

      {/* 2. Cart Tab (Center) */}
      <button
        type="button"
        className={`bottom-nav-item ${currentView === 'cart-view' ? 'active' : ''}`}
        onClick={() => setCurrentView('cart-view')}
        aria-label="Cart"
      >
        <div className="bottom-nav-icon-wrapper">
          <i className="fa-solid fa-cart-shopping"></i>
          {summary.itemCount > 0 && (
            <span className="bottom-nav-badge cart-badge-highlight">{summary.itemCount}</span>
          )}
        </div>
        <span className="bottom-nav-label">{language === 'kh' ? 'កន្ត្រក' : 'Cart'}</span>
      </button>

      {/* 3. Tracker Tab */}
      <button
        type="button"
        className={`bottom-nav-item ${currentView === 'tracker-view' ? 'active' : ''}`}
        onClick={() => setCurrentView('tracker-view')}
        aria-label="Live Tracker"
      >
        <div className="bottom-nav-icon-wrapper">
          <i className="fa-solid fa-clock-rotate-left"></i>
          {activeOrders.length > 0 && (
            <span className="bottom-nav-badge">{activeOrders.length}</span>
          )}
        </div>
        <span className="bottom-nav-label">{t('liveTracker') || 'Tracker'}</span>
      </button>
    </nav>
  );
}
