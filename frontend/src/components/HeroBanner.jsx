import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

// Color Palette from user template (Light & Warm):
// #FF5900 - Orange (Pantone)
// #FF8237 - Pumpkin
// #FFAA6E - Sandy brown
// #FFD3A5 - Light orange
// #FFFBDC - Light yellow

const BANNER_SLIDES = [
  {
    id: 1,
    code: 'AURAVIP15',
    discountPercent: 15,
    tag: 'Michelin Recommended 2026',
    tagIcon: 'fa-solid fa-award',
    tagColor: '#c2410c',
    titleMain: 'Culinary Perfection,',
    titleGradient: 'Crafted For You',
    description: 'Indulge in seasonal ingredients, wood-fired specials, and handcrafted cocktails made to order.',
    foodImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    foodLabel: 'Prime Wagyu Ribeye',
    bgGradient: 'linear-gradient(135deg, #FFFDF8 0%, #FFFBDC 100%)',
    borderColor: 'rgba(255, 130, 55, 0.35)',
    glowColor: 'rgba(255, 130, 55, 0.15)',
    accentColor: '#FF5900',
    badgeText: 'VIP DINING'
  },
  {
    id: 2,
    code: 'WELCOME10',
    discountPercent: 10,
    tag: 'New Guest Welcome Offer',
    tagIcon: 'fa-solid fa-sparkles',
    tagColor: '#c2410c',
    titleMain: 'Welcome to Bistro,',
    titleGradient: 'Taste True Passion',
    description: 'Experience our signature artisan recipes handcrafted fresh with premium farm-to-table organic produce.',
    foodImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    foodLabel: 'Organic Harvest Bowl',
    bgGradient: 'linear-gradient(135deg, #FFF9F5 0%, #FFEAD6 100%)',
    borderColor: 'rgba(255, 130, 55, 0.35)',
    glowColor: 'rgba(255, 170, 110, 0.15)',
    accentColor: '#FF8237',
    badgeText: 'WELCOME GIFT'
  },
  {
    id: 3,
    code: 'CHEF25',
    discountPercent: 25,
    tag: 'Executive Chef Exclusive',
    tagIcon: 'fa-solid fa-fire',
    tagColor: '#c2410c',
    titleMain: 'Chef Marco Masterclass,',
    titleGradient: '25% Off Signature Dishes',
    description: 'Savor prime dry-aged Wagyu ribeye, truffle glazed cuts, and bespoke gastronomy curated by master chefs.',
    foodImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    foodLabel: 'Double Wagyu Smash',
    bgGradient: 'linear-gradient(135deg, #FFF6EE 0%, #FFE2C7 100%)',
    borderColor: 'rgba(255, 89, 0, 0.4)',
    glowColor: 'rgba(255, 89, 0, 0.15)',
    accentColor: '#FF5900',
    badgeText: 'CHEF PICK 25%'
  },
  {
    id: 4,
    code: 'BISTRO20',
    discountPercent: 20,
    tag: 'Weekend Feast & Celebration',
    tagIcon: 'fa-solid fa-champagne-glasses',
    tagColor: '#c2410c',
    titleMain: 'Weekend Celebration,',
    titleGradient: '20% Weekend Specials',
    description: 'Gather your friends and family for live acoustic dining, artisan wood-fired tapas, and handcrafted wines.',
    foodImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
    foodLabel: 'Blood Orange Infusion',
    bgGradient: 'linear-gradient(135deg, #FFFEFA 0%, #FFF3D6 100%)',
    borderColor: 'rgba(255, 170, 110, 0.35)',
    glowColor: 'rgba(255, 211, 165, 0.15)',
    accentColor: '#FF8237',
    badgeText: 'WEEKEND SPECIAL'
  }
];

