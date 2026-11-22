import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function CartPage({ onOpenCheckout, onGoToMenu, onShowToast }) {
  const {
    items,
    summary,
    updateQuantity,
    removeItem,
    updateItemDiningType,
    applyPromoCode,
    removePromoCode,
    promoCode,
    discountPercent,
    tableNumber,
    clearCart
  } = useCart();
  const { t, language } = useLanguage();

  const [promoInput, setPromoInput] = useState('');

  const handleClearAllCart = () => {
    if (window.confirm(language === 'kh' ? 'តើអ្នកប្រាកដជាចង់សម្អាតមុខម្ហូបទាំងអស់ក្នុងកន្ត្រកមែនទេ?' : 'Are you sure you want to clear all items in your cart?')) {
      clearCart();
      if (onShowToast) {
        onShowToast(language === 'kh' ? 'បានសម្អាតកន្ត្រកជោគជ័យ' : 'Cart cleared successfully', 'info');
      }
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (onShowToast) {
      onShowToast(res.message, res.success ? 'success' : 'warning');
    }
    if (res.success) setPromoInput('');
  };

  const handleRemovePromo = () => {
    removePromoCode();
    if (onShowToast) {
      onShowToast('Promo code removed', 'info');
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="cart-page-empty-container" style={{ textAlign: 'center', padding: '4rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.5rem'
          }}
        >
          <i className="fa-solid fa-cart-shopping"></i>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
          {language === 'kh' ? 'កន្ត្រករបស់អ្នកទទេស្អាត' : 'Your Dining Cart is Empty'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.98rem', lineHeight: 1.6 }}>
          {language === 'kh'
            ? 'អ្នកមិនទាន់បានជ្រើសរើសមុខម្ហូបណាមួយចូលក្នុងកន្ត្រកនៅឡើយទេ។ សូមចូលទៅកាន់ Menu ដើម្បីរើសមុខម្ហូបឈ្ងុយឆ្ងាញ់របស់យើង!'
            : "Looks like you haven't added anything to your cart yet. Explore our handcrafted menu to discover signature dishes and drinks!"}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGoToMenu}
          style={{
            padding: '0.85rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <i className="fa-solid fa-utensils"></i>
          <span>{language === 'kh' ? 'មើលមុខម្ហូប (Menu)' : 'Explore Menu'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {/* Top Header */}
      <div className="cart-page-header">
        <div>
          <button
            type="button"
            onClick={onGoToMenu}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '0.35rem',
              padding: 0
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>{language === 'kh' ? 'ត្រឡប់ទៅ Menu' : 'Back to Menu'}</span>
          </button>
          <h1 className="cart-page-title" style={{ fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span>{language === 'kh' ? 'កន្ត្រកកុម្ម៉ង់អាហារ' : 'Your Order Cart'}</span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        <div className="cart-page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Clear All Cart Button */}
          <button
            type="button"
            onClick={handleClearAllCart}
            title={language === 'kh' ? 'សម្អាតកន្ត្រកទាំងអស់' : 'Clear All Cart Items'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.28)',
              color: '#dc2626',
              padding: '0.38rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.color = '#dc2626';
            }}
          >
            <i className="fa-regular fa-trash-can"></i>
            <span>{language === 'kh' ? 'សម្អាតកន្ត្រក' : 'Clear All Cart'}</span>
          </button>

          {tableNumber && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '0.38rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              <i className="fa-solid fa-chair"></i>
              <span>{language === 'kh' ? `តុលេខ #${tableNumber}` : `Table #${tableNumber} Active`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Two Column Split */}
      <div className="cart-page-split">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-column">
          {items.map((item) => {
            const currentDiningType = item.diningType || 'dine-in';
            const itemTotal = (item.unitPrice * item.quantity).toFixed(2);

            return (
              <div
                key={item.itemKey}
                className="cart-page-item-card"
              >
                {/* Small Image */}
                <div
                  className="cart-item-img-wrapper"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <img
                    src={item.image || './images/logo.png'}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = './images/logo.png';
                    }}
                  />
                </div>

                {/* Dish Info */}
                <div className="cart-item-info" style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: 'var(--text-main)' }}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Customizations / Notes */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {item.spiceLevel && <span>Spice: {item.spiceLevel}</span>}
                    {item.addOns && item.addOns.length > 0 && (
                      <span> &bull; Extras: {item.addOns.map((a) => a.name).join(', ')}</span>
                    )}
                    {item.note && <div style={{ fontStyle: 'italic', marginTop: '2px' }}>"{item.note}"</div>}
                  </div>

                  {/* Price & Per-Item Dine-In/Takeaway Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Original: <strong style={{ color: 'var(--text-main)' }}>${item.unitPrice.toFixed(2)}</strong>
                    </div>

                    {/* Per-Item Dine-In / Takeaway Toggle with High Contrast Focus Colors */}
                    <div
                      style={{
                        display: 'inline-flex',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        border: '1px solid var(--border-color)',
                        gap: '2px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateItemDiningType(item.itemKey, 'dine-in')}
                        title="Enjoy dine-in at table"
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                          background: currentDiningType === 'dine-in' ? '#f59e0b' : 'transparent',
                          color: currentDiningType === 'dine-in' ? '#ffffff' : 'var(--text-muted)',
                          boxShadow: currentDiningType === 'dine-in' ? '0 2px 6px rgba(245, 158, 11, 0.35)' : 'none'
                        }}
                      >
                        <i className="fa-solid fa-champagne-glasses"></i>
                        <span>Dine-In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateItemDiningType(item.itemKey, 'takeout')}
                        title="Pack for takeaway"
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                          background: currentDiningType === 'takeout' ? '#3b82f6' : 'transparent',
                          color: currentDiningType === 'takeout' ? '#ffffff' : 'var(--text-muted)',
                          boxShadow: currentDiningType === 'takeout' ? '0 2px 6px rgba(59, 130, 246, 0.35)' : 'none'
                        }}
                      >
                        <i className="fa-solid fa-bag-shopping"></i>
                        <span>Takeaway</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Controls, Subtotal, Remove */}
                <div
                  className="cart-item-actions-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginLeft: 'auto',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                  }}
                >
                  {/* Quantity Stepper */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '2px 4px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.itemKey, -1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '3px 7px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                      title="Decrease quantity"
                    >
                      <i className="fa-solid fa-minus"></i>
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.itemKey, 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '3px 7px',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                      title="Increase quantity"
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>

                  {/* Calculated Price x Qty */}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${itemTotal}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      ${item.unitPrice.toFixed(2)} &times; {item.quantity}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.itemKey)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove item"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="cart-summary-column">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--text-main)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            {language === 'kh' ? 'សង្ខេបការបញ្ជាទិញ' : 'Order Summary'}
          </h2>

          {/* Promo Code Input */}
          <form onSubmit={handleApplyPromo} style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {language === 'kh' ? 'លេខកូដបញ្ចុះតម្លៃ (Voucher / Promo Code)' : 'Promo / Voucher Code'}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.85rem',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ padding: '0 1rem', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Apply
              </button>
            </div>
            {promoCode && (
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: '#10b981'
                }}
              >
                <span>
                  <i className="fa-solid fa-tag"></i> <strong>{promoCode}</strong> ({discountPercent}% applied)
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                >
                  &times;
                </button>
              </div>
            )}
          </form>

          {/* Breakdown Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>{t('subtotal') || 'Subtotal'}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${summary.subtotal.toFixed(2)}</span>
            </div>

            {summary.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>{t('voucherDiscount') || 'Discount'} ({summary.discountPercent}%)</span>
                <span style={{ fontWeight: 700 }}>-${summary.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>{t('vatTax') || 'VAT Tax (10%)'}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${summary.tax.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>{t('serviceFee') || 'Service Fee (5%)'}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${summary.serviceFee.toFixed(2)}</span>
            </div>

            <div
              style={{
                borderTop: '2px dashed var(--border-color)',
                paddingTop: '0.85rem',
                marginTop: '0.4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {t('grandTotal') || 'Grand Total'}
              </span>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)' }}>
                ${summary.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout CTA Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCheckout}
            style={{
              width: '100%',
              padding: '0.95rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}
          >
            <span>{language === 'kh' ? 'បន្តទៅការទូទាត់' : 'Proceed to Checkout'}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
