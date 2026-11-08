import React, { useEffect } from 'react';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  icon = 'fa-solid fa-trash-can',
  isAlert = false,
  onConfirm,
  onCancel,
  children
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          iconBg: 'rgba(239, 68, 68, 0.12)',
          iconColor: '#ef4444',
          btnBg: '#ef4444',
          btnBorder: '#ef4444',
          btnColor: '#ffffff'
        };
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.15)',
          iconColor: '#f59e0b',
          btnBg: 'var(--primary)',
          btnBorder: 'var(--primary)',
          btnColor: '#ffffff'
        };
      case 'primary':
      default:
        return {
          iconBg: 'rgba(59, 130, 246, 0.12)',
          iconColor: '#3b82f6',
          btnBg: '#2563eb',
          btnBorder: '#2563eb',
          btnColor: '#ffffff'
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div
        className="confirm-dialog-card"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-color)',
          width: '100%',
          maxWidth: '430px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'center',
          padding: '2rem 1.75rem 1.5rem'
        }}
      >
        {/* Top Decorative Icon */}
        <div
          style={{
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: variant.iconBg,
            color: variant.iconColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            marginBottom: '1.25rem',
            border: `1px solid ${variant.iconColor}33`,
            boxShadow: `0 8px 20px ${variant.iconColor}22`
          }}
        >
          <i className={icon}></i>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 0.5rem',
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-main)'
          }}
        >
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p
            style={{
              margin: '0 0 1.25rem',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>
        )}

        {children}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '1.5rem'
          }}
        >
          {!isAlert && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.65rem 1.1rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                justifyContent: 'center'
              }}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.65rem 1.1rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: 'var(--radius-sm)',
              background: variant.btnBg,
              borderColor: variant.btnBorder,
              color: variant.btnColor,
              justifyContent: 'center',
              boxShadow: `0 4px 14px ${variant.iconColor}33`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

