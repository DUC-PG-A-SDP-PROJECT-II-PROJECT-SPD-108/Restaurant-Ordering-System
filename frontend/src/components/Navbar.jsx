import React from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';

export default function Navbar({ currentView, setCurrentView, theme, toggleTheme, onOpenCart }) {
  const { summary, diningMode, setDiningMode } = useCart();
  const { activeOrders, kdsStats } = useOrders();

  return (
    <header className="navbar" id="main-navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <div className="brand-logo" id="brand-logo" onClick={() => setCurrentView('customer-view')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div className="logo-text">
            <span className="brand-name">Aura Bistro</span>
            <span className="brand-subtitle">Gourmet Dining &amp; Ordering</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links" id="nav-navigation">
          <button
            className={`nav-tab ${currentView === 'customer-view' ? 'active' : ''}`}
            onClick={() => setCurrentView('customer-view')}
          >
            <i className="fa-solid fa-book-open"></i> <span>Menu &amp; Order</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'tracker-view' ? 'active' : ''}`}
            onClick={() => setCurrentView('tracker-view')}
          >
            <i className="fa-solid fa-clock-rotate-left"></i> <span>Live Tracker</span>
            {activeOrders.length > 0 && (
              <span className="badge active-orders-badge">{activeOrders.length}</span>
            )}
          </button>
          <button
            className={`nav-tab ${currentView === 'kitchen-view' ? 'active' : ''}`}
            onClick={() => setCurrentView('kitchen-view')}
          >
            <i className="fa-solid fa-fire-burner"></i> <span>Kitchen KDS</span>
            {kdsStats.pending > 0 && (
              <span className="badge kitchen-badge">{kdsStats.pending}</span>
            )}
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="nav-actions">
          {/* Dining Mode Indicator */}
          <div className="dining-mode-selector" id="dining-mode-container">
            <button
              className={`mode-pill ${diningMode === 'dine-in' ? 'active' : ''}`}
              onClick={() => setDiningMode('dine-in')}
            >
              <i className="fa-solid fa-champagne-glasses"></i> Dine-In
            </button>
            <button
              className={`mode-pill ${diningMode === 'takeout' ? 'active' : ''}`}
              onClick={() => setDiningMode('takeout')}
            >
              <i className="fa-solid fa-bag-shopping"></i> Takeaway
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            className="icon-button"
            id="theme-toggle-btn"
            aria-label="Toggle Theme"
            title="Switch Theme"
            onClick={toggleTheme}
          >
            <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
          </button>

          {/* Cart Quick Trigger Button */}
          <button
            className="cart-trigger-btn"
            id="open-cart-btn"
            aria-label="Open Shopping Cart"
            onClick={onOpenCart}
          >
            <div className="cart-icon-wrapper">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge" id="nav-cart-count">
                {summary.itemCount}
              </span>
            </div>
            <span className="cart-total-preview" id="nav-cart-total">
              ${summary.total.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
