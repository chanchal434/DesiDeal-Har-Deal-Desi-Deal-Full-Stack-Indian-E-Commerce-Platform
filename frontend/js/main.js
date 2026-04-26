/* ============================================================
   DesiDeal – Main Application JavaScript
   Architecture: Full-Stack Modular
   ============================================================ */

// ── 1. GLOBAL DATA & CONFIGURATION ──────────────────────────
let PRODUCTS = []; // Starts empty, will be filled by MongoDB!

const CONFIG = {
  SHIPPING_THRESHOLD: 499, // Free shipping if over ₹499
  SHIPPING_COST: 40,       // ₹40 flat rate shipping
  GST_RATE: 0.18,          // 18% GST in India
  MAX_QTY: 10,             // Max items per product in cart
  SLIDER_DELAY: 6000,      // Hero slider changes every 6 seconds
  SKELETON_DELAY: 1200,    // 1.2s delay to show loading animation
  PROMO_CODES: {
    'SAVE10': 10,
    'WELCOME20': 20,
    'PRIME15': 15,
    'FLASH25': 25
  }
};

// ── 2. STATE MANAGEMENT (Data Layer) ────────────────────────
// The single source of truth for the user's current session.
const AppState = {
  cart: JSON.parse(localStorage.getItem('desideal_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('desideal_wishlist') || '[]'),
  recentlyViewed: JSON.parse(localStorage.getItem('desideal_recent') || '[]'),
  
  currentCategory: 'all',
  currentSearch: '',
  currentSort: 'featured',
  currentView: 'grid',
  
  displayedCount: 12,
  slideIndex: 0,
  promoDiscount: 0,
  modalQty: 1,

  // Helper methods to persist data
  saveWishlist() { localStorage.setItem('desideal_wishlist', JSON.stringify(this.wishlist)); },
  saveRecent() { localStorage.setItem('desideal_recent', JSON.stringify(this.recentlyViewed)); }
};


// ── 3. SERVICES (Business Logic Layer) ──────────────────────
const ProductService = {
  getFilteredProducts() {
    let products = [...PRODUCTS];

    // 1. Category Filter
    if (AppState.currentCategory !== 'all') {
      products = products.filter(p => p.category === AppState.currentCategory);
    }

    // 2. Search Filter
    if (AppState.currentSearch) {
      const q = AppState.currentSearch.toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    switch (AppState.currentSort) {
      case 'price-low': return products.sort((a, b) => a.price - b.price);
      case 'price-high': return products.sort((a, b) => b.price - a.price);
      case 'rating': return products.sort((a, b) => b.rating - a.rating);
      case 'reviews': return products.sort((a, b) => b.reviews - a.reviews);
      case 'newest': return products.sort((a, b) => (b.badge === 'new' ? -1 : 1));
      default: return products;
    }
  },

  trackRecentView(productId) {
    AppState.recentlyViewed = AppState.recentlyViewed.filter(id => id !== productId);
    AppState.recentlyViewed.unshift(productId);
    if (AppState.recentlyViewed.length > 8) AppState.recentlyViewed.pop();
    AppState.saveRecent();
  }
};

const CartService = {
  calculateTotals() {
    const subtotal = AppState.cart.reduce((sum, item) => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return product ? sum + (product.price * item.qty) : sum;
    }, 0);

    const discount = subtotal * (AppState.promoDiscount / 100);
    const totalAfterDiscount = subtotal - discount;
    const shipping = (totalAfterDiscount >= CONFIG.SHIPPING_THRESHOLD || totalAfterDiscount === 0) ? 0 : CONFIG.SHIPPING_COST;
    const tax = totalAfterDiscount * CONFIG.GST_RATE;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      total: totalAfterDiscount + shipping + tax
    };
  },

  addItem(productId, qty = 1) {
    const existing = AppState.cart.find(item => item.id === productId);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, CONFIG.MAX_QTY);
    } else {
      AppState.cart.push({ id: productId, qty });
    }
    this.saveCart(); // Step 7: Triggers DB sync
  },

  updateQty(productId, delta) {
    const item = AppState.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(1, Math.min(CONFIG.MAX_QTY, item.qty + delta));
    if (item.qty <= 0) {
      AppState.cart = AppState.cart.filter(item => item.id !== productId);
    }
    this.saveCart(); // Step 7: Triggers DB sync
  },

  removeItem(productId) {
    AppState.cart = AppState.cart.filter(item => item.id !== productId);
    this.saveCart(); // Step 7: Triggers DB sync
  },

  clear() {
    AppState.cart = [];
    this.saveCart(); // Step 7: Triggers DB sync
  },

  // ✨ NEW: Full-Stack Save Logic (Step 7)
  async saveCart() {
    // Always save locally first so the UI is fast
    localStorage.setItem('desideal_cart', JSON.stringify(AppState.cart));

    // If the user is logged in, sync it to the database!
    const token = localStorage.getItem('desideal_token');
    if (token) {
      try {
        await fetch('http://localhost:5000/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ cart: AppState.cart })
        });
      } catch (error) {
        console.error("Failed to sync cart to database");
      }
    }
  },
  
  // ✨ NEW: Load Cart from Database on Login (Step 7)
  async loadCartFromDB() {
    const token = localStorage.getItem('desideal_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.cart.length > 0) {
        AppState.cart = data.cart;
        localStorage.setItem('desideal_cart', JSON.stringify(AppState.cart));
        UIController.updateCartUI();
      }
    } catch (error) {
      console.error("Failed to load cart from database");
    }
  }
};


