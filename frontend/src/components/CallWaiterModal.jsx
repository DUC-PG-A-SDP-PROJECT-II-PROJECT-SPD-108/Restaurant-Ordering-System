import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useCart } from '../context/CartContext';

export default function CallWaiterModal({ isOpen, onClose, onShowToast }) {
  const { requestService, activeServiceRequests } = useOrders();
  const { tableNumber } = useCart();
  const [selectedTable, setSelectedTable] = useState(tableNumber || '04');
  const [selectedService, setSelectedService] = useState('waiter');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentTableRequests = activeServiceRequests.filter(
    r => r.tableNumber === String(selectedTable).padStart(2, '0')
  );

  const SERVICE_OPTIONS = [
    {
      id: 'waiter',
      title: 'Call Server',
      khTitle: 'ហៅអ្នករត់តុ',
      desc: 'General assistance or menu questions',
      icon: 'fa-solid fa-bell',
      color: '#f59e0b'
    },
    {
      id: 'water',
      title: 'Water & Ice Refill',
      khTitle: 'សុំទឹកពិសារ',
      desc: 'Fresh iced water, extra ice, or napkins',
      icon: 'fa-solid fa-glass-water',
      color: '#06b6d4'
    },
    {
      id: 'bill',
      title: 'Request Bill / Pay',
      khTitle: 'សុំគិតប្រាក់',
      desc: 'Ready to pay cash or request paper receipt',
      icon: 'fa-solid fa-receipt',
      color: '#10b981'
    },
    {
      id: 'clean',
      title: 'Clear / Clean Table',
      khTitle: 'សម្អាតតុ',
      desc: 'Clear empty plates and wipe table',
      icon: 'fa-solid fa-broom',
      color: '#8b5cf6'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const req = requestService({
      tableNumber: selectedTable,
      serviceType: selectedService,
      customMessage: note.trim()
    });

    setIsSubmitting(false);
    if (onShowToast) {
      onShowToast(`🛎️ Staff alerted for Table ${req.tableNumber}! A server is on the way.`, 'success');
    }
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-container"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '460px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}
            >
              <i className="fa-solid fa-bell-concierge"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Table Service Request</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>កោះហៅបុគ្គលិក &bull; Instant Staff Dispatch</span>
            </div>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Active Pending Request Alert (if any) */}
          {currentTableRequests.length > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid var(--primary)',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--primary-dark)'
              }}
            >
              <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
              <span>
                Active call for <strong>Table {selectedTable}</strong>: {currentTableRequests[0].label}. Server has been notified!
              </span>
            </div>
          )}

          {/* Table Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              YOUR DINING TABLE / លេខតុរបស់អ្នក
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {['01', '02', '03', '04', '05', '06', '07', '08'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTable(t)}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: selectedTable === t ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: selectedTable === t ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                    color: selectedTable === t ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: selectedTable === t ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Table {t}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Service Action Buttons */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-muted)' }}>
              HOW CAN WE ASSIST YOU? / តម្រូវការសេវាកម្ម
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {SERVICE_OPTIONS.map((opt) => {
                const isSelected = selectedService === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedService(opt.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                      background: isSelected ? `${opt.color}12` : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: `${opt.color}25`,
                          color: opt.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem'
                        }}
                      >
                        <i className={opt.icon}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? opt.color : 'inherit' }}>
                          {opt.title} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>({opt.khTitle})</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                      </div>
                    </div>

                    <div style={{ color: isSelected ? opt.color : 'var(--border-color)', fontSize: '1.1rem' }}>
                      <i className={isSelected ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
              SPECIFIC REQUEST (OPTIONAL) / សំណូមពរបន្ថែម
            </label>
            <input
              type="text"
              placeholder="e.g. Extra hot chili sauce, 2 more forks, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              gap: '0.5rem',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span>Send Alert to Staff &bull; បញ្ជូនសំណើ</span>
          </button>
        </form>
      </div>
    </div>
  );
}

