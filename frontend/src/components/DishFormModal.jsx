import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext';

const SAMPLE_IMAGES = [
  { name: 'Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80' },
  { name: 'Salad', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80' },
  { name: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80' },
  { name: 'Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=700&q=80' },
  { name: 'Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80' },
  { name: 'Drink', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80' }
];

export default function DishFormModal({ isOpen, onClose, editingDish = null, onShowToast }) {
  const { addDish, updateDish, categories } = useMenu();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('mains');
  const [price, setPrice] = useState('12.00');
  const [prepTime, setPrepTime] = useState('15 mins');
  const [calories, setCalories] = useState('500 kcal');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(SAMPLE_IMAGES[0].url);
  const [inStock, setInStock] = useState(true);
  const [isChefPick, setIsChefPick] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingDish) {
      setName(editingDish.name || '');
      setCategory(editingDish.category || 'mains');
      setPrice(editingDish.price?.toString() || '12.00');
      setPrepTime(editingDish.prepTime || '15 mins');
      setCalories(editingDish.calories || '500 kcal');
      setDescription(editingDish.description || '');
      setImage(editingDish.image || SAMPLE_IMAGES[0].url);
      setInStock(editingDish.inStock !== false);
      setIsChefPick(Boolean(editingDish.isChefPick));
      setIsVegetarian(Boolean(editingDish.isVegetarian));
      setIsSpicy(Boolean(editingDish.isSpicy));
    } else {
      setName('');
      setCategory('mains');
      setPrice('12.00');
      setPrepTime('15 mins');
      setCalories('500 kcal');
      setDescription('');
      setImage(SAMPLE_IMAGES[0].url);
      setInStock(true);
      setIsChefPick(false);
      setIsVegetarian(false);
      setIsSpicy(false);
    }
    setErrorMsg('');
  }, [editingDish, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please provide a dish name.');
      if (onShowToast) onShowToast('Please provide a dish name.', 'warning');
      return;
    }

    const dishData = {
      name: name.trim(),
      category,
      price: parseFloat(price) || 0,
      prepTime: prepTime.trim() || '15 mins',
      calories: calories.trim() || '500 kcal',
      description: description.trim(),
      image: image.trim() || SAMPLE_IMAGES[0].url,
      inStock,
      isChefPick,
      isVegetarian,
      isSpicy
    };

    if (editingDish) {
      updateDish(editingDish.id, dishData);
      if (onShowToast) onShowToast(`Updated "${dishData.name}"`, 'success');
    } else {
      addDish(dishData);
      if (onShowToast) onShowToast(`Created new dish "${dishData.name}"`, 'success');
    }

    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.75rem',
          boxSizing: 'border-box',
          borderRadius: '20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
          style={{ top: '1rem', right: '1rem' }}
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 4px 12px var(--primary-glow)',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
              {editingDish ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure culinary details, pricing, tags &amp; stock availability.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--danger)'
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Live Image Preview Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            boxSizing: 'border-box'
          }}
        >
          <img
            src={image}
            alt="Dish preview"
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '2px solid var(--border-color)',
              flexShrink: 0
            }}
            onError={(e) => {
              e.target.src = SAMPLE_IMAGES[0].url;
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Live Photo Preview
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name || 'Untitled Dish'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ${parseFloat(price || 0).toFixed(2)} &bull; {category.toUpperCase()}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
          {/* Row 1: Dish Title & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="fa-solid fa-tag" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Dish Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Crispy Honey Garlic Ribs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <i className="fa-solid fa-layer-group" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                {categories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Price, Prep Time, Calories */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Price ($) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="12.00"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Prep Time
              </label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15 mins"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Calories
              </label>
              <input
                type="text"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="500 kcal"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="form-group" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              Culinary Description
            </label>
            <textarea
              rows="2"
              placeholder="Fresh ingredients, culinary notes, serving suggestions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Row 4: Image URL & Quick Presets */}
          <div className="form-group" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              Image URL
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              {SAMPLE_IMAGES.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: image === preset.url ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: image === preset.url ? '#fff' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setImage(preset.url)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Modern Interactive Feature Badges & Stock Switch */}
          <div
            style={{
              padding: '0.85rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* In-Stock Toggle Card */}
            <div
              onClick={() => setInStock(!inStock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: inStock ? 'var(--accent-light)' : 'var(--danger-light)',
                border: inStock ? '1px solid var(--accent)' : '1px solid var(--danger)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className={inStock ? 'fa-solid fa-circle-check text-success' : 'fa-solid fa-ban text-danger'} style={{ fontSize: '1.1rem' }}></i>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: inStock ? 'var(--accent-hover)' : 'var(--danger)' }}>
                    {inStock ? 'In Stock (Available for Guests)' : 'Sold Out (Temporarily Disabled)'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {inStock ? 'Dish will appear in customer menu as orderable' : 'Customers will see a Sold Out badge'}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: inStock ? 'var(--accent)' : 'var(--danger)',
                  color: '#ffffff'
                }}
              >
                {inStock ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>

            {/* Tags Pills: Chef Pick, Veg, Spicy */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsChefPick(!isChefPick)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  border: isChefPick ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isChefPick ? 'var(--primary-light)' : 'var(--bg-surface)',
                  color: isChefPick ? 'var(--primary-hover)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-star" style={{ color: isChefPick ? 'var(--primary)' : 'inherit' }}></i>
                Chef Pick
              </button>

              <button
                type="button"
                onClick={() => setIsVegetarian(!isVegetarian)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  border: isVegetarian ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: isVegetarian ? 'var(--accent-light)' : 'var(--bg-surface)',
                  color: isVegetarian ? 'var(--accent-hover)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-leaf" style={{ color: isVegetarian ? 'var(--accent)' : 'inherit' }}></i>
                Vegetarian
              </button>

              <button
                type="button"
                onClick={() => setIsSpicy(!isSpicy)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  border: isSpicy ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                  background: isSpicy ? 'var(--danger-light)' : 'var(--bg-surface)',
                  color: isSpicy ? 'var(--danger)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-pepper-hot" style={{ color: isSpicy ? 'var(--danger)' : 'inherit' }}></i>
                Spicy
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <i className="fa-solid fa-circle-check"></i>
              {editingDish ? 'Save Changes' : 'Create Dish'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