// ── 4. UI CONTROLLER (Presentation Layer) ───────────────────
const UIController = {
  formatCurrency: (amount) => `₹${amount.toFixed(2)}`,
  formatNumber: (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString(),

  // ✨ Smart UI Auth Updater
  updateAuthUI() {
    const token = localStorage.getItem('desideal_token');
    const userName = localStorage.getItem('desideal_name');
    
    // Header elements
    const greeting = document.getElementById('nav-user-greeting');
    const dropHeader = document.getElementById('nav-dropdown-header');
    const signoutBtn = document.getElementById('nav-signout');
    
    // Sidebar element
    const sidebarGreeting = document.querySelector('#sidebar-header span');

    if (token && userName) {
      // Logged in
      if (greeting) greeting.textContent = `Hello, ${userName}`;
      if (sidebarGreeting) sidebarGreeting.textContent = `Hello, ${userName}`;
      if (dropHeader) dropHeader.classList.add('hidden');
      if (signoutBtn) signoutBtn.classList.remove('hidden');
    } else {
      // Logged out
      if (greeting) greeting.textContent = `Hello, Sign in`;
      if (sidebarGreeting) sidebarGreeting.textContent = `Hello, User`;
      if (dropHeader) dropHeader.classList.remove('hidden');
      if (signoutBtn) signoutBtn.classList.add('hidden');
    }
  },

  // ✨ FULL-STACK INIT FUNCTION ✨
  async init() {
    // 1. Fetch real products from your Python Flask Backend!
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const result = await response.json();
      
      if (result.success) {
        PRODUCTS = result.data; 
        
        // ✨ Check UI auth state immediately on load
        this.updateAuthUI();
        
        // If logged in, fetch their cart
        if (localStorage.getItem('desideal_token')) {
          await CartService.loadCartFromDB(); 
        }
      } else {
        this.showToast("Failed to load products from database.", "error");
      }
    } catch (error) {
      console.error("Database connection error:", error);
      this.showToast("<i class='fas fa-wifi'></i> Server offline. Please start Python backend.", "error");
    }

    // 2. Render UI
    this.renderProducts();
    this.updateCartUI();
    this.startTimer();
    this.startHeroSlider();
    this.setupSearch();
    this.setupPaymentOptions();
    this.setupCardFormatting();
    this.renderRecentlyViewed();
  },

  // --- Products & Grid ---
  renderProducts() {
    const grid = document.getElementById('products-grid');
    const loadWrap = document.getElementById('load-more-wrapper');
    const allProducts = ProductService.getFilteredProducts();
    const visible = allProducts.slice(0, AppState.displayedCount);

    grid.className = AppState.currentView === 'list' ? 'list-view' : '';

    if (visible.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#565959;">
          <i class="fas fa-search" style="font-size:48px;opacity:.3;display:block;margin-bottom:16px;"></i>
          <h3 style="font-size:20px;margin-bottom:8px;">No products found</h3>
          <p>Try adjusting your search or browse all categories</p>
        </div>
      `;
      loadWrap.style.display = 'none';
      return;
    }

    // 1. Render Skeletons First
    grid.innerHTML = Array(Math.min(8, visible.length)).fill(`
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    `).join('');
    loadWrap.style.display = 'none';

    // 2. Render actual products after delay
    setTimeout(() => {
      grid.innerHTML = visible.map(p => this.createProductCardHTML(p)).join('');
      this.updateActiveFilters();
      
      const loadBtn = document.getElementById('load-more-btn');
      loadWrap.style.display = allProducts.length > AppState.displayedCount ? 'block' : 'none';
      if (loadBtn) {
        const remaining = allProducts.length - AppState.displayedCount;
        loadBtn.innerHTML = `Load More (${remaining} more) <i class="fas fa-chevron-down"></i>`;
      }
    }, CONFIG.SKELETON_DELAY);
  },

  createProductCardHTML(product) {
    const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    const isWishlisted = AppState.wishlist.includes(product.id);
    const imageUrl = product.image || `https://placehold.co/400x400/f3f4f6/565959?text=${encodeURIComponent(product.category.toUpperCase())}`;

    const getStars = (rating) => {
      let stars = '';
      for (let i = 1; i <= 5; i++) stars += (i <= Math.floor(rating)) ? '★' : (i - rating < 1 ? '✮' : '☆');
      return stars;
    };

    const priceHTML = product.originalPrice
      ? `<span class="price-sale">${this.formatCurrency(product.price)}</span>
         <span class="price-original">${this.formatCurrency(product.originalPrice)}</span>
         <span class="price-discount">-${discount}%</span>`
      : `<span class="price-regular">${this.formatCurrency(product.price)}</span>`;

    const shippingHTML = product.freeShipping
      ? `<p class="product-shipping"><i class="fas fa-shipping-fast"></i> FREE Delivery${product.prime ? ' <span style="color:#007185">Prime</span>' : ''}</p>`
      : `<p class="product-shipping paid"><i class="fas fa-truck"></i> Ships ${this.formatCurrency(CONFIG.SHIPPING_COST)}</p>`;

    return `
      <article class="product-card ${AppState.currentView === 'list' ? 'list-card' : ''}" onclick="window.openProductModal(${product.id})">
        ${product.badge ? `<span class="product-badge badge-${product.badge}">${product.badge.toUpperCase()}</span>` : ''}
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist(${product.id})">
          <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
        </button>
        <div class="product-image-wrap">
          <img src="${imageUrl}" alt="${product.title}" class="product-image" loading="lazy" />
        </div>
        <div class="product-info">
          <p class="product-category">${product.category}</p>
          <h3 class="product-title">${product.title}</h3>
          <div class="star-rating">
            <span class="stars">${getStars(product.rating)}</span>
            <span class="rating-text">(${this.formatNumber(product.reviews)})</span>
          </div>
          <div class="product-price-wrap">${priceHTML}</div>
          ${shippingHTML}
        </div>
        <div class="product-actions">
          <button class="btn-add-cart" onclick="event.stopPropagation(); window.addToCart(${product.id})">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn-quick-view" onclick="event.stopPropagation(); window.openProductModal(${product.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </article>
    `;
  },

  updateActiveFilters() {
    const container = document.getElementById('active-filters');
    if (AppState.currentCategory === 'all' && !AppState.currentSearch) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    container.innerHTML = '<span style="font-size:13px;font-weight:600;color:#565959;">Active Filters:</span>';
    
    if (AppState.currentCategory !== 'all') {
      container.innerHTML += `<span class="filter-tag">${AppState.currentCategory} <button onclick="window.filterCategory('all')">×</button></span>`;
    }
    if (AppState.currentSearch) {
      container.innerHTML += `<span class="filter-tag">"${AppState.currentSearch}" <button onclick="window.clearSearch()">×</button></span>`;
    }
  },

  // --- Cart UI ---
  updateCartUI() {
    const totals = CartService.calculateTotals();
    const totalItems = AppState.cart.reduce((sum, i) => sum + i.qty, 0);
    
    document.getElementById('cart-count').textContent = totalItems;
    document.getElementById('cart-item-count').textContent = totalItems;

    document.getElementById('cart-subtotal').textContent = this.formatCurrency(totals.subtotal);
    document.getElementById('cart-total').textContent = this.formatCurrency(totals.total);
    document.getElementById('cart-discount-amount').textContent = `-${this.formatCurrency(totals.discount)}`;
    document.getElementById('cart-shipping').textContent = totals.shipping === 0 ? 'FREE' : this.formatCurrency(totals.shipping);

    document.getElementById('cart-discount-row').classList.toggle('hidden', AppState.promoDiscount === 0);

    const container = document.getElementById('cart-items');
    if (AppState.cart.length === 0) {
      container.innerHTML = '';
      document.getElementById('cart-empty').classList.remove('hidden');
      return;
    }
    
    document.getElementById('cart-empty').classList.add('hidden');
    container.innerHTML = AppState.cart.map(item => {
      const p = PRODUCTS.find(prod => prod.id === item.id);
      if (!p) return '';
      const img = p.image || `https://placehold.co/80x80/f3f4f6/565959?text=${encodeURIComponent(p.category)}`;
      return `
        <div class="cart-item">
          <img src="${img}" class="cart-item-image" alt="${p.title}" style="object-fit:cover;"/>
          <div class="cart-item-details">
            <p class="cart-item-title">${p.title}</p>
            <p class="cart-item-price">${this.formatCurrency(p.price * item.qty)}</p>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="window.updateCartQty(${p.id}, -1)">−</button>
              <span class="qty-display">${item.qty}</span>
              <button class="qty-btn" onclick="window.updateCartQty(${p.id}, 1)">+</button>
              <button class="cart-item-remove" onclick="window.removeFromCart(${p.id})">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // --- Modals & Toasts ---
  showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'default' ? 'toast-default' : type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  renderRecentlyViewed() {
    const section = document.getElementById('recently-section');
    const grid = document.getElementById('recently-grid');
    if (AppState.recentlyViewed.length < 2) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    grid.innerHTML = AppState.recentlyViewed.map(id => {
      const p = PRODUCTS.find(prod => prod.id === id);
      if (!p) return '';
      const img = p.image || `https://placehold.co/200x200/f3f4f6/565959?text=${encodeURIComponent(p.category)}`;
      return `
        <div class="product-card" onclick="window.openProductModal(${p.id})" style="cursor:pointer;">
          <div class="product-image-wrap" style="height:120px; padding:0;">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover;" />
          </div>
          <div class="product-info" style="padding:10px;">
            <p class="product-title" style="font-size:12px;-webkit-line-clamp:2;">${p.title}</p>
            <span class="price-sale" style="font-size:14px;">${this.formatCurrency(p.price)}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  // --- Miscellaneous Setup ---
  startHeroSlider() { setInterval(() => window.changeSlide(1), CONFIG.SLIDER_DELAY); },
  
  startTimer() {
    const key = 'desideal_timer_end';
    let endTime = parseInt(localStorage.getItem(key) || '0');
    if (!endTime || endTime < Date.now()) {
      endTime = Date.now() + 8 * 60 * 60 * 1000;
      localStorage.setItem(key, endTime);
    }
    setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      document.getElementById('timer-h').textContent = String(Math.floor(remaining / 3600000)).padStart(2, '0');
      document.getElementById('timer-m').textContent = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
      document.getElementById('timer-s').textContent = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
    }, 1000);
  },

  setupSearch() {
    document.getElementById('search-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') window.performSearch();
    });
    document.getElementById('search-btn').addEventListener('click', window.performSearch);
  },

  setupPaymentOptions() {
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', function() {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input').checked = true;
        document.getElementById('card-form').style.display = this.querySelector('input').value === 'card' ? 'block' : 'none';
      });
    });
  },

  setupCardFormatting() {
    document.getElementById('card-number-input')?.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
  }
};


// ── 5. APP INITIALIZATION ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => UIController.init());

window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  header.style.boxShadow = window.scrollY > 60 ? '0 4px 20px rgba(0,0,0,.4)' : '0 2px 8px rgba(0,0,0,.4)';
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    window.closeProductModal();
    window.closeAuthModal();
    window.closeCheckout();
    if (!document.getElementById('sidebar').classList.contains('hidden')) window.toggleSidebar();
    if (document.getElementById('cart-drawer').classList.contains('open')) window.toggleCart();
  }
});


// ── 6. GLOBAL BRIDGES (HTML Inline Event Handlers) ──────────

window.filterCategory = (cat) => {
  AppState.currentCategory = cat;
  AppState.currentSearch = '';
  AppState.displayedCount = 12;
  document.getElementById('search-input').value = '';
  document.getElementById('products-title').textContent = cat === 'all' ? 'All Products' : cat.toUpperCase();
  UIController.renderProducts();
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
};

window.performSearch = () => {
  AppState.currentSearch = document.getElementById('search-input').value.trim();
  AppState.currentCategory = document.getElementById('search-category').value;
  AppState.displayedCount = 12;
  document.getElementById('products-title').textContent = `Search results for "${AppState.currentSearch}"`;
  UIController.renderProducts();
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
};

window.clearSearch = () => {
  AppState.currentSearch = '';
  document.getElementById('search-input').value = '';
  window.filterCategory(AppState.currentCategory);
};

window.sortProducts = () => { AppState.currentSort = document.getElementById('sort-select').value; UIController.renderProducts(); };
window.setView = (view) => {
  AppState.currentView = view;
  document.getElementById('grid-view-btn').classList.toggle('active', view === 'grid');
  document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
  UIController.renderProducts();
};
window.loadMore = () => { AppState.displayedCount += 8; UIController.renderProducts(); };

// ✨ SECURE Cart Actions
window.addToCart = (id) => {
  if (!localStorage.getItem('desideal_token')) {
    UIController.showToast('<i class="fas fa-lock"></i> Please sign in to add items.', 'error');
    return window.showAuthModal('signin');
  }
  CartService.addItem(id, 1);
  UIController.updateCartUI();
  const product = PRODUCTS.find(p => p.id === id);
  if(product) {
    UIController.showToast(`<i class="fas fa-check-circle"></i> <span><strong>${product.title.substring(0, 30)}...</strong> added!</span>`, 'success');
  }
  const icon = document.querySelector('#cart-toggle-btn .cart-icon-wrapper');
  if (icon) {
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => icon.style.transform = 'scale(1)', 300);
  }
};

window.updateCartQty = (id, delta) => { CartService.updateQty(id, delta); UIController.updateCartUI(); };
window.removeFromCart = (id) => { CartService.removeItem(id); UIController.updateCartUI(); UIController.showToast('<i class="fas fa-trash"></i> <span>Item removed</span>', 'error'); };
window.toggleCart = () => {
  document.getElementById('cart-drawer').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('active');
  document.body.style.overflow = document.getElementById('cart-drawer').classList.contains('open') ? 'hidden' : '';
};
window.applyPromo = () => {
  const code = document.getElementById('promo-input').value.trim().toUpperCase();
  if (CONFIG.PROMO_CODES[code]) {
    AppState.promoDiscount = CONFIG.PROMO_CODES[code];
    UIController.updateCartUI();
    UIController.showToast(`<i class="fas fa-tag"></i> <span>Promo applied!</span>`, 'success');
  } else {
    UIController.showToast('<i class="fas fa-times-circle"></i> <span>Invalid code</span>', 'error');
  }
};

// ✨ SECURE Wishlist
window.toggleWishlist = (id) => {
  if (!localStorage.getItem('desideal_token')) {
    UIController.showToast('<i class="fas fa-lock"></i> Please sign in to use wishlist.', 'error');
    return window.showAuthModal('signin');
  }
  const idx = AppState.wishlist.indexOf(id);
  if (idx > -1) {
    AppState.wishlist.splice(idx, 1);
    UIController.showToast(`<i class="far fa-heart"></i> <span>Removed from wishlist</span>`, 'info');
  } else {
    AppState.wishlist.push(id);
    UIController.showToast(`<i class="fas fa-heart"></i> <span>Added to wishlist!</span>`, 'success');
  }
  AppState.saveWishlist();
  UIController.renderProducts(); 
};

// Modals & UI Toggles
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
  document.body.style.overflow = sidebar.classList.contains('hidden') ? '' : 'hidden';
};

// ✨ NEW PROFESSIONAL AUTH MODAL TOGGLES
window.showAuthModal = (view = 'signin') => { 
  document.getElementById('auth-modal-overlay').classList.add('active'); 
  document.getElementById('auth-modal').classList.add('active'); 
  window.toggleAuthView(view);
};
window.closeAuthModal = () => { 
  document.getElementById('auth-modal-overlay').classList.remove('active'); 
  document.getElementById('auth-modal').classList.remove('active'); 
};
window.toggleAuthView = (view) => {
  document.getElementById('signin-container').classList.toggle('hidden', view !== 'signin');
  document.getElementById('signup-container').classList.toggle('hidden', view !== 'signup');
};

// ── REAL FULL-STACK AUTHENTICATION ──
window.handleSignIn = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    
    const data = await response.json();

    if (data.success) {
      const firstName = data.user.name.split(' ')[0];
      localStorage.setItem('desideal_token', data.token);
      localStorage.setItem('desideal_name', firstName); 
      
      window.closeAuthModal();
      UIController.showToast(`<i class="fas fa-user-check"></i> <span>Welcome back, <strong>${data.user.name}</strong>!</span>`, 'success');
      
      UIController.updateAuthUI(); // ✨ Instantly update the UI buttons
      document.getElementById('signin-form').reset();
      
      // Step 7: When user logs in, load their saved cart from MongoDB
      await CartService.loadCartFromDB();
    } else {
      UIController.showToast(`<i class="fas fa-exclamation-circle"></i> <span>${data.message}</span>`, 'error');
    }
  } catch (error) {
    UIController.showToast('<i class="fas fa-wifi"></i> <span>Cannot connect to server. Is it running?</span>', 'error');
  }
};

window.handleSignOut = () => {
  // 1. Remove the security token and name
  localStorage.removeItem('desideal_token');
  localStorage.removeItem('desideal_name');
  
  // 2. Clear the cart securely
  AppState.cart = [];
  localStorage.setItem('desideal_cart', JSON.stringify([]));
  UIController.updateCartUI();
  
  UIController.updateAuthUI(); // ✨ Instantly update the UI buttons back to signed-out state
  
  UIController.showToast('<i class="fas fa-sign-out-alt"></i> Signed out successfully.', 'info');
};

// ✨ REAL HTML REGISTRATION
window.handleRegister = async (e) => {
  e.preventDefault(); // ✨ Prevent page reload on submit
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      UIController.showToast(`<i class="fas fa-check"></i> <span>Account created! You can now log in.</span>`, 'success');
      document.getElementById('signup-form').reset();
      window.toggleAuthView('signin'); 
      document.getElementById('signin-email').value = email; // Pre-fill their email
    } else {
      UIController.showToast(`<i class="fas fa-times"></i> <span>${data.message}</span>`, 'error');
    }
  } catch (error) {
    UIController.showToast('Error connecting to server.', 'error');
  }
};

window.togglePassword = (inputId) => {
  const input = document.getElementById(inputId);
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  input.nextElementSibling.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
};

// Product Modal
window.openProductModal = (id) => {
  const p = PRODUCTS.find(prod => prod.id === id);
  if (!p) return;
  AppState.modalQty = 1;
  ProductService.trackRecentView(id);

  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const img = p.image || `https://placehold.co/400x400/f3f4f6/565959?text=${encodeURIComponent(p.category)}`;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-image-section">
      <img src="${img}" style="width:100%; max-width:300px; object-fit:contain;" />
    </div>
    <div class="modal-details">
      <p class="modal-category">${p.category}</p>
      <h2 class="modal-title">${p.title}</h2>
      <div class="modal-price-section">
        <span style="font-size: 24px; font-weight: bold; color: #CC0000;">${UIController.formatCurrency(p.price)}</span>
        ${p.originalPrice ? `<span style="text-decoration: line-through; color: #555; margin-left: 10px;">${UIController.formatCurrency(p.originalPrice)}</span> (-${discount}%)` : ''}
      </div>
      <p class="modal-desc" style="margin: 15px 0;">${p.description}</p>
      <div class="modal-qty-section">
        <span>Qty:</span>
        <button onclick="window.changeModalQty(-1)">−</button>
        <span id="modal-qty-display">${AppState.modalQty}</span>
        <button onclick="window.changeModalQty(1)">+</button>
      </div>
      <div class="modal-actions" style="margin-top: 20px;">
        <button class="btn-gold full-width" onclick="window.addToCartFromModal(${p.id})">Add to Cart</button>
      </div>
    </div>
  `;
  document.getElementById('product-modal-overlay').classList.add('active');
  document.getElementById('product-modal').classList.add('active');
};
window.closeProductModal = () => { document.getElementById('product-modal-overlay').classList.remove('active'); document.getElementById('product-modal').classList.remove('active'); };
window.changeModalQty = (delta) => { AppState.modalQty = Math.max(1, Math.min(CONFIG.MAX_QTY, AppState.modalQty + delta)); document.getElementById('modal-qty-display').textContent = AppState.modalQty; };

// ✨ SECURE Add to Cart from Modal
window.addToCartFromModal = (id) => { 
  if (!localStorage.getItem('desideal_token')) {
    window.closeProductModal();
    UIController.showToast('<i class="fas fa-lock"></i> Please sign in to add items.', 'error');
    return window.showAuthModal('signin');
  }
  CartService.addItem(id, AppState.modalQty); 
  UIController.updateCartUI(); 
  window.closeProductModal(); 
  UIController.showToast('Added to cart!', 'success'); 
};

// Slider
window.changeSlide = (direction) => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  slides[AppState.slideIndex].classList.remove('active');
  dots[AppState.slideIndex].classList.remove('active');
  AppState.slideIndex = (AppState.slideIndex + direction + slides.length) % slides.length;
  slides[AppState.slideIndex].classList.add('active');
  dots[AppState.slideIndex].classList.add('active');
};
window.goToSlide = (idx) => {
  document.querySelectorAll('.hero-slide')[AppState.slideIndex].classList.remove('active');
  document.querySelectorAll('.dot')[AppState.slideIndex].classList.remove('active');
  AppState.slideIndex = idx;
  document.querySelectorAll('.hero-slide')[AppState.slideIndex].classList.add('active');
  document.querySelectorAll('.dot')[AppState.slideIndex].classList.add('active');
};

// Checkout
window.goToCheckout = () => {
  if (AppState.cart.length === 0) return UIController.showToast('Your cart is empty!', 'error');
  window.toggleCart();
  
  const totals = CartService.calculateTotals();
  document.getElementById('co-subtotal').textContent = UIController.formatCurrency(totals.subtotal);
  document.getElementById('co-tax').textContent = UIController.formatCurrency(totals.tax);
  document.getElementById('co-total').textContent = UIController.formatCurrency(totals.total);

  document.getElementById('checkout-items-list').innerHTML = AppState.cart.map(item => {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    const img = p.image || `https://placehold.co/50x50/f3f4f6/565959?text=${encodeURIComponent(p.category.charAt(0))}`;
    return `<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px;">
              <span><img src="${img}" width="30" style="vertical-align:middle; margin-right:10px;"/>${p.title.substring(0, 20)} (x${item.qty})</span>
              <strong>${UIController.formatCurrency(p.price * item.qty)}</strong>
            </div>`;
  }).join('');
  document.getElementById('checkout-overlay').classList.remove('hidden');
};
window.closeCheckout = () => document.getElementById('checkout-overlay').classList.add('hidden');

// ✨ SECURE Razorpay Integration (Step 9)
window.placeOrder = async () => {
  const token = localStorage.getItem('desideal_token');
  if (!token) {
    UIController.showToast('<i class="fas fa-lock"></i> Please sign in to place an order.', 'error');
    window.closeCheckout();
    window.showAuthModal('signin');
    return;
  }

  if (AppState.cart.length === 0) {
    UIController.showToast('Your cart is empty!', 'error');
    return;
  }

  const totals = CartService.calculateTotals();
  const shippingInfo = { address: "User Address from Checkout Form" };

  try {
    // 1. Ask Backend to create a Razorpay Order
    const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ total: totals.total })
    });
    const orderData = await orderRes.json();

    if (!orderData.success) throw new Error("Could not create order");

    // 2. Open Razorpay Checkout Window
    const options = {
      key: orderData.key_id, 
      amount: orderData.amount, 
      currency: "INR",
      name: "DesiDeal.in",
      description: "Test Transaction",
      order_id: orderData.razorpay_order_id,
      
      // 3. What happens when payment is successful
      handler: async function (response) {
        // 4. Send payment proof & cart to backend for verification and saving
        const verifyRes = await fetch('http://localhost:5000/api/orders/verify-and-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            items: AppState.cart, 
            total: totals.total,
            shipping: shippingInfo
          })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          document.getElementById('order-number').textContent = `Order #${verifyData.order_number}`;
          window.closeCheckout();
          document.getElementById('order-success-overlay').classList.remove('hidden');
          
          AppState.cart = [];
          localStorage.setItem('desideal_cart', JSON.stringify([]));
          UIController.updateCartUI();
        } else {
          UIController.showToast(verifyData.message, 'error');
        }
      },
      theme: { color: "#FF9933" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (error) {
    UIController.showToast('<i class="fas fa-wifi"></i> Payment system error.', 'error');
  }
};
window.closeOrderSuccess = () => document.getElementById('order-success-overlay').classList.add('hidden');
