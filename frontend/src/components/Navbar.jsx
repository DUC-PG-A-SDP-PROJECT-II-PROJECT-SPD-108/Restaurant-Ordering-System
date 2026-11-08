import React from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentView, setCurrentView, theme, toggleTheme, onOpenCart, onOpenCallWaiter }) {
  const { summary, diningMode, setDiningMode } = useCart();
  const { activeOrders } = useOrders();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="navbar" id="main-navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <div
          className="brand-logo"
          id="brand-logo"
          onClick={() => setCurrentView('customer-view')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div
            className="logo-icon"
            style={{
              background: '#ffffff',
              padding: '4px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
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
          <div className="logo-text">
            <span className="brand-name">Bistro</span>
            <span className="brand-subtitle">{t('brandSubtitle')}</span>
          </div>
        </div>

        {/* Customer Navigation Tabs ONLY (Zero Admin/Kitchen tabs) */}
        <nav className="nav-links" id="nav-navigation">
          <button
            className={`nav-tab ${currentView === 'customer-view' ? 'active' : ''}`}
            onClick={() => setCurrentView('customer-view')}
          >
            <i className="fa-solid fa-book-open"></i> <span>{t('menuOrder')}</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'tracker-view' ? 'active' : ''}`}
            onClick={() => setCurrentView('tracker-view')}
          >
            <i className="fa-solid fa-clock-rotate-left"></i> <span>{t('liveTracker')}</span>
            {activeOrders.length > 0 && (
              <span className="badge active-orders-badge">{activeOrders.length}</span>
            )}
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="nav-actions">
          {/* Customer Dining Mode Selector */}
          <div className="dining-mode-selector" id="dining-mode-container">
            <button
              className={`mode-pill ${diningMode === 'dine-in' ? 'active' : ''}`}
              onClick={() => setDiningMode('dine-in')}
            >
              <i className="fa-solid fa-champagne-glasses"></i> {t('dineIn')}
            </button>
            <button
              className={`mode-pill ${diningMode === 'takeout' ? 'active' : ''}`}
              onClick={() => setDiningMode('takeout')}
            >
              <i className="fa-solid fa-bag-shopping"></i> {t('takeaway')}
            </button>
          </div>

          {/* Language Switcher Pill (Khmer / English) */}
          <button
            type="button"
            className="icon-button"
            onClick={toggleLanguage}
            title={language === 'en' ? 'ប្តូរទៅភាសាខ្មែរ (Switch to Khmer)' : 'Switch to English'}
            style={{
              fontWeight: 800,
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 10px',
              width: 'auto',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <span>{language === 'en' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN'}</span>
          </button>

          {/* Call Staff Button (Customer Portal) */}
          {onOpenCallWaiter && (
            <button
              type="button"
              className="icon-button"
              onClick={onOpenCallWaiter}
              title="Call Staff / Service Request (ហៅបុគ្គលិក)"
              style={{ color: 'var(--primary)', position: 'relative' }}
            >
              <i className="fa-solid fa-bell-concierge"></i>
            </button>
          )}

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

          {/* Customer Cart Trigger */}
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
