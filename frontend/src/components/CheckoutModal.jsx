import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import {
  generateBakongKhqr,
  checkBakongPayment,
  formatKhmerRiel,
  BAKONG_CONFIG
} from '../services/bakongService';
import { playAudioAlert } from '../utils/audio';

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { items, summary, diningMode, tableNumber, clearCart } = useCart();
  const { createOrder } = useOrders();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('khqr'); // Default to Bakong KHQR
  const [specialNotes, setSpecialNotes] = useState('');

  // Bakong Gateway State
  const [khqrData, setKhqrData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [countdown, setCountdown] = useState(BAKONG_CONFIG.EXPIRY_SECONDS);

  const pollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const hasAutoFinalized = useRef(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Generate KHQR when modal opens or total changes
  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setKhqrData(null);
      setIsPaid(false);
      setTransactionData(null);
      setCheckoutError('');
      hasAutoFinalized.current = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    if (paymentMethod === 'khqr' && summary.total > 0) {
      loadKhqr();
    }
  }, [isOpen, paymentMethod, summary.total]);

  const loadKhqr = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setIsPaid(false);
    setTransactionData(null);
    setCountdown(BAKONG_CONFIG.EXPIRY_SECONDS);
    hasAutoFinalized.current = false;

    const invoiceNum = `ORD-${Date.now().toString().slice(-6)}`;

    try {
      const result = await generateBakongKhqr({
        amount: summary.total,
        currency: 'USD',
        billNumber: invoiceNum,
        accountId: BAKONG_CONFIG.ACCOUNT_ID,
        merchantName: BAKONG_CONFIG.MERCHANT_NAME
      });

      if (result) {
        setKhqrData(result);
      } else {
        setGenerateError('Could not reach Bakong payment gateway.');
      }
    } catch (err) {
      console.error('Error generating KHQR:', err);
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 5-Minute Expiry Countdown with Automatic Refresh
  useEffect(() => {
    if (khqrData && !isPaid && isOpen) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Automatically regenerate a fresh KHQR when expired
            loadKhqr();
            return BAKONG_CONFIG.EXPIRY_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [khqrData, isPaid, isOpen]);

  // Real-time Automated Polling for Settlement (calls /api/v1/check/{md5} every 2.0s)
  useEffect(() => {
    if (!khqrData?.md5 || isPaid || !isOpen || paymentMethod !== 'khqr') {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const checkStatus = async () => {
      if (isChecking || isPaid || hasAutoFinalized.current) return;
      setIsChecking(true);
      try {
        const checkRes = await checkBakongPayment(khqrData.md5);
        setCheckCount((prev) => prev + 1);

        if (checkRes.isPaid && !hasAutoFinalized.current) {
          hasAutoFinalized.current = true;
          setIsPaid(true);
          setTransactionData(checkRes);

          // Audio chime confirmation
          playAudioAlert('order-placed');

          // Auto-verify and transition after 1.2s
          setTimeout(() => {
            finalizeOrder({
              verifiedHash: checkRes.hash || khqrData.md5,
              status: 'Paid'
            });
          }, 1200);
        }
      } catch (err) {
        console.warn('Bakong auto-verification polling:', err);
      } finally {
        setIsChecking(false);
      }
    };

    // First check after 1.0s, then continuously every 2.0s
    const initialTimer = setTimeout(checkStatus, 1000);
    pollIntervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [khqrData?.md5, isPaid, isOpen, paymentMethod]);

  const finalizeOrder = ({ verifiedHash = null, status = 'Paid' } = {}) => {
    const finalName = customerName.trim() || (diningMode === 'dine-in' ? `Table ${tableNumber || '04'} Guest` : 'Takeaway Guest');
    const finalPhone = phone.trim() || 'Bakong Digital';

    const newOrder = createOrder({
      customerName: finalName,
      phone: finalPhone,
      address,
      diningMode,
      tableNumber,
      paymentMethod,
      paymentStatus: status,
      transactionHash: verifiedHash,
      specialNotes,
      cartSummary: summary,
      cartItems: items
    });

    clearCart();
    onClose();
    if (onOrderPlaced) {
      onOrderPlaced(newOrder);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCheckoutError('');

    // If payment method is Cash, allow placing order right away
    if (paymentMethod === 'cash') {
      if (!customerName.trim() || !phone.trim()) {
        setCheckoutError('Please provide your name and phone number for counter payment.');
        return;
      }
      finalizeOrder({ status: 'Pay at Counter' });
      return;
    }

    // If payment method is KHQR and not yet confirmed
    if (paymentMethod === 'khqr' && !isPaid) {
      setCheckoutError('Please scan the KHQR code with your Bakong or Banking app to complete payment. Once paid, it will auto-verify.');
      return;
    }

    finalizeOrder({ status: 'Paid' });
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      id="checkout-modal"
      style={{ display: 'flex', zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-checkout"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.75rem',
          borderRadius: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          position: 'relative'
        }}
      >
        <button
          className="modal-close-btn"
          id="close-checkout-modal-btn"
          aria-label="Close modal"
          onClick={onClose}
          style={{ top: '1rem', right: '1rem' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header */}
        <div className="checkout-header" style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              margin: '0 auto 0.75rem',
              boxShadow: '0 4px 15px rgba(225, 29, 72, 0.35)'
            }}
          >
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.3rem', fontWeight: 800 }}>
            Bakong KHQR Checkout
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Instant National Bank of Cambodia (NBC) KHQR Settlement &bull; Auto-Verified
          </p>
        </div>

        {/* SUCCESS CELEBRATION OVERLAY (When Payment Confirmed on Ledger) */}
        {isPaid && (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
              border: '2px solid #10b981',
              textAlign: 'center',
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                margin: '0 auto 0.75rem',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <i className="fa-solid fa-check"></i>
            </div>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#10b981', fontWeight: 800 }}>
              Payment Verified!
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Confirmed on NBC Bakong Ledger &bull; Transmitting ticket to kitchen...
            </p>
            {transactionData?.hash && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Hash: {transactionData.hash.slice(0, 24)}...
              </div>
            )}
          </div>
        )}

        {/* 1. Payment Method Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Choose Payment Mode
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('khqr')}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: paymentMethod === 'khqr' ? '2px solid #e11d48' : '1px solid var(--border-color)',
                background: paymentMethod === 'khqr' ? 'rgba(225, 29, 72, 0.08)' : 'var(--bg-subtle)',
                color: paymentMethod === 'khqr' ? '#e11d48' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
              <span>Bakong KHQR (Auto-Pay)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: paymentMethod === 'cash' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-subtle)',
                color: paymentMethod === 'cash' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <i className="fa-solid fa-money-bill-wave"></i>
              <span>Pay at Cashier</span>
            </button>
          </div>
        </div>

        {/* 2. DYNAMIC BAKONG KHQR SECTION */}
        {paymentMethod === 'khqr' && !isPaid && (
          <div
            style={{
              marginBottom: '1.25rem',
              borderRadius: '20px',
              border: '1px solid #fda4af',
              background: 'linear-gradient(180deg, #fff1f2 0%, var(--bg-surface) 100%)',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(225, 29, 72, 0.08)'
            }}
          >
            {/* NBC KHQR Brand Header Bar */}
            <div
              style={{
                background: '#e11d48',
                padding: '0.75rem 1.25rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    background: '#ffffff',
                    color: '#e11d48',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    letterSpacing: '1px'
                  }}
                >
                  KHQR
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.95 }}>
                  National Bank of Cambodia
                </span>
              </div>

              {/* Tag 99 Countdown Timer */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <i className="fa-regular fa-clock"></i>
                <span>{countdown > 0 ? formatCountdown(countdown) : 'EXPIRED'}</span>
              </div>
            </div>

            {/* Merchant Details & Amount Strip */}
            <div style={{ padding: '1.25rem 1.25rem 0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                AURA BISTRO &bull; TABLE {diningMode === 'dine-in' ? tableNumber : 'TAKEAWAY'}
              </div>

              {/* Price Display */}
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#e11d48', lineHeight: 1.1 }}>
                  ${summary.total.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 700 }}>USD</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  ≈ {formatKhmerRiel(summary.total)} KHR
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 1.25rem' }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '18px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #fecdd3',
                  position: 'relative',
                  display: 'inline-block'
                }}
              >
                {isGenerating ? (
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      color: '#e11d48'
                    }}
                  >
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem' }}></i>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Generating KHQR...</span>
                  </div>
                ) : khqrData?.qrImage ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={khqrData.qrImage}
                      alt="Bakong Dynamic KHQR"
                      style={{
                        width: '200px',
                        height: '200px',
                        display: 'block',
                        borderRadius: '8px'
                      }}
                    />
                    {/* Center KHQR Logo Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#e11d48',
                        color: '#ffffff',
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        border: '2px solid #ffffff'
                      }}
                    >
                      KHQR
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Failed to load QR
                  </div>
                )}
              </div>
            </div>

            {/* Live Listening Radar & Mobile Button */}
            <div style={{ padding: '0.5rem 1.25rem 1.25rem', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '0.75rem'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981'
                  }}
                ></span>
                <span>Auto-verifying payment &bull; No click needed</span>
              </div>

              {/* Supported Banking Apps Strip */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Scan with <strong>ABA Mobile, Wing, ACLEDA, Canadia, Sathapana</strong> or any Bakong App.
              </div>

              {/* 1-Tap Mobile Pay Deeplink Button */}
              {khqrData?.deeplink && (
                <a
                  href={khqrData.deeplink}
                  className="btn btn-block"
                  style={{
                    background: 'linear-gradient(135deg, #e11d48, #be123c)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                    marginBottom: '0.5rem'
                  }}
                >
                  <i className="fa-solid fa-mobile-screen"></i> Open in Bakong / Banking App
                </a>
              )}
            </div>
          </div>
        )}

        {/* 3. GUEST INFO & SPECIAL NOTES FORM */}
        <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Guest Information
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="cust-name" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Guest Name
              </label>
              <input
                type="text"
                id="cust-name"
                placeholder={diningMode === 'dine-in' ? `Guest Table #${tableNumber || '04'}` : 'e.g. Sokha Chan'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="cust-phone" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Phone Number
              </label>
              <input
                type="tel"
                id="cust-phone"
                placeholder="e.g. 012 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {diningMode === 'takeout' && (
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <div className="form-group full-width" style={{ margin: 0 }}>
                <label htmlFor="cust-address" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Takeaway / Delivery Notes
                </label>
                <input
                  type="text"
                  id="cust-address"
                  placeholder="Pickup landmark or delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Kitchen Special Notes */}
          <div className="form-group full-width" style={{ marginTop: '0.75rem' }}>
            <label htmlFor="order-special-notes" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              Special Kitchen Requests (Optional)
            </label>
            <textarea
              id="order-special-notes"
              rows="2"
              placeholder="Allergies, extra sauce, serve dessert later..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            ></textarea>
          </div>

          {/* Error Feedback Banner */}
          {checkoutError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontSize: '0.84rem',
                fontWeight: 700,
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Final Total Summary Strip */}
          <div className="checkout-summary-strip" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div>
              <span className="muted-label">Total to Pay:</span>
              <div className="checkout-total-number" id="modal-checkout-total">
                ${summary.total.toFixed(2)}
              </div>
            </div>
            <div className="checkout-item-count" id="modal-checkout-items-count">
              {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'} &bull;{' '}
              {diningMode === 'dine-in' ? `Table #${tableNumber || '04'}` : 'Takeaway'}
            </div>
          </div>

          {/* Cash / Counter Pay Button */}
          {paymentMethod === 'cash' && (
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              id="confirm-place-order-btn"
              style={{ justifyContent: 'center', gap: '0.5rem' }}
            >
              <i className="fa-solid fa-circle-check"></i> Place Order (Pay at Counter)
            </button>
          )}

          {/* When in KHQR Mode */}
          {paymentMethod === 'khqr' && (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-lock" style={{ color: '#10b981', marginRight: '0.35rem' }}></i>
              Protected by NBC Bakong EMVCo Encryption. System auto-verifies upon transfer.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
