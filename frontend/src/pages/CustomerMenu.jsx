import React, { useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import FilterBar from '../components/FilterBar';
import CategoryPills from '../components/CategoryPills';
import DishCard from '../components/DishCard';
import DishModal from '../components/DishModal';
import CartSidebar from '../components/CartSidebar';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerMenu({
  onOpenCheckout,
  onViewCart,
  onShowToast,
  isMobileCartOpen,
  onOpenMobileCart,
  onCloseMobileCart
}) {
  const { dishes, categories } = useMenu();
  const { items, summary, diningMode, tableNumber, isQrScanned, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [customizingDish, setCustomizingDish] = useState(null);

  const handleClearCart = (e) => {
    e.stopPropagation();
    if (window.confirm(language === 'km' ? 'តើអ្នកប្រាកដជាចង់សម្អាតមុខម្ហូបទាំងអស់ក្នុងកន្ត្រកមែនទេ?' : 'Are you sure you want to clear all items in your cart?')) {
      clearCart();
      if (onShowToast) {
        onShowToast(language === 'km' ? 'បានសម្អាតកន្ត្រកជោគជ័យ' : 'Cart cleared successfully', 'info');
      }
    }
  };

  // Filtering & Sorting logic
  const filteredDishes = dishes.filter((dish) => {
    const activeCatObj = categories.find((c) => c.id === activeCategory);
    const matchesCategory =
      activeCategory === 'all' ||
      dish.category === activeCategory ||
      (activeCatObj && (
        dish.category === activeCatObj.name ||
        dish.categoryName === activeCatObj.name ||
        (activeCatObj.dbId && dish.categoryId === activeCatObj.dbId)
      ));
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
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  const currentCatObj = categories.find((c) => c.id === activeCategory) || categories[0] || { name: 'All Dishes' };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setDietaryFilter('all');
    setSortBy('featured');
  };

  return (
    <section className="app-view active-view" id="customer-view">
      {/* Table QR Code Notice Banner */}
      {diningMode === 'dine-in' && (
        <div
          className="dine-in-notice-banner"
          style={{
            width: '100%',
            margin: '1.25rem auto',
            padding: '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.12))',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}
            >
              <i className="fa-solid fa-qrcode"></i>
            </span>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>
                {isQrScanned ? '📷 Scanned Dine-In Session' : '🍽️ Dine-In Table Ordering'}
              </strong>
              <div className="dine-in-subtext" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                You are ordering for <strong>Table #{tableNumber}</strong>. Food will be delivered directly to your seat.
              </div>
            </div>
          </div>
          <span
            className="badge"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            Table #{tableNumber} Active
          </span>
        </div>
      )}

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
      <div className={`layout-split ${items.length > 0 ? 'has-mobile-cart-bar' : ''}`}>
        {/* Menu Items Section */}
        <div className="menu-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title" id="active-category-title">
                {currentCatObj.name}
              </h2>
              <p className="section-subtitle" id="active-category-desc">
                {language === 'kh' ? 'រៀបចំយ៉ាងផ្ចិតផ្ចង់ដោយមេចុងភៅជំនាញ' : 'Curated by Executive Chef Marco Rossi'}
              </p>
            </div>
            <span className="items-count-indicator" id="items-count-indicator">
              {language === 'kh'
                ? `បង្ហាញមុខម្ហូប ${filteredDishes.length} មុខ`
                : `Showing ${filteredDishes.length} item${filteredDishes.length === 1 ? '' : 's'}`}
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
      </div>

      {/* Floating Bottom Cart Bar (Always Visible) */}
      <aside className="mobile-floating-cart-bar" aria-label="Cart Bar">
        <div
          className="mobile-cart-bar-details"
          onClick={() => onViewCart ? onViewCart() : (onOpenMobileCart && onOpenMobileCart())}
          role="button"
          tabIndex={0}
          title="Click to view full cart and discounts"
        >
          {/* Orange Version Capsule (Cart Icon, White Counter Badge & Bold Price) */}
          <div className="mobile-cart-capsule mobile-cart-capsule-orange">
            <div className="mobile-cart-icon-circle">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="mobile-cart-badge-count">{summary.itemCount || 0}</span>
            </div>
            <span className="mobile-cart-capsule-total">${(summary.total || 0).toFixed(2)}</span>
          </div>

          {/* Bigger Table Text Display */}
          <div className="mobile-cart-bar-pricing">
            <div className="mobile-cart-table-highlight">
              <i className="fa-solid fa-chair" style={{ color: '#FF5900', marginRight: '6px' }}></i>
              <strong>{diningMode === 'dine-in' ? `Table #${tableNumber || '04'}` : 'Takeaway Pickup'}</strong>
              <span className="mobile-cart-table-sub"> &bull; View Order</span>
            </div>
          </div>
        </div>

        <div className="mobile-cart-bar-actions">
          {/* Clear All Cart Button */}
          <button
            type="button"
            className="mobile-cart-bar-clear-btn"
            onClick={items.length > 0 ? handleClearCart : undefined}
            disabled={items.length === 0}
            title={items.length > 0 ? 'Clear All Cart Items' : 'Cart is already empty'}
            style={{
              opacity: items.length === 0 ? 0.45 : 1,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <i className="fa-regular fa-trash-can"></i>
            <span className="clear-cart-text">{language === 'km' ? 'សម្អាតកន្ត្រក' : 'Clear Cart'}</span>
          </button>

          {/* View Cart Button */}
          <button
            type="button"
            className="mobile-cart-bar-view-btn"
            onClick={() => onViewCart ? onViewCart() : (onOpenMobileCart && onOpenMobileCart())}
            title="View & Edit Cart"
          >
            <i className="fa-solid fa-arrow-right"></i>
            <span>View Cart</span>
          </button>
        </div>
      </aside>

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
