import React from 'react';
import { useCart } from '../context/CartContext';

export default function HeroBanner({ onShowToast }) {
  const { applyPromoCode, diningMode, tableNumber } = useCart();

  const handleApplyVoucher = () => {
    const res = applyPromoCode('AURAVIP15');
    if (onShowToast) {
      onShowToast(res.message, res.success ? 'success' : 'warning');
    }
  };

  return (
    <div className="hero-banner">
      <div className="hero-content">
        <div className="hero-pill">
          <i className="fa-solid fa-award"></i> Michelin Recommended 2026
        </div>
        <h1 className="hero-title">
          Culinary Perfection, <br />
          <span className="text-gradient">Crafted For You</span>
        </h1>
        <p className="hero-desc">
          Indulge in seasonal ingredients, wood-fired specials, and handcrafted cocktails made to order.
        </p>
        <div className="hero-quick-info">
          <div className="info-item">
            <i className="fa-solid fa-clock"></i> <span>Avg Prep: <strong>15-20 mins</strong></span>
          </div>
          <div className="info-item">
            <i className="fa-solid fa-chair"></i>{' '}
            <span>
              {diningMode === 'dine-in' ? (
                <>Dine-In Table: <strong>#{tableNumber}</strong></>
              ) : (
                <>Mode: <strong>Takeaway Pickup</strong></>
              )}
            </span>
          </div>
          <div className="info-item">
            <i className="fa-solid fa-shield-halved"></i> <span>100% Fresh Guaranteed</span>
          </div>
        </div>
      </div>

      <div className="hero-promo-card">
        <div className="promo-badge">HOT OFFER</div>
        <h3>Enjoy 15% Off Your Feast</h3>
        <p>
          Use voucher code{' '}
          <code
            className="promo-code-copy"
            id="hero-voucher-code"
            title="Click to copy & apply"
            onClick={handleApplyVoucher}
            style={{ cursor: 'pointer' }}
          >
            AURAVIP15
          </code>{' '}
          at checkout!
        </p>
        <button
          className="btn btn-sm btn-accent"
          id="apply-hero-voucher-btn"
          onClick={handleApplyVoucher}
        >
          Apply To Cart
        </button>
      </div>
    </div>
  );
}
