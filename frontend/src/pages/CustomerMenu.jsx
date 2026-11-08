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
  onShowToast,
  isMobileCartOpen,
  onOpenMobileCart,
  onCloseMobileCart
}) {
  const { dishes, categories } = useMenu();
  const { items, summary, diningMode, tableNumber, isQrScanned } = useCart();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [customizingDish, setCustomizingDish] = useState(null);

  // Filtering & Sorting logic
  const filteredDishes = dishes.filter((dish) => {
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
          style={{
            maxWidth: '1280px',
            margin: '0.75rem auto 0',
            padding: '0.6rem 1.25rem',
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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

        {/* Desktop Sticky Cart Sidebar */}
        <CartSidebar
          onOpenCheckout={onOpenCheckout}
          isOpen={isMobileCartOpen}
          onCloseDrawer={onCloseMobileCart}
          onShowToast={onShowToast}
        />
      </div>

      {/* Mobile Floating Bottom Cart & Checkout Bar (Visible on mobile/tablet when cart has items) */}
      {items.length > 0 && (
        <aside className="mobile-floating-cart-bar" aria-label="Mobile Cart Bar">
          <div
            className="mobile-cart-bar-details"
            onClick={() => onOpenMobileCart && onOpenMobileCart()}
            role="button"
            tabIndex={0}
            title="Click to view full cart and discounts"
          >
            <div className="mobile-cart-pill-badge">
              <i className="fa-solid fa-cart-shopping"></i>
              <span>{summary.itemCount}</span>
            </div>
            <div className="mobile-cart-bar-pricing">
              <span className="mobile-cart-bar-total">${summary.total.toFixed(2)}</span>
              <span className="mobile-cart-bar-sub">
                {diningMode === 'dine-in' ? `Table #${tableNumber || '01'}` : 'Takeaway'} &bull; View Order
              </span>
            </div>
          </div>

          <div className="mobile-cart-bar-actions">
            <button
              type="button"
              className="btn btn-secondary mobile-cart-bar-view-btn"
              onClick={() => onOpenMobileCart && onOpenMobileCart()}
              title="View & Edit Cart"
            >
              <i className="fa-solid fa-receipt"></i>
              <span>View Cart</span>
            </button>
            <button
              type="button"
              className="btn btn-primary mobile-checkout-cta-btn"
              id="mobile-bottom-checkout-btn"
              onClick={onOpenCheckout}
            >
              <span>Proceed to Checkout</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </aside>
      )}

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
