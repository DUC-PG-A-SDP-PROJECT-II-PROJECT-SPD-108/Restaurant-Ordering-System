import React from 'react';

export default function OrderReceiptModal({ order, isOpen, onClose, onTrackOrder }) {
  if (!isOpen || !order) return null;

  return (
    <div
      className="modal-backdrop"
      id="receipt-modal"
      style={{ display: 'flex' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-receipt"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-success-badge">
          <i className="fa-solid fa-check"></i>
        </div>
        <h2>Order Confirmed!</h2>
        <p className="receipt-subtitle">
          Your order has been transmitted directly to our kitchen staff.
        </p>

        <div className="receipt-paper" id="receipt-paper-content">
          <div
            style={{
              textAlign: 'center',
              marginBottom: '1rem',
              borderBottom: '1px dashed var(--border-color)',
              paddingBottom: '0.75rem'
            }}
          >
            <h4 style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>
              AURA BISTRO &amp; LOUNGE
            </h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Phnom Penh, Cambodia &bull; Tel: +855 23 999 888
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                marginTop: '0.4rem',
                color: 'var(--primary)'
              }}
            >
              {order.id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(order.timestamp).toLocaleString()}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.8rem'
            }}
          >
            <span>
              <strong>Guest:</strong> {order.customerName}
            </span>
            <span>
              <strong>
                {order.diningMode === 'dine-in'
                  ? `Table #${order.tableNumber}`
                  : 'Takeaway Pickup'}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              fontSize: '0.8rem'
            }}
          >
            <span>
              <strong>Payment:</strong> {order.paymentMethod.toUpperCase()} (
              {order.paymentStatus})
            </span>
            <span>
              <strong>Phone:</strong> {order.phone}
            </span>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              padding: '0.6rem 0',
              marginBottom: '0.6rem'
            }}
          >
            {order.items.map((item, idx) => (
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
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              marginBottom: '0.2rem'
            }}
          >
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>

          {order.discount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: 'var(--accent)',
                marginBottom: '0.2rem'
              }}
            >
              <span>Voucher Discount</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              marginBottom: '0.2rem'
            }}
          >
            <span>VAT Tax (10%)</span>
            <span>${order.tax.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              marginBottom: '0.4rem'
            }}
          >
            <span>Service Fee (5%)</span>
            <span>${order.serviceFee.toFixed(2)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: '1.05rem',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '0.5rem',
              color: 'var(--primary)'
            }}
          >
            <span>TOTAL PAID:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="receipt-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            id="track-order-modal-btn"
            onClick={() => {
              onClose();
              if (onTrackOrder) onTrackOrder(order);
            }}
          >
            <i className="fa-solid fa-satellite-dish"></i> Track Order Live
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            id="print-receipt-btn"
            onClick={() => window.print()}
          >
            <i className="fa-solid fa-print"></i> Print Receipt
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            id="close-receipt-btn"
            onClick={onClose}
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
