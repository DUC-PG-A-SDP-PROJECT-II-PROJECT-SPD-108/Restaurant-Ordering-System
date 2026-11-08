import React, { useState, useEffect } from 'react';
import { createVoucher, updateVoucher } from '../services/supabaseClient';

export default function VoucherFormModal({
  isOpen,
  onClose,
  editingVoucher,
  onSaveSuccess,
  onShowToast
}) {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingVoucher) {
      setCode(editingVoucher.code || '');
      setDiscountPercent(String(editingVoucher.discountPercent || 10));
      setDescription(editingVoucher.description || '');
      setIsActive(editingVoucher.isActive !== false);
      setIsFeatured(Boolean(editingVoucher.isFeatured));
    } else {
      setCode('');
      setDiscountPercent('15');
      setDescription('');
      setIsActive(true);
      setIsFeatured(false);
    }
    setErrorMsg('');
  }, [editingVoucher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const numPercent = parseFloat(discountPercent);

    if (!trimmedCode) {
      setErrorMsg('Promo code is required (e.g. VIP20)');
      return;
    }

    if (isNaN(numPercent) || numPercent <= 0 || numPercent > 100) {
      setErrorMsg('Discount percentage must be between 1% and 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: trimmedCode,
        discountPercent: numPercent,
        description: description.trim() || `${numPercent}% Off Order Special`,
        isActive,
        isFeatured
      };

      let result;
      if (editingVoucher && editingVoucher.id) {
        result = await updateVoucher(editingVoucher.id, payload);
      } else {
        result = await createVoucher(payload);
      }

      if (result) {
        result.isFeatured = isFeatured;
        if (onShowToast) {
          onShowToast(
            editingVoucher ? `Voucher "${trimmedCode}" updated!` : `Voucher "${trimmedCode}" created!`,
            'success'
          );
        }
        if (onSaveSuccess) onSaveSuccess(result);
        onClose();
      } else {
        // Fallback for local update if Supabase network fails
        const fallbackObj = {
          id: editingVoucher?.id || Date.now(),
          ...payload,
          createdAt: new Date().toISOString()
        };
        if (onShowToast) {
          onShowToast(
            editingVoucher ? `Voucher "${trimmedCode}" updated locally!` : `Voucher "${trimmedCode}" saved locally!`,
            'info'
          );
        }
        if (onSaveSuccess) onSaveSuccess(fallbackObj);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error saving voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex' }}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '460px', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
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
              marginBottom: '0.5rem'
            }}
          >
            <i className="fa-solid fa-tags"></i>
          </div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>
            {editingVoucher ? 'Edit Discount Voucher' : 'Create New Discount Voucher'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            {editingVoucher
              ? 'Update promotional rate, description or status.'
              : 'Add promo code for customer checkout discounts.'}
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--danger)',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Promo Code <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. VIP20 or WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Letters and numbers only. Guests enter this at checkout.
            </span>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Discount Percentage (%) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                placeholder="15"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  color: 'var(--text-muted)'
                }}
              >
                %
              </span>
            </div>
            {/* Quick preset percentage buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              {[5, 10, 15, 20, 25, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    background: String(discountPercent) === String(preset) ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: String(discountPercent) === String(preset) ? 'var(--primary)' : 'var(--text-muted)',
                    borderColor: String(discountPercent) === String(preset) ? 'var(--primary)' : 'var(--border-color)'
                  }}
                  onClick={() => setDiscountPercent(String(preset))}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Voucher Description / Notes</label>
            <input
              type="text"
              placeholder="e.g. 15% VIP dining discount"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              marginTop: '0.25rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Active Status</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isActive ? 'Available for guests to apply' : 'Temporarily disabled'}
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', margin: 0 }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isActive ? 'var(--accent)' : '#94a3b8',
                  borderRadius: '24px',
                  transition: '0.25s'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: isActive ? '22px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.25s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </span>
            </label>
          </div>

          {/* Feature on Homepage Hero Banner Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: isFeatured ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: isFeatured ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              marginTop: '0.25rem',
              transition: 'var(--transition)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i>
                <span>Feature on Homepage Hero Banner</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isFeatured ? 'Displayed in the Customer Storefront banner card' : 'Hidden from main banner (still usable via code)'}
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', margin: 0 }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isFeatured ? 'var(--primary)' : '#94a3b8',
                  borderRadius: '24px',
                  transition: '0.25s'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: isFeatured ? '22px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.25s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

