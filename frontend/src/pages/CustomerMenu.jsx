import React, { useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import CategoryPills from '../components/CategoryPills';
import DishCard from '../components/DishCard';
import DishModal from '../components/DishModal';
import CartSidebar from '../components/CartSidebar';
import { MENU_ITEMS, MENU_CATEGORIES } from '../data/mockData';

export default function CustomerMenu({ onOpenCheckout, onShowToast, isMobileCartOpen, onCloseMobileCart }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [customizingDish, setCustomizingDish] = useState(null);

  // Filtering & Sorting logic
  const filteredDishes = MENU_ITEMS.filter((dish) => {
    const matchesCategory = activeCategory === 'all' || dish.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      dish.name.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query) ||
      dish.category.toLowerCase().includes(query);

    let matchesDietary = true;
    if (dietaryFilter === 'vegetarian') matchesDietary = dish.isVegetarian;
    if (dietaryFilter === 'spicy') matchesDietary = dish.isSpicy;
    if (dietaryFilter === 'chef') matchesDietary = dish.isChefPick;

    return matchesCategory && matchesSearch && matchesDietary;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const currentCatObj = MENU_CATEGORIES.find((c) => c.id === activeCategory) || MENU_CATEGORIES[0];

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setDietaryFilter('all');
    setSortBy('featured');
  };

  return (
    <section className="app-view active-view" id="customer-view">
      {/* Hero Banner */}
      <HeroBanner onShowToast={onShowToast} />

      {/* Search, Dietary Filters & Sort */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dietaryFilter={dietaryFilter}
        setDietaryFilter={setDietaryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Category Pills Navigation */}
      <CategoryPills
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Menu Layout Split Grid */}
      <div className="layout-split">
        {/* Menu Items Section */}
        <div className="menu-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title" id="active-category-title">
                {currentCatObj.name}
              </h2>
              <p className="section-subtitle" id="active-category-desc">
                Curated by Executive Chef Marco Rossi
              </p>
            </div>
            <span className="items-count-indicator" id="items-count-indicator">
              Showing {filteredDishes.length} item{filteredDishes.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Dishes Grid */}
          {filteredDishes.length > 0 ? (
            <div className="dishes-grid" id="dishes-grid-container">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onOpenCustomizer={setCustomizingDish}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" id="menu-empty-state">
              <div className="empty-icon">
                <i className="fa-solid fa-bowl-food"></i>
              </div>
              <h3>No dishes found</h3>
              <p>
                We couldn't find any items matching your filters. Try resetting your search or dietary tags.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                id="reset-filters-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Desktop Sticky Cart Sidebar */}
        <CartSidebar
          onOpenCheckout={onOpenCheckout}
          isOpen={isMobileCartOpen}
          onCloseDrawer={onCloseMobileCart}
          onShowToast={onShowToast}
        />
      </div>

      {/* Dish Customizer Modal */}
      {customizingDish && (
        <DishModal
          dish={customizingDish}
          onClose={() => setCustomizingDish(null)}
          onShowToast={onShowToast}
        />
      )}
    </section>
  );
}
