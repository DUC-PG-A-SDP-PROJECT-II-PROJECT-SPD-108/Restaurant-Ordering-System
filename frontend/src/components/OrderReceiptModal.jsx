import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function OrderReceiptModal({
  order,
  isOpen,
  onClose,
  onTrackOrder,
  isAdminView = false
}) {
  // Whenever receipt modal is open, flag body so print engine isolates ONLY the receipt slip
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-receipt-mode');
    } else {
      document.body.classList.remove('printing-receipt-mode');
    }

    const handleAfterPrint = () => {
      if (!isOpen) {
        document.body.classList.remove('printing-receipt-mode');
      }
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.classList.remove('printing-receipt-mode');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const serviceFee = Number(order.serviceFee || 0);
  const total = Number(order.total || (subtotal - discount + tax + serviceFee));

  const handlePrint = () => {
    document.body.classList.add('printing-receipt-mode');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const modalContent = (
    <div
      className="modal-backdrop receipt-modal-portal-backdrop"
      id="receipt-modal-portal"
      style={{ display: 'flex' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-receipt"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn no-print"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {!isAdminView ? (
          <>
            <div className="receipt-success-badge no-print">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="no-print">Order Confirmed!</h2>
            <p className="receipt-subtitle no-print">
              Your order has been transmitted directly to our kitchen staff.
            </p>
          </>
        ) : (
          <div className="no-print" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                margin: '0 auto 0.5rem'
              }}
            >
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Official Guest Receipt</h2>
            <p className="receipt-subtitle" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
              80mm Thermal Print Format &bull; Bistro Dining System
            </p>
          </div>
        )}

        {/* Printable 80mm Receipt Slip */}
        <div className="receipt-paper" id="receipt-paper-content">
          <div
            style={{
              textAlign: 'center',
              marginBottom: '0.85rem',
              borderBottom: '1px dashed var(--border-color)',
              paddingBottom: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
              <div
                style={{
                  background: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '42px'
                }}
              >
                <img
                  src="./images/logo.png"
                  alt="Bistro Logo"
                  style={{ height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
            <h4 style={{ fontSize: '1.05rem', letterSpacing: '1px', margin: '0 0 0.15rem', color: '#0f172a' }}>
              BISTRO &bull; GOOD FOOD GOOD MOOD
            </h4>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Phnom Penh, Cambodia &bull; Tel: +855 23 999 888
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.05rem',
                marginTop: '0.35rem',
                color: 'var(--primary)'
              }}
            >
              {order.id}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {new Date(order.timestamp).toLocaleString()}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.45rem',
              fontSize: '0.8rem'
            }}
          >
            <span>
              <strong>Guest:</strong> {order.customerName || 'Walk-in Guest'}
            </span>
            <span>
              <strong>
                {order.diningMode === 'dine-in'
                  ? `Table #${order.tableNumber || '01'}`
                  : 'Takeaway Pickup'}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.45rem',
              fontSize: '0.8rem'
            }}
          >
            <span>
              <strong>Payment:</strong> {order.paymentMethod === 'khqr' ? 'Bakong KHQR' : String(order.paymentMethod || 'CASH').toUpperCase()} (
              {order.paymentStatus || 'Paid'})
            </span>
            {order.phone && (
              <span>
                <strong>Tel:</strong> {order.phone}
              </span>
            )}
          </div>

          {order.paymentMethod === 'khqr' && (
            <div
              style={{
                padding: '0.4rem 0.65rem',
                background: '#fff1f2',
                borderRadius: '6px',
                border: '1px solid #fecdd3',
                fontSize: '0.72rem',
                color: '#be123c',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.35rem'
              }}
            >
              <span>
                <i className="fa-solid fa-qrcode" style={{ color: '#e11d48' }}></i>{' '}
                <strong>NBC Bakong KHQR Verified</strong>
              </span>
              {order.transactionHash && (
                <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', opacity: 0.9 }}>
                  TX: #{order.transactionHash.slice(0, 14)}...
                </span>
              )}
            </div>
          )}

          {/* Items breakdown */}
          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              padding: '0.55rem 0',
              marginBottom: '0.55rem'
            }}
          >
            {orderItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  marginBottom: '0.25rem'
                }}
              >
                <span>
                  {item.quantity}x {item.name}
                  {item.spiceLevel ? ` (${item.spiceLevel})` : ''}
                </span>
                <span>${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Subtotal & Totals */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.2rem'
            }}
          >
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--accent)',
                marginBottom: '0.2rem'
              }}
            >
              <span>Voucher Discount {order.promoCode ? `(${order.promoCode})` : ''}</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.2rem'
            }}
          >
            <span>VAT Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              marginBottom: '0.35rem'
            }}
          >
            <span>Service Fee (5%)</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: '1.05rem',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '0.45rem',
              color: 'var(--primary)'
            }}
          >
            <span>TOTAL PAID:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {order.specialNotes && (
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.45rem',
                borderTop: '1px dotted var(--border-color)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}
            >
              <em>Note: {order.specialNotes}</em>
            </div>
          )}

          <div
            style={{
              textAlign: 'center',
              marginTop: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px dashed var(--border-color)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}
          >
            Thank you for dining at Bistro! Please come again.
          </div>
        </div>

        <div className="receipt-actions no-print">
          <button
            type="button"
            className="btn btn-primary btn-block"
            id="print-receipt-btn"
            onClick={handlePrint}
          >
            <i className="fa-solid fa-print"></i> Print 80mm Receipt
          </button>
          {!isAdminView && onTrackOrder && (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              id="track-order-modal-btn"
              onClick={() => {
                onClose();
                onTrackOrder(order);
              }}
            >
              <i className="fa-solid fa-satellite-dish"></i> Track Order Live
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-block"
            id="close-receipt-btn"
            onClick={onClose}
          >
            {isAdminView ? 'Close Window' : 'Back to Menu'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
