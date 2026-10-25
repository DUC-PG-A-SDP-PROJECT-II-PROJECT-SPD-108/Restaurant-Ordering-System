import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function CartSidebar({ onOpenCheckout, isOpen, onCloseDrawer, onShowToast }) {
  const {
    items,
    summary,
    diningMode,
    tableNumber,
    setTableNumber,
    updateQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyPromoCode(couponInput);
    setCouponStatus(res);
    if (onShowToast) {
      onShowToast(res.message, res.success ? 'success' : 'warning');
    }
  };

  const handleRemoveCoupon = () => {
    removePromoCode();
    setCouponInput('');
    setCouponStatus(null);
    if (onShowToast) {
      onShowToast('Voucher removed', 'info');
    }
  };

  return (
    <aside
      className={`cart-sidebar ${isOpen ? 'open' : ''}`}
      id="desktop-cart-sidebar"
    >
      <div className="cart-sidebar-card">
        {/* Header */}
        <div className="cart-card-header">
          <div className="cart-title-wrap">
            <i className="fa-solid fa-receipt"></i>
            <h3>Current Order</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {items.length > 0 && (
              <button
                className="btn-text-danger"
                id="clear-cart-btn"
                title="Clear all items"
                onClick={clearCart}
              >
                <i className="fa-regular fa-trash-can"></i> Clear
              </button>
            )}
            {onCloseDrawer && (
              <button
                className="modal-close-btn"
                onClick={onCloseDrawer}
                style={{ position: 'static', transform: 'none' }}
                title="Close Cart"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* Dining Details Configuration */}
        <div className="order-context-box">
          <div className="context-item">
            <span className="context-label">Mode:</span>
            <span className="context-value" id="cart-dining-mode-text">
              {diningMode === 'dine-in' ? 'Dine-In' : 'Takeaway Pickup'}
            </span>
          </div>

          {diningMode === 'dine-in' && (
            <div className="context-item" id="table-select-row">
              <label htmlFor="table-number-select" className="context-label">
                Table #:
              </label>
              <select
                id="table-number-select"
                className="context-select"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              >
                <option value="01">Table 01 (Patio)</option>
                <option value="02">Table 02 (Window)</option>
                <option value="03">Table 03 (Booth)</option>
                <option value="04">Table 04 (Main Hall)</option>
                <option value="05">Table 05 (VIP Lounge)</option>
              </select>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="cart-items-scrollable" id="cart-items-container">
          {items.length === 0 ? (
            <div className="empty-cart-view">
              <i className="fa-solid fa-basket-shopping"></i>
              <h4>Your cart is empty</h4>
              <p>Add mouthwatering dishes from our menu to start your order.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.itemKey} className="cart-item-row">
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-customizations">
                    <span>{item.spiceLevel}</span>
                    {item.addOns.length > 0 && (
                      <> &bull; +{item.addOns.map((a) => a.name).join(', ')}</>
                    )}
                    {item.note && (
                      <>
                        <br />
                        <em style={{ color: 'var(--warning)' }}>Note: "{item.note}"</em>
                      </>
                    )}
                  </div>
                  <div className="cart-item-price">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div className="cart-qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.itemKey, -1)}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.itemKey, 1)}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Calculation */}
        <div className="cart-summary-section">
          {/* Promo code input */}
          <div className="coupon-box">
            <form onSubmit={handleApplyCoupon} className="coupon-input-group">
              <input
                type="text"
                id="coupon-input"
                placeholder="Promo code (AURAVIP15)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <button type="submit" className="btn btn-dark-sm" id="apply-coupon-btn">
                Apply
              </button>
            </form>
            {summary.promoCode && (
              <div
                className="coupon-status success"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.4rem',
                  fontSize: '0.78rem',
                  color: 'var(--success)'
                }}
              >
                <span>
                  <i className="fa-solid fa-circle-check"></i> Code "{summary.promoCode}" applied (-{summary.discountPercent}%)
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            {couponStatus && !couponStatus.success && (
              <div
                className="coupon-status error"
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.78rem',
                  color: 'var(--danger)'
                }}
              >
                <i className="fa-solid fa-circle-exclamation"></i> {couponStatus.message}
              </div>
            )}
          </div>

          {/* Bill breakdown */}
          <div className="bill-breakdown">
            <div className="bill-row">
              <span>Subtotal</span>
              <span id="bill-subtotal">${summary.subtotal.toFixed(2)}</span>
            </div>

            {summary.discountAmount > 0 && (
              <div className="bill-row discount-row" id="bill-discount-row">
                <span>
                  Discount (<span id="discount-percent-label">{summary.discountPercent}%</span>)
                </span>
                <span id="bill-discount" className="text-success">
                  -${summary.discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="bill-row">
              <span>Tax (10% VAT)</span>
              <span id="bill-tax">${summary.tax.toFixed(2)}</span>
            </div>

            <div className="bill-row">
              <span>Service Fee (5%)</span>
              <span id="bill-service">${summary.serviceFee.toFixed(2)}</span>
            </div>

            <div className="bill-divider"></div>

            <div className="bill-row total-row">
              <span>Total Amount</span>
              <span className="total-price-tag" id="bill-total">
                ${summary.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            className="btn btn-primary btn-block checkout-submit-btn"
            id="proceed-checkout-btn"
            disabled={items.length === 0}
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              onOpenCheckout();
            }}
          >
            <span>Proceed to Checkout</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
