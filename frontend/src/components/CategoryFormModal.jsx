import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext';

const POPULAR_CATEGORY_ICONS = [
  { icon: 'fa-solid fa-utensils', label: 'Mains' },
  { icon: 'fa-solid fa-drumstick-bite', label: 'Meat & Grill' },
  { icon: 'fa-solid fa-plate-wheat', label: 'Starters' },
  { icon: 'fa-solid fa-wheat-awn', label: 'Pastas' },
  { icon: 'fa-solid fa-cake-candles', label: 'Desserts' },
  { icon: 'fa-solid fa-martini-glass-citrus', label: 'Cocktails' },
  { icon: 'fa-solid fa-pizza-slice', label: 'Pizza' },
  { icon: 'fa-solid fa-burger', label: 'Burgers' },
  { icon: 'fa-solid fa-fish', label: 'Seafood' },
  { icon: 'fa-solid fa-mug-hot', label: 'Coffee & Tea' },
  { icon: 'fa-solid fa-fire', label: 'Grill / Spicy' },
  { icon: 'fa-solid fa-pepper-hot', label: 'Chili & Hot' },
  { icon: 'fa-solid fa-bread-slice', label: 'Bakery' },
  { icon: 'fa-solid fa-ice-cream', label: 'Ice Cream' },
  { icon: 'fa-solid fa-star', label: 'Chef Specials' },
  { icon: 'fa-solid fa-bowl-rice', label: 'Asian & Rice' },
  { icon: 'fa-solid fa-leaf', label: 'Vegan / Healthy' },
  { icon: 'fa-solid fa-beer-mug-empty', label: 'Craft Beers' },
  { icon: 'fa-solid fa-wine-glass', label: 'Fine Wines' },
  { icon: 'fa-solid fa-cheese', label: 'Dairy & Cheese' }
];

export default function CategoryFormModal({ isOpen, onClose, editingCategory = null, onShowToast }) {
  const { addCategory, updateCategory } = useMenu();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('fa-solid fa-utensils');
  const [description, setDescription] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name || '');
      setSlug(editingCategory.id || '');
      setIcon(editingCategory.icon || 'fa-solid fa-utensils');
      setDescription(editingCategory.description || '');
      setIsSlugManuallyEdited(true);
    } else {
      setName('');
      setSlug('');
      setIcon('fa-solid fa-utensils');
      setDescription('');
      setIsSlugManuallyEdited(false);
    }
    setErrorMsg('');
  }, [editingCategory, isOpen]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setErrorMsg('');
    if (!isSlugManuallyEdited && !editingCategory) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  };

  const handleSlugChange = (e) => {
    setIsSlugManuallyEdited(true);
    setSlug(
      e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please provide a category title.');
      if (onShowToast) onShowToast('Please provide a category title.', 'warning');
      return;
    }

    const cleanSlug = slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        icon: icon.trim() || 'fa-solid fa-utensils',
        description: description.trim()
      });
      if (onShowToast) onShowToast(`Updated category "${name.trim()}"`, 'success');
    } else {
      await addCategory({
        id: cleanSlug,
        name: name.trim(),
        icon: icon.trim() || 'fa-solid fa-utensils',
        description: description.trim()
      });
      if (onShowToast) onShowToast(`Added category "${name.trim()}"`, 'success');
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
        overflowY: 'auto',
        zIndex: 1100
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
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
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
              {editingCategory ? 'Edit Menu Category' : 'Add New Category'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure culinary taxonomy, icons &amp; menu grouping.
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

        {/* Live Customer Pill Preview Card */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Live Storefront Pill Preview
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <i className={icon}></i>
              <span>{name || 'Category Name'}</span>
              <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>(0)</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div>Slug Key:</div>
            <code style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
              {slug || (editingCategory ? editingCategory.id : 'auto-generated')}
            </code>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
          {/* Category Title */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fa-solid fa-tag" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Seafood &amp; Raw Bar, Gourmet Pizzas"
              value={name}
              onChange={handleNameChange}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Category Slug / Key */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fa-solid fa-key" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Identifier Slug *
            </label>
            <input
              type="text"
              placeholder="e.g. seafood, gourmet-pizzas"
              value={slug}
              onChange={handleSlugChange}
              disabled={Boolean(editingCategory)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: editingCategory ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                cursor: editingCategory ? 'not-allowed' : 'text'
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              {editingCategory
                ? 'Identifier slug cannot be modified once created to preserve menu references.'
                : 'Unique URL-safe code used for menu filters and dish association.'}
            </span>
          </div>

          {/* Icon Selector Grid */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                <i className="fa-solid fa-icons" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Category Icon
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Selected: <i className={icon} style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}></i>
              </span>
            </div>

            {/* Quick Icon Presets */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                gap: '0.4rem',
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '0.5rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                marginBottom: '0.5rem'
              }}
            >
              {POPULAR_CATEGORY_ICONS.map((item) => (
                <button
                  key={item.icon}
                  type="button"
                  title={item.label}
                  onClick={() => setIcon(item.icon)}
                  style={{
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: icon === item.icon ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: icon === item.icon ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                    color: icon === item.icon ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className={item.icon}></i>
                </button>
              ))}
            </div>

            {/* Custom Icon Class Input */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Custom FontAwesome class (e.g. fa-solid fa-drumstick-bite)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                style={{ flex: 1, fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  color: 'var(--primary)'
                }}
              >
                <i className={icon}></i>
              </div>
            </div>
          </div>

          {/* Description / Culinary Notes */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <i className="fa-solid fa-align-left" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}></i> Description (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Freshly caught Atlantic seafood, raw bar selections &amp; oysters."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginTop: '0.5rem'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
            >
              <i className={editingCategory ? 'fa-solid fa-check' : 'fa-solid fa-plus'}></i>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
