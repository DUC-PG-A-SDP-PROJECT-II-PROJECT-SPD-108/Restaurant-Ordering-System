import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  const getTitle = (type) => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Notice';
      case 'error':
        return 'Attention';
      case 'info':
      default:
        return 'Notification';
    }
  };

  return (
    <div className="toast-container" id="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-notification ${toast.type || 'info'}`}
          onClick={() => onDismiss(toast.id)}
          title="Click to dismiss"
        >
          <div className="toast-icon-circle">
            {toast.type === 'success' && <i className="fa-solid fa-check"></i>}
            {toast.type === 'warning' && <i className="fa-solid fa-triangle-exclamation"></i>}
            {toast.type === 'error' && <i className="fa-solid fa-xmark"></i>}
            {(!toast.type || toast.type === 'info') && <i className="fa-solid fa-tag"></i>}
          </div>
          <div className="toast-content-wrapper">
            <div className="toast-title">{getTitle(toast.type)}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            aria-label="Close notification"
            title="Dismiss"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
