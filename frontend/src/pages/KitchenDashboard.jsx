import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';

function formatTimeAgo(timestamp) {
  try {
    const elapsedMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes === 1) return '1 min ago';
    if (elapsedMinutes < 60) return `${elapsedMinutes} mins ago`;
    const hours = Math.floor(elapsedMinutes / 60);
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'Recently';
  }
}

export default function KitchenDashboard({ onShowToast }) {
  const { orders, kdsStats, updateOrderStatus, simulateDemoOrder } = useOrders();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return ['pending', 'cooking', 'ready'].includes(o.status);
    if (filterStatus === 'completed') return ['served', 'cancelled'].includes(o.status);
    return o.status === filterStatus;
  });

  const handleSimulate = () => {
    const newOrd = simulateDemoOrder();
    if (onShowToast) {
      onShowToast(`Simulated new incoming order #${newOrd.id}!`, 'success');
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    if (onShowToast) {
      onShowToast(`Order #${orderId} moved to "${newStatus.toUpperCase()}"`, 'info');
    }
  };

  return (
    <section className="app-view active-view" id="kitchen-view">
      {/* Header */}
      <div className="kitchen-header">
        <div className="kds-title-wrap">
          <div className="kds-live-badge">
            <span className="pulse-dot"></span> LIVE KDS
          </div>
          <h2>Kitchen Order Management Station</h2>
        </div>
        <div className="kds-stats-strip">
          <div className="stat-pill">
            <span className="stat-num" id="kds-total-orders">
              {kdsStats.totalActive}
            </span>{' '}
            Active Orders
          </div>
          <div className="stat-pill">
            <span className="stat-num text-warning" id="kds-prep-orders">
              {kdsStats.cooking}
            </span>{' '}
            In Preparation
          </div>
          <div className="stat-pill">
            <span className="stat-num text-success" id="kds-ready-orders">
              {kdsStats.ready}
            </span>{' '}
            Ready to Serve
          </div>
          <div className="stat-pill">
            <span className="stat-num text-accent" id="kds-total-revenue">
              ${kdsStats.totalRevenue.toFixed(2)}
            </span>{' '}
            Today's Sales
          </div>
        </div>
      </div>

      {/* Filter Tabs & Simulate Action */}
      <div className="kds-filter-bar">
        <div className="kds-tabs">
          <button
            type="button"
            className={`kds-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Active (<span>{kdsStats.totalActive}</span>)
          </button>
          <button
            type="button"
            className={`kds-tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            New Orders (<span>{kdsStats.pending}</span>)
          </button>
          <button
            type="button"
            className={`kds-tab-btn ${filterStatus === 'cooking' ? 'active' : ''}`}
            onClick={() => setFilterStatus('cooking')}
          >
            Cooking (<span>{kdsStats.cooking}</span>)
          </button>
          <button
            type="button"
            className={`kds-tab-btn ${filterStatus === 'ready' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ready')}
          >
            Ready to Serve (<span>{kdsStats.ready}</span>)
          </button>
          <button
            type="button"
            className={`kds-tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed History
          </button>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-secondary"
          id="kds-seed-demo-btn"
          title="Simulate incoming order for testing"
          onClick={handleSimulate}
        >
          <i className="fa-solid fa-plus"></i> Simulate New Order
        </button>
      </div>

      {/* Orders Grid */}
      <div className="kds-grid" id="kds-orders-grid">
        {filteredOrders.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '4rem 1rem',
              color: 'var(--text-light)'
            }}
          >
            <i
              className="fa-solid fa-check-circle"
              style={{ fontSize: '3rem', marginBottom: '0.75rem' }}
            ></i>
            <h3>No orders in this station</h3>
            <p>Click "Simulate New Order" to generate test tickets.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`kds-ticket-card status-${order.status}`}
            >
              <div className="kds-ticket-header">
                <div>
                  <span className="kds-order-num">{order.id}</span>
                  <span
                    className={`order-status-badge status-${order.status}`}
                    style={{ marginLeft: '0.4rem' }}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="kds-timer-pill">
                  <i className="fa-solid fa-stopwatch"></i> {formatTimeAgo(order.timestamp)}
                </div>
              </div>

              <div className="kds-ticket-body">
                <div className="kds-customer-row">
                  <span>
                    <strong>Guest:</strong> {order.customerName}
                  </span>
                  <span>
                    <strong>
                      {order.diningMode === 'dine-in'
                        ? `Table #${order.tableNumber}`
                        : 'Takeaway'}
                    </strong>
                  </span>
                </div>

                <ul className="kds-items-list">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="kds-item-entry">
                      <div>
                        <span className="kds-item-qty">{item.quantity}x</span>
                        <span>{item.name}</span>
                        <span className="kds-item-note">
                          &bull; {item.spiceLevel}{' '}
                          {item.addOns && item.addOns.length > 0
                            ? `[+${item.addOns.join(', ')}]`
                            : ''}
                        </span>
                        {item.note && (
                          <span className="kds-item-note text-warning">
                            Note: "{item.note}"
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {order.specialNotes && (
                  <div className="kds-special-alert">
                    <strong>
                      <i className="fa-solid fa-circle-exclamation"></i> Kitchen Note:
                    </strong>{' '}
                    {order.specialNotes}
                  </div>
                )}
              </div>

              <div className="kds-ticket-footer">
                {order.status === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-sm"
                    onClick={() => handleStatusChange(order.id, 'cooking')}
                  >
                    <i className="fa-solid fa-fire-burner"></i> Start Cooking
                  </button>
                )}

                {order.status === 'cooking' && (
                  <button
                    type="button"
                    className="btn btn-accent btn-block btn-sm"
                    onClick={() => handleStatusChange(order.id, 'ready')}
                  >
                    <i className="fa-solid fa-bell-concierge"></i> Mark Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-block btn-sm"
                    onClick={() => handleStatusChange(order.id, 'served')}
                  >
                    <i className="fa-solid fa-circle-check"></i> Complete &amp; Serve
                  </button>
                )}

                {['served', 'cancelled'].includes(order.status) && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-light)',
                      fontWeight: 700
                    }}
                  >
                    ORDER CLOSED
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
