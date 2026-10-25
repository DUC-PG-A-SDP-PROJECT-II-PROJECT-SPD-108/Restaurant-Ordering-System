import React from 'react';
import { MENU_CATEGORIES } from '../data/mockData';

export default function CategoryPills({ activeCategory, setActiveCategory }) {
  return (
    <div className="category-nav-wrapper">
      <div className="category-pills" id="category-pills-list">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <i className={cat.icon}></i>
            <span>{cat.name}</span>
            <span className="cat-count">({cat.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