export default function HeroBanner({ onShowToast }) {
  const { applyPromoCode, diningMode, tableNumber, vouchers } = useCart();
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const fallbackCopyText = (text) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
  };

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    if (!code) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {
        fallbackCopyText(code);
      });
    } else {
      fallbackCopyText(code);
    }

    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);

    if (onShowToast) {
      onShowToast(
        language === 'kh'
          ? `បានចម្លងកូដ "${code}" ទៅកាន់ Clipboard!`
          : `Copied code "${code}" to clipboard!`,
        'info'
      );
    }
  };

  // Sync with live voucher discounts if modified in database/context
  const slides = BANNER_SLIDES.map((slide, idx) => {
    if (vouchers && vouchers.length > idx) {
      const live = vouchers.find((v) => (v.code || '').toUpperCase() === slide.code);
      if (live) {
        return {
          ...slide,
          discountPercent: live.discountPercent || slide.discountPercent
        };
      }
    }
    return slide;
  });

  // Auto-advance whole banner slide every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const activeSlide = slides[currentSlide] || slides[0];

  const handleApplyVoucher = (code) => {
    const voucherCode = code || activeSlide.code;
    if (!voucherCode) return;
    const res = applyPromoCode(voucherCode);
    if (onShowToast) {
      onShowToast(res.message, res.success ? 'success' : 'warning');
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="hero-banner-slideshow-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        marginBottom: '2rem',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        border: '1.5px solid rgba(255, 130, 55, 0.28)',
        userSelect: 'none'
      }}
    >
      {/* Horizontal Sliding Track (Physical Slide Motion) */}
      <div
        className="hero-carousel-track"
        style={{
          display: 'flex',
          width: '100%',
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="hero-banner hero-banner-light-theme"
            style={{
              flex: '0 0 100%',
              minWidth: '100%',
              boxSizing: 'border-box',
              background: slide.bgGradient,
              margin: 0,
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'none'
            }}
          >
            {/* Ambient Glow Background Accent (Soft Light Warmth) */}
            <div
              style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '520px',
                height: '520px',
                background: `radial-gradient(circle, ${slide.glowColor} 0%, rgba(255, 255, 255, 0) 70%)`,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />

            {/* Left Area: Hero Content & Tag */}
            <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
              <div
                className="hero-pill"
                style={{
                  background: 'rgba(255, 89, 0, 0.08)',
                  color: '#c2410c',
                  border: '1px solid rgba(255, 89, 0, 0.22)',
                  marginBottom: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <i className={slide.tagIcon} style={{ color: '#FF5900' }}></i>
                <span>{slide.tag}</span>
              </div>

              <h1 className="hero-title" style={{ margin: '0 0 1rem 0', lineHeight: 1.15, fontSize: '2.35rem', fontWeight: 800, color: '#0f172a' }}>
                {slide.titleMain} <br />
                <span
                  style={{
                    color: '#FF5900',
                    display: 'inline-block'
                  }}
                >
                  {slide.titleGradient}
                </span>
              </h1>

              <p className="hero-desc" style={{ color: '#334155', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '1.4rem', maxWidth: '520px' }}>
                {slide.description}
              </p>

              <div className="hero-quick-info" style={{ display: 'flex', gap: '1.15rem', flexWrap: 'wrap', fontSize: '0.84rem', color: '#475569' }}>
                <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <i className="fa-solid fa-clock" style={{ color: '#FF5900' }}></i>
                  <span>Avg Prep: <strong style={{ color: '#0f172a' }}>15-20 mins</strong></span>
                </div>
                <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <i className="fa-solid fa-chair" style={{ color: '#FF5900' }}></i>
                  <span>
                    {diningMode === 'dine-in' ? (
                      <>Dine-In Table: <strong style={{ color: '#0f172a' }}>#{tableNumber || '04'}</strong></>
                    ) : (
                      <>Mode: <strong style={{ color: '#0f172a' }}>Takeaway Pickup</strong></>
                    )}
                  </span>
                </div>
                <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#FF5900' }}></i>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>100% Fresh Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Right Visual Side Area: Food Showcase + Voucher Feature Card */}
            <div className="hero-slide-visual-side">
              {/* Middle Area: Distinct Food Visual Showcase Card */}
              <div
                className="hero-slide-food-showcase"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <div
                  className="food-circle-img"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #ffffff',
                    boxShadow: '0 10px 25px rgba(255, 89, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08)',
                    background: '#ffffff'
                  }}
                >
                  <img
                    src={slide.foodImage}
                    alt={slide.foodLabel}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = './images/logo.png';
                    }}
                  />
                </div>
                <span
                  style={{
                    marginTop: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255, 130, 55, 0.25)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {slide.foodLabel}
                </span>
              </div>

              {/* Right Area: Dedicated Slide Voucher Feature Card (Crisp White Card) */}
            {/* Right: Voucher Card */}
            <div className="hero-slide-voucher-card">
              <div className="voucher-card-badge">
                <i className="fa-solid fa-tag"></i> {slide.badgeText} ({index + 1}/4)
              </div>

              <div className="voucher-card-discount">
                {slide.discountPercent}% OFF
              </div>

              <div className="voucher-card-desc">
                Use voucher code at checkout:
              </div>

              <div
                className="voucher-card-code-box"
                onClick={(e) => handleCopyCode(e, slide.code)}
                title={language === 'kh' ? 'ចុចដើម្បីចម្លងកូដ' : 'Click to copy voucher code'}
                style={{
                  background: copiedCode === slide.code ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 89, 0, 0.06)',
                  border: copiedCode === slide.code ? '1.5px dashed #22c55e' : '1.5px dashed #FF8237',
                  color: copiedCode === slide.code ? '#15803d' : '#0f172a'
                }}
              >
                <span>{slide.code}</span>
                {copiedCode === slide.code ? (
                  <i className="fa-solid fa-check" style={{ fontSize: '0.95rem', color: '#16a34a' }}></i>
                ) : (
                  <i className="fa-regular fa-copy" style={{ fontSize: '0.85rem', color: '#FF5900' }}></i>
                )}
              </div>

              <button
                type="button"
                className="voucher-card-apply-btn"
                onClick={() => handleApplyVoucher(slide.code)}
              >
                <i className="fa-solid fa-cart-plus"></i>
                <span>Apply To Cart</span>
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Whole Banner Navigation Controls: Left Arrow Button */}
      <button
        type="button"
        className="hero-arrow-btn hero-arrow-prev"
        onClick={handlePrev}
        aria-label="Previous Slide"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      {/* Whole Banner Navigation Controls: Right Arrow Button */}
      <button
        type="button"
        className="hero-arrow-btn hero-arrow-next"
        onClick={handleNext}
        aria-label="Next Slide"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      {/* Whole Banner Centered Pagination Indicator Dots */}
      <div
        className="hero-pagination-dots"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '5px 12px',
          borderRadius: 'var(--radius-full)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 130, 55, 0.25)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}
      >
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: currentSlide === idx ? '26px' : '8px',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              background: currentSlide === idx ? '#FF5900' : 'rgba(255, 130, 55, 0.3)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
