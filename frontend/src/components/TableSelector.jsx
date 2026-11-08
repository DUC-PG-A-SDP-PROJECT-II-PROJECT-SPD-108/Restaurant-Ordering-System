import React from 'react';
import { useCart } from '../context/CartContext';

const AVAILABLE_TABLES = [
  { id: '01', name: 'Table 01', zone: 'Patio Terrace' },
  { id: '02', name: 'Table 02', zone: 'Window View' },
  { id: '03', name: 'Table 03', zone: 'Cozy Booth' },
  { id: '04', name: 'Table 04', zone: 'Main Dining Hall' },
  { id: '05', name: 'Table 05', zone: 'VIP Wine Lounge' },
  { id: '06', name: 'Table 06', zone: 'Main Dining Hall' },
  { id: '07', name: 'Table 07', zone: 'Patio Terrace' },
  { id: '08', name: 'Table 08', zone: 'Chef Counter' }
];

export default function TableSelector({ onChange }) {
  const { tableNumber, setTableNumber, isQrScanned } = useCart();

  const handleSelect = (e) => {
    const val = e.target.value;
    setTableNumber(val);
    if (onChange) onChange(val);
  };

  return (
    <div className="table-selector-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label htmlFor="table-number-select" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        <i className="fa-solid fa-chair" style={{ marginRight: '0.3rem', color: 'var(--primary)' }}></i>
        Table:
      </label>
      <select
        id="table-number-select"
        className="context-select"
        value={tableNumber}
        onChange={handleSelect}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        {AVAILABLE_TABLES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.zone})
          </option>
        ))}
      </select>
      {isQrScanned && (
        <span
          title="Table set from scanned QR code"
          style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            background: 'var(--accent-light)',
            color: 'var(--accent-hover)',
            borderRadius: '4px',
            fontWeight: 700
          }}
        >
          QR Locked
        </span>
      )}
    </div>
  );
}

