import React from 'react';
import { useCart } from '../context/CartContext';

export default function DishCard({ dish, onOpenCustomizer, onShowToast }) {
  const { addItem } = useCart();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addItem(dish, 1, dish.spiceLevels ? dish.spiceLevels[0] : 'Standard', []);
    if (onShowToast) {
      onShowToast(`Added "${dish.name}" to cart!`, 'success');
    }
  };

  return (
    <div className="dish-card" data-dish-id={dish.id} onClick={() => onOpenCustomizer(dish)}>
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
        <div className="dish-rating-pill">
          <i className="fa-solid fa-star"></i>
          <span>{dish.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="dish-content">
        <div className="dish-header">
          <h3 className="dish-title">{dish.name}</h3>
          <span className="dish-price">${dish.price.toFixed(2)}</span>
        </div>

        <p className="dish-desc">{dish.description}</p>

        <div className="dish-tags">
          <span className="dish-tag">
            <i className="fa-solid fa-clock"></i> {dish.prepTime}
          </span>
          <span className="dish-tag">
            <i className="fa-solid fa-fire"></i> {dish.calories}
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
            onClick={(e) => {
              e.stopPropagation();
              onOpenCustomizer(dish);
            }}
          >
            <i className="fa-solid fa-sliders"></i> Customize
          </button>
          <button
            type="button"
            className="btn btn-add-cart"
            onClick={handleQuickAdd}
          >
            <i className="fa-solid fa-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
