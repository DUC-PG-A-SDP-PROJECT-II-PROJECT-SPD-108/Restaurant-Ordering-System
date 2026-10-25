import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function DishModal({ dish, onClose, onShowToast }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSpice, setSelectedSpice] = useState(
    dish?.spiceLevels ? dish.spiceLevels[0] : 'Standard'
  );
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [specialNote, setSpecialNote] = useState('');

  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSelectedSpice(dish.spiceLevels ? dish.spiceLevels[0] : 'Standard');
      setSelectedAddOns([]);
      setSpecialNote('');
    }
  }, [dish]);

  if (!dish) return null;

  const handleToggleAddOn = (addon) => {
    setSelectedAddOns(prev => {
      const exists = prev.some(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const currentUnitPrice = (Number(dish.price) + addOnsTotal);
  const currentTotalPrice = currentUnitPrice * quantity;

  const handleAddToCart = () => {
    addItem(dish, quantity, selectedSpice, selectedAddOns, specialNote);
    if (onShowToast) {
      onShowToast(`Added ${quantity}x "${dish.name}" to cart!`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" id="dish-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-btn"
          id="close-dish-modal-btn"
          aria-label="Close modal"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="dish-modal-body" id="dish-modal-content">
          <img src={dish.image} alt={dish.name} className="dish-modal-img" />

          <div className="dish-modal-body-content">
            <h2 className="modal-dish-title">{dish.name}</h2>
            <div className="modal-dish-price" id="modal-live-price">
              ${currentTotalPrice.toFixed(2)}{' '}
              {quantity > 1 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  (${currentUnitPrice.toFixed(2)} each)
                </span>
              )}
            </div>
            <p className="modal-dish-desc">{dish.description}</p>

            {/* Spice Selector */}
            {dish.spiceLevels && dish.spiceLevels.length > 0 && (
              <div className="custom-option-group">
                <div className="option-group-title">
                  <i className="fa-solid fa-pepper-hot"></i> Spice &amp; Flavor Preference
                </div>
                <div className="spice-selector" id="modal-spice-selector">
                  {dish.spiceLevels.map((spice) => (
                    <div
                      key={spice}
                      className={`spice-chip ${selectedSpice === spice ? 'selected' : ''}`}
                      onClick={() => setSelectedSpice(spice)}
                    >
                      {spice}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons list */}
            {dish.addOns && dish.addOns.length > 0 && (
              <div className="custom-option-group">
                <div className="option-group-title">
                  <i className="fa-solid fa-plus-circle"></i> Artisan Add-ons &amp; Upgrades
                </div>
                <div className="addons-list">
                  {dish.addOns.map((addon) => {
                    const isChecked = selectedAddOns.some(a => a.name === addon.name);
                    return (
                      <label
                        key={addon.name}
                        className="checkbox-option"
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{addon.name}</span>
                        <div>
                          <strong className="text-accent">+${addon.price.toFixed(2)}</strong>
                          <input
                            type="checkbox"
                            className="addon-checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAddOn(addon)}
                            style={{ marginLeft: '0.5rem' }}
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Request */}
            <div className="custom-option-group">
              <div className="option-group-title">
                <i className="fa-solid fa-comment-dots"></i> Special Kitchen Request
              </div>
              <input
                type="text"
                id="modal-item-note"
                placeholder="e.g. dressing on the side, no onion"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-subtle)',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
              <div className="cart-qty-controls" style={{ padding: '4px 8px' }}>
                <button
                  type="button"
                  className="qty-btn"
                  id="modal-qty-minus"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="qty-val" id="modal-qty-val" style={{ minWidth: '28px' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  id="modal-qty-plus"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                id="modal-add-to-order-btn"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
              >
                <span>Add to Order</span> • <span>${currentTotalPrice.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
