import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { items, summary, diningMode, tableNumber, clearCart } = useCart();
  const { createOrder } = useOrders();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [specialNotes, setSpecialNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Please provide your name and contact phone number.');
      return;
    }

    const newOrder = createOrder({
      customerName,
      phone,
      address,
      diningMode,
      tableNumber,
      paymentMethod,
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

  return (
    <div
      className="modal-backdrop"
      id="checkout-modal"
      style={{ display: 'flex' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-checkout"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          id="close-checkout-modal-btn"
          aria-label="Close modal"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="checkout-header">
          <i className="fa-solid fa-cash-register modal-icon"></i>
          <h3>Finalize Your Order</h3>
          <p>Review your information and select a payment method.</p>
        </div>

        <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
          {/* Guest Information */}
          <div className="form-section-title">1. Guest Information</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cust-name">Full Name *</label>
              <input
                type="text"
                id="cust-name"
                placeholder="e.g. Sokha Chan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cust-phone">Phone Number *</label>
              <input
                type="tel"
                id="cust-phone"
                placeholder="e.g. 012 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {diningMode === 'takeout' && (
            <div className="form-row" id="delivery-address-group">
              <div className="form-group full-width">
                <label htmlFor="cust-address">Takeaway / Delivery Note</label>
                <input
                  type="text"
                  id="cust-address"
                  placeholder="Pickup counter or delivery landmark..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="form-section-title">2. Payment Method</div>
          <div className="payment-options-grid">
            <label
              className={`payment-card ${paymentMethod === 'khqr' ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="payment-method"
                value="khqr"
                checked={paymentMethod === 'khqr'}
                onChange={() => setPaymentMethod('khqr')}
              />
              <div className="pay-content">
                <i className="fa-solid fa-qrcode"></i>
                <span>KHQR / Mobile Pay</span>
              </div>
            </label>

            <label
              className={`payment-card ${paymentMethod === 'card' ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="payment-method"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <div className="pay-content">
                <i className="fa-regular fa-credit-card"></i>
                <span>Credit Card</span>
              </div>
            </label>

            <label
              className={`payment-card ${paymentMethod === 'cash' ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="payment-method"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              <div className="pay-content">
                <i className="fa-solid fa-money-bill-wave"></i>
                <span>Pay at Cashier</span>
              </div>
            </label>
          </div>

          {/* Special Kitchen Notes */}
          <div className="form-group full-width" style={{ marginTop: '1rem' }}>
            <label htmlFor="order-special-notes">
              Special Kitchen Requests (Optional)
            </label>
            <textarea
              id="order-special-notes"
              rows="2"
              placeholder="Allergies, extra napkins, serve dessert later..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
            ></textarea>
          </div>

          {/* Final Total Summary Box */}
          <div className="checkout-summary-strip">
            <div>
              <span className="muted-label">Total to Pay:</span>
              <div className="checkout-total-number" id="modal-checkout-total">
                ${summary.total.toFixed(2)}
              </div>
            </div>
            <div className="checkout-item-count" id="modal-checkout-items-count">
              {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'} &bull;{' '}
              {diningMode === 'dine-in' ? `Table #${tableNumber}` : 'Takeaway'}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            id="confirm-place-order-btn"
          >
            <i className="fa-solid fa-circle-check"></i> Place Order Now
          </button>
        </form>
      </div>
    </div>
  );
}
