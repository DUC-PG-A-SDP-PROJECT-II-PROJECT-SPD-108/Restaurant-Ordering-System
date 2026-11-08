import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const LANG_STORAGE_KEY = 'aura_bistro_language';

export const TRANSLATIONS = {
  en: {
    brandSubtitle: 'Good Food • Good Mood',
    menuOrder: 'Menu & Order',
    liveTracker: 'Live Tracker',
    dineIn: 'Dine-In',
    takeaway: 'Takeaway',
    callStaff: 'Call Staff',
    callStaffKh: 'ហៅបុគ្គលិក',
    searchPlaceholder: 'Search dishes, ingredients or chef specials...',
    allCategories: 'All Categories',
    chefSpecial: "Chef's Recommendation",
    chefSpecialSubtitle: 'Signature handcrafted dishes curated by our culinary team',
    orderNow: 'Order Now',
    addToCart: 'Add to Order',
    inStock: 'In Stock',
    soldOut: 'Sold Out',
    yourCart: 'Your Dining Cart',
    emptyCartMsg: 'Your order cart is currently empty.',
    subtotal: 'Subtotal',
    voucherDiscount: 'Voucher Discount',
    vatTax: 'VAT Tax (10%)',
    serviceFee: 'Service Fee (5%)',
    grandTotal: 'Grand Total',
    checkout: 'Proceed to Checkout',
    checkoutTitle: 'Complete Your Order',
    guestName: 'Guest Name',
    phoneNumber: 'Phone Number',
    tableNumber: 'Table Number',
    cookingNotes: 'Cooking Notes & Dietary Requests',
    paymentMethod: 'Select Payment Method',
    bakongKhqr: 'Bakong KHQR (All Banks)',
    cashCounter: 'Cash (Pay at Counter)',
    placeOrder: 'Confirm & Place Order',
    trackingTitle: 'Real-time Order Tracker',
    statusPending: 'Received & Queued',
    statusCooking: 'Cooking in Kitchen',
    statusReady: 'Food Ready to Serve',
    statusServed: 'Served & Enjoy!',
    printReceipt: 'Print 80mm Receipt',
    trackOrderBtn: 'Track Live Status'
  },
  kh: {
    brandSubtitle: 'ម្ហូបឆ្ងាញ់ • អារម្មណ៍ស្រស់ស្រាយ',
    menuOrder: 'ម៉ឺនុយ & កុម្ម៉ង់',
    liveTracker: 'តាមដានការកុម្ម៉ង់',
    dineIn: 'ញ៉ាំនៅហាង',
    takeaway: 'ខ្ចប់ទៅផ្ទះ',
    callStaff: 'ហៅបុគ្គលិក',
    callStaffKh: 'Call Staff',
    searchPlaceholder: 'ស្វែងរកមុខម្ហូប គ្រឿងផ្សំ ឬមុខម្ហូបពិសេស...',
    allCategories: 'មុខម្ហូបទាំងអស់',
    chefSpecial: 'មុខម្ហូបពិសេសប្រចាំហាង',
    chefSpecialSubtitle: 'រៀបចំយ៉ាងផ្ចិតផ្ចង់ដោយមេចុងភៅជំនាញប្រចាំហាង Bistro',
    orderNow: 'កុម្ម៉ង់ឥឡូវនេះ',
    addToCart: 'ដាក់ចូលកន្ត្រក',
    inStock: 'មានក្នុងស្តុក',
    soldOut: 'អស់ពីស្តុក',
    yourCart: 'កន្ត្រកកុម្ម៉ង់របស់អ្នក',
    emptyCartMsg: 'មិនទាន់មានមុខម្ហូបនៅក្នុងកន្ត្រកនៅឡើយទេ។',
    subtotal: 'សរុបបណ្តោះអាសន្ន',
    voucherDiscount: 'បញ្ចុះតម្លៃពិសេស (Voucher)',
    vatTax: 'ពន្ធអាករលើតម្លៃបន្ថែម (10%)',
    serviceFee: 'ថ្លៃសេវាកម្ម (5%)',
    grandTotal: 'ទឹកប្រាក់សរុប',
    checkout: 'បន្តទៅការទូទាត់ប្រាក់',
    checkoutTitle: 'បញ្ចប់ការកុម្ម៉ង់ និងទូទាត់',
    guestName: 'ឈ្មោះអតិថិជន',
    phoneNumber: 'លេខទូរស័ព្ទ',
    tableNumber: 'លេខតុ',
    cookingNotes: 'ចំណាំពិសេសជូនចុងភៅ (រសជាតិ/មិនដាក់ខ្ទឹម...)',
    paymentMethod: 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់',
    bakongKhqr: 'បាគង KHQR (គ្រប់ធនាគារ)',
    cashCounter: 'សាច់ប្រាក់សុទ្ធ (ទូទាត់នៅបញ្ជរ)',
    placeOrder: 'បញ្ជាក់ការកុម្ម៉ង់',
    trackingTitle: 'តាមដានស្ថានភាពម្ហូបផ្ទាល់',
    statusPending: 'បានទទួលការកុម្ម៉ង់',
    statusCooking: 'កំពុងចម្អិនក្នុងផ្ទះបាយ',
    statusReady: 'ម្ហូបរួចរាល់ ត្រៀមជូន',
    statusServed: 'បានជូនរួចរាល់ សូមពិសាដោយរីករាយ!',
    printReceipt: 'បោះពុម្ពវិក្កយបត្រ 80mm',
    trackOrderBtn: 'តាមដានការកុម្ម៉ង់'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANG_STORAGE_KEY) || 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch (e) {}
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'kh' : 'en'));
  };

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

