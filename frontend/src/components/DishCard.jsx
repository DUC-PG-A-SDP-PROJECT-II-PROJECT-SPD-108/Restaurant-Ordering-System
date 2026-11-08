import React from 'react';
import { useCart } from '../context/CartContext';

export default function DishCard({ dish, onOpenCustomizer, onShowToast }) {
  const { addItem } = useCart();
  const isOutOfStock = dish.inStock === false || dish.stockCount <= 0;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) {
      if (onShowToast) onShowToast(`"${dish.name}" is currently sold out!`, 'warning');
      return;
    }
    addItem(dish, 1, dish.spiceLevels ? dish.spiceLevels[0] : 'Standard', []);
    if (onShowToast) {
      onShowToast(`Added "${dish.name}" to cart!`, 'success');
    }
  };

  return (
    <div
      className={`dish-card ${isOutOfStock ? 'dish-out-of-stock' : ''}`}
      data-dish-id={dish.id}
      onClick={() => {
        if (!isOutOfStock) onOpenCustomizer(dish);
      }}
      style={{ opacity: isOutOfStock ? 0.72 : 1 }}
    >
      <div className="dish-image-wrapper">
        <img
          src={dish.image}
          alt={dish.name}
          className="dish-image"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />
        {isOutOfStock ? (
          <span className="dish-badge-pill" style={{ background: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
            <i className="fa-solid fa-ban"></i> Sold Out
          </span>
        ) : (
          <>
            {dish.isChefPick && (
              <span className="dish-badge-pill hot">
                <i className="fa-solid fa-star"></i> Chef Pick
              </span>
            )}
            {dish.isVegetarian && (
              <span className="dish-badge-pill veg">
                <i className="fa-solid fa-leaf"></i> Veg
              </span>
            )}
          </>
        )}
        <div className="dish-rating-pill">
          <i className="fa-solid fa-star"></i>
          <span>{dish.rating ? dish.rating.toFixed(1) : '5.0'}</span>
        </div>
      </div>

      <div className="dish-content">
        <div className="dish-header">
          <h3 className="dish-title">{dish.name}</h3>
          <span className="dish-price">${Number(dish.price).toFixed(2)}</span>
        </div>

        <p className="dish-desc">{dish.description}</p>

        <div className="dish-tags">
          <span className="dish-tag">
            <i className="fa-solid fa-clock"></i> {dish.prepTime || '15 mins'}
          </span>
          <span className="dish-tag">
            <i className="fa-solid fa-fire"></i> {dish.calories || '550 kcal'}
          </span>
          {dish.isSpicy && (
            <span className="dish-tag text-danger">
              <i className="fa-solid fa-pepper-hot"></i> Spicy
            </span>
          )}
        </div>

        <div className="dish-footer">
          <button
            type="button"
            className="btn-customize-link"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) onOpenCustomizer(dish);
            }}
          >
            <i className="fa-solid fa-sliders"></i> Customize
          </button>
          <button
            type="button"
            className={`btn ${isOutOfStock ? 'btn-secondary' : 'btn-add-cart'}`}
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
          >
            {isOutOfStock ? (
              <>
                <i className="fa-solid fa-circle-xmark"></i> Sold Out
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus"></i> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
