import React, { useState, useEffect, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { formatTimeAgo, parseUtcDate } from '../utils/date';

export default function TrackOrder({ onGoToMenu, onShowToast }) {
  const { orders, activeOrderId, setActiveOrderId } = useOrders();

  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0];
  const selectedOrderRef = useRef(null);

  useEffect(() => {
    if (selectedOrderRef.current) {
      selectedOrderRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeOrder?.id]);

  const statusMap = {
    pending: 1,
    cooking: 2,
    preparing: 2,
    ready: 3,
    served: 4,
    completed: 4,
    delivered: 4,
    cancelled: 0
  };
  const currentStep = activeOrder ? statusMap[activeOrder.status] || 1 : 1;
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / 3) * 100));

  const handleRefresh = () => {
    if (onShowToast) {
      onShowToast('Order status refreshed', 'info');
    }
  };

  return (
    <section className="app-view active-view" id="tracker-view">
      <div className="tracker-header">
        <div>
          <h2>
            <i className="fa-solid fa-satellite-dish"></i> Live Kitchen Order Tracker
          </h2>
          <p>Watch your order progress from prep to plate in real time.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="refresh-tracker-btn"
          onClick={handleRefresh}
        >
          <i className="fa-solid fa-arrows-rotate"></i> Refresh Status
        </button>
      </div>

      <div className="tracker-layout">
        {/* Active Orders List */}
        <div className="tracker-orders-list" id="tracker-orders-container">
          {orders.map((ord) => {
            const isSelected = ord.id === activeOrder?.id;
            return (
              <div
                key={ord.id}
                ref={isSelected ? selectedOrderRef : null}
                className={`tracker-order-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setActiveOrderId(ord.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="order-card-header">
                  <span className="order-code">{ord.id}</span>
                  <span className={`order-status-badge status-${ord.status}`}>
                    {ord.status.toUpperCase()}
                  </span>
                </div>
                <div className="order-card-meta">
                  <span className="order-card-items-price">
                    {ord.items.length} items &bull; ${ord.total.toFixed(2)}
                  </span>
                  <span className="order-card-time-ago">{formatTimeAgo(ord.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Timeline Detail Panel */}
        <div className="tracker-detail-panel" id="tracker-detail-panel">
          {!activeOrder ? (
            <div className="empty-tracker-notice" id="tracker-placeholder">
              <i className="fa-solid fa-clipboard-list"></i>
              <h3>No Active Orders Selected</h3>
              <p>
                Place an order from the menu or select an ongoing order from the list to view its live progress.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                id="go-to-menu-btn"
                onClick={onGoToMenu}
              >
                <i className="fa-solid fa-utensils"></i> Browse Menu
              </button>
            </div>
          ) : (
            <div className="tracker-card-content" id="tracker-active-content">
              <div className="tracker-active-header">
                <div>
                  <span className="tracker-header-subtitle">
                    ORDER TRACKING
                  </span>
                  <h2 className="tracker-header-order-id">
                    {activeOrder.id}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className={`order-status-badge status-${activeOrder.status}`}
                    style={{ fontSize: '0.85rem', padding: '4px 12px' }}
                  >
                    {activeOrder.status.toUpperCase()}
                  </span>
                  <div className="tracker-header-placed-time">
                    Placed:{' '}
                    {parseUtcDate(activeOrder.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Timeline Stepper */}
              <div className="tracker-progress-stepper">
                <div className="stepper-progress-track">
                  <div
                    className="stepper-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <div
                  className={`step-node ${currentStep >= 1 ? 'completed' : ''} ${
                    currentStep === 1 ? 'active' : ''
                  }`}
                >
                  <div className="step-circle">
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <div className="step-label">Order Placed</div>
                  <div className="step-time">Confirmed</div>
                </div>

                <div
                  className={`step-node ${currentStep >= 2 ? 'completed' : ''} ${
                    currentStep === 2 ? 'active' : ''
                  }`}
                >
                  <div className="step-circle">
                    <i className="fa-solid fa-fire-burner"></i>
                  </div>
                  <div className="step-label">Cooking</div>
                  <div className="step-time">In Kitchen</div>
                </div>

                <div
                  className={`step-node ${currentStep >= 3 ? 'completed' : ''} ${
                    currentStep === 3 ? 'active' : ''
                  }`}
                >
                  <div className="step-circle">
                    <i className="fa-solid fa-bell-concierge"></i>
                  </div>
                  <div className="step-label">Ready</div>
                  <div className="step-time">Plated</div>
                </div>

                <div
                  className={`step-node ${currentStep >= 4 ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    <i className="fa-solid fa-champagne-glasses"></i>
                  </div>
                  <div className="step-label">Served</div>
                  <div className="step-time">Enjoy meal!</div>
                </div>
              </div>

              {/* Order Details Summary */}
              <div className="tracker-receipt-summary">
                <div
                  className="tracker-guest-table-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.5rem'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '0.5rem' }}>
                    Guest: <strong>{activeOrder.customerName}</strong>
                  </span>
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {activeOrder.diningMode === 'dine-in'
                      ? `Table #${activeOrder.tableNumber}`
                      : 'Takeaway'}
                  </span>
                </div>

                {/* Responsive Receipt Items Display */}
                <div className="tracker-items-container">
                  {/* Desktop Table View */}
                  <table className="tracker-items-table desktop-only-table">
                    <thead>
                      <tr>
                        <th>Dish</th>
                        <th>Spice / Options</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            {item.spiceLevel || 'Standard'}{' '}
                            {item.addOns && item.addOns.length > 0 && (
                              <>
                                <br />
                                <small>+{item.addOns.join(', ')}</small>
                              </>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Clean Receipt Rows View */}
                  <div className="tracker-items-mobile-list">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="tracker-mobile-item-row">
                        <div className="tracker-mobile-item-info">
                          <strong className="tracker-mobile-item-name">{item.name}</strong>
                          <div className="tracker-mobile-item-sub">
                            <span>{item.spiceLevel || 'Standard'}</span>
                            {item.addOns && item.addOns.length > 0 && (
                              <span> &bull; +{item.addOns.join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <div className="tracker-mobile-item-price-col">
                          <span className="tracker-mobile-item-qty">&times;{item.quantity}</span>
                          <span className="tracker-mobile-item-total">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tracker-total-bill-row">
                  <span>Total Bill:</span>
                  <span className="tracker-total-bill-amount" style={{ color: '#FF5900', fontWeight: 800 }}>
                    ${activeOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
