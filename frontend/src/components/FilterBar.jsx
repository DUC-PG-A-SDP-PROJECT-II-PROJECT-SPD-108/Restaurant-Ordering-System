import React from 'react';

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  dietaryFilter,
  setDietaryFilter,
  sortBy,
  setSortBy
}) {
  return (
    <div className="menu-control-bar">
      {/* Search Bar */}
      <div className="search-input-wrapper">
        <i className="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          type="text"
          id="menu-search-input"
          placeholder="Search dishes, ingredients, drinks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            className="clear-search-btn"
            id="clear-search-btn"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* Dietary Filter Chips */}
      <div className="dietary-filter-group" id="dietary-filters">
        <button
          className={`dietary-chip ${dietaryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('all')}
        >
          All Items
        </button>
        <button
          className={`dietary-chip ${dietaryFilter === 'vegetarian' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('vegetarian')}
        >
          <i className="fa-solid fa-leaf"></i> Vegetarian
        </button>
        <button
          className={`dietary-chip ${dietaryFilter === 'spicy' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('spicy')}
        >
          <i className="fa-solid fa-pepper-hot"></i> Spicy
        </button>
        <button
          className={`dietary-chip ${dietaryFilter === 'chef' ? 'active' : ''}`}
          onClick={() => setDietaryFilter('chef')}
        >
          <i className="fa-solid fa-star"></i> Chef's Pick
        </button>
      </div>

      {/* Sort Selector */}
      <div className="sort-selector-wrapper">
        <label htmlFor="menu-sort-select">
          <i className="fa-solid fa-arrow-down-short-wide"></i> Sort:
        </label>
        <select
          id="menu-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="featured">Featured First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
    </div>
  );
}
