import React from 'react';
import { useMenu } from '../context/MenuContext';

export default function CategoryPills({ activeCategory, setActiveCategory, categories: customCategories }) {
  const { categories: contextCategories } = useMenu();
  const categories = customCategories || contextCategories || [];

  return (
    <div className="category-nav-wrapper">
      <div className="category-pills" id="category-pills-list">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <i className={cat.icon || 'fa-solid fa-utensils'}></i>
            <span>{cat.name}</span>
            <span className="cat-count">({cat.count ?? 0})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
