import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { MENU_ITEMS as INITIAL_MENU_ITEMS, MENU_CATEGORIES } from '../data/mockData';
import {
  supabase,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory as createRemoteCategory,
  updateCategory as updateRemoteCategory,
  deleteCategory as deleteRemoteCategory
} from '../services/supabaseClient';

const MenuContext = createContext();

const MENU_STORAGE_KEY = 'aura_bistro_dynamic_menu';
const CATEGORIES_STORAGE_KEY = 'aura_bistro_dynamic_categories';

export function MenuProvider({ children }) {
  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem(MENU_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load menu items from storage', e);
    }
    return INITIAL_MENU_ITEMS.map(item => ({
      ...item,
      inStock: item.inStock !== undefined ? item.inStock : true,
      stockCount: item.stockCount !== undefined ? item.stockCount : 15
    }));
  });

  const [categoriesRaw, setCategoriesRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load categories from storage', e);
    }
    return MENU_CATEGORIES;
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Initial fetch from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadDishesFromSupabase() {
      try {
        const remoteDishes = await getMenuItems();
        if (isMounted && remoteDishes && remoteDishes.length > 0) {
          setDishes(remoteDishes);
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.warn('Failed to load menu items from Supabase, using local fallback:', err);
      }
    }

    async function loadCategoriesFromSupabase() {
      try {
        const remoteCats = await getCategories();
        if (isMounted && remoteCats && remoteCats.length > 0) {
          // Ensure 'all' category is always present at index 0
          const hasAll = remoteCats.some(c => c.id === 'all');
          const finalCats = hasAll
            ? remoteCats
            : [{ id: 'all', name: 'All Dishes', icon: 'fa-solid fa-border-all', count: 0 }, ...remoteCats];
          setCategoriesRaw(finalCats);
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.warn('Failed to load categories from Supabase, using local fallback:', err);
      }
    }

    loadDishesFromSupabase();
    loadCategoriesFromSupabase();

    // Subscribe to realtime menu_items changes in Supabase
    const menuChannel = supabase
      .channel('schema-db-changes-menu')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadDishesFromSupabase();
          } else if (payload.eventType === 'UPDATE') {
            setDishes(prev =>
              prev.map(d =>
                d.id === payload.new.id
                  ? {
                      ...d,
                      name: payload.new.name,
                      price: Number(payload.new.price),
                      category: payload.new.category,
                      inStock: Boolean(payload.new.in_stock),
                      stockCount: payload.new.stock_count
                    }
                  : d
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDishes(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to realtime categories changes in Supabase
    const catChannel = supabase
      .channel('schema-db-changes-categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            loadCategoriesFromSupabase();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(catChannel);
    };
  }, []);

  // Save dishes to localStorage as backup cache
  useEffect(() => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(dishes));
    } catch (e) {
      console.error('Failed to sync menu items', e);
    }
  }, [dishes]);

  // Save categories to localStorage as backup cache
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoriesRaw));
    } catch (e) {
      console.error('Failed to sync categories to storage', e);
    }
  }, [categoriesRaw]);

  // Decorate categories with dynamic live dish counts
  const categories = useMemo(() => {
    return categoriesRaw.map(cat => ({
      ...cat,
      count: cat.id === 'all'
        ? dishes.length
        : dishes.filter(d => d.category === cat.id).length
    }));
  }, [categoriesRaw, dishes]);

  // Add new category
  const addCategory = async (catData) => {
    let slug = catData.id
      ? catData.id.toLowerCase().trim()
      : (catData.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (!slug) {
      slug = `cat-${Date.now().toString().slice(-4)}`;
    }

    // Ensure unique ID
    if (categoriesRaw.some(c => c.id === slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = {
      id: slug,
      name: catData.name.trim(),
      icon: catData.icon || 'fa-solid fa-utensils',
      description: catData.description || '',
      displayOrder: catData.displayOrder || categoriesRaw.length,
      count: 0
    };

    setCategoriesRaw(prev => [...prev, newCategory]);

    // Persist to Supabase
    createRemoteCategory(newCategory).catch(err => {
      console.warn('Could not persist new category to Supabase:', err);
    });

    return newCategory;
  };

  // Update category
  const updateCategory = async (id, updatedFields) => {
    setCategoriesRaw(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updatedFields } : cat))
    );

    // Persist to Supabase
    updateRemoteCategory(id, updatedFields).catch(err => {
      console.warn('Could not persist category update to Supabase:', err);
    });
  };

  // Delete category
  const deleteCategory = async (id) => {
    if (id === 'all') {
      throw new Error('Default "All Dishes" category cannot be deleted.');
    }

    setCategoriesRaw(prev => prev.filter(cat => cat.id !== id));

    // Persist to Supabase
    deleteRemoteCategory(id).catch(err => {
      console.warn('Could not delete category from Supabase:', err);
    });
  };

  // Reset categories to default
  const resetCategoriesToDefault = () => {
    setCategoriesRaw(MENU_CATEGORIES);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  };

  // Add new dish
  const addDish = async (dishData) => {
    const newDish = {
      ...dishData,
      id: `dish-${Date.now()}`,
      rating: 5.0,
      reviewCount: 1,
      inStock: true,
      stockCount: Number(dishData.stockCount) || 20,
      price: Number(dishData.price) || 9.99,
      spiceLevels: dishData.spiceLevels || ['Mild', 'Medium', 'Hot'],
      addOns: dishData.addOns || []
    };

    setDishes(prev => [newDish, ...prev]);

    // Async persist to Supabase
    createMenuItem(newDish).catch(err => {
      console.warn('Could not persist new dish to Supabase:', err);
    });

    return newDish;
  };

  // Update existing dish
  const updateDish = async (id, updatedFields) => {
    setDishes(prev =>
      prev.map(dish => (dish.id === id ? { ...dish, ...updatedFields } : dish))
    );

    // Async persist to Supabase
    updateMenuItem(id, updatedFields).catch(err => {
      console.warn('Could not persist dish update to Supabase:', err);
    });
  };

  // Delete dish
  const deleteDish = async (id) => {
    setDishes(prev => prev.filter(dish => dish.id !== id));

    // Async delete from Supabase
    deleteMenuItem(id).catch(err => {
      console.warn('Could not delete dish from Supabase:', err);
    });
  };

  // Toggle inStock / out-of-stock
  const toggleStock = async (id) => {
    let newStatus = true;
    setDishes(prev =>
      prev.map(dish => {
        if (dish.id === id) {
          newStatus = !dish.inStock;
          return {
            ...dish,
            inStock: newStatus,
            stockCount: newStatus ? 10 : 0
          };
        }
        return dish;
      })
    );

    // Async persist to Supabase
    updateMenuItem(id, { inStock: newStatus }).catch(err => {
      console.warn('Could not persist stock toggle to Supabase:', err);
    });
  };

  // Reset to default menu
  const resetMenuToDefault = () => {
    const defaults = INITIAL_MENU_ITEMS.map(item => ({
      ...item,
      inStock: true,
      stockCount: 15
    }));
    setDishes(defaults);
    setCategoriesRaw(MENU_CATEGORIES);
    localStorage.removeItem(MENU_STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  };

  return (
    <MenuContext.Provider
      value={{
        dishes,
        categories,
        isSupabaseConnected,
        addDish,
        updateDish,
        deleteDish,
        toggleStock,
        resetMenuToDefault,
        addCategory,
        updateCategory,
        deleteCategory,
        resetCategoriesToDefault
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
