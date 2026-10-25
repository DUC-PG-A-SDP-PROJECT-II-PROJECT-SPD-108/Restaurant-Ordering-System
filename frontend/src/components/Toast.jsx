import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-notification ${toast.type || 'info'}`}
          onClick={() => onDismiss(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="toast-icon">
            {toast.type === 'success' && <i className="fa-solid fa-circle-check"></i>}
            {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation"></i>}
            {toast.type === 'error' && <i className="fa-solid fa-circle-xmark"></i>}
            {(!toast.type || toast.type === 'info') && <i className="fa-solid fa-circle-info"></i>}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      ))}
    </div>
  );
}
