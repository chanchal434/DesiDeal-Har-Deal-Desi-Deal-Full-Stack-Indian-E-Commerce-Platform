/* ============================================================
   DesiDeal – Main Application JavaScript
   ============================================================ */

// ── State ──────────────────────────────────────────────────
const state = {
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
  modalQty: 1
};

// Promo codes
const PROMO_CODES = {
  'SAVE10': 10,
  'WELCOME20': 20,
  'PRIME15': 15,
  'FLASH25': 25
};

// ── Initialize ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
  startTimer();
  startHeroSlider();
  setupSearch();
  setupPaymentOptions();
  setupCardFormatting();
  renderRecentlyViewed();
});

// ── Hero Slider ────────────────────────────────────────────
function startHeroSlider() {
  setInterval(() => changeSlide(1), 6000);
}

function changeSlide(direction) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  slides[state.slideIndex].classList.remove('active');
  dots[state.slideIndex].classList.remove('active');
  state.slideIndex = (state.slideIndex + direction + slides.length) % slides.length;
  slides[state.slideIndex].classList.add('active');
  dots[state.slideIndex].classList.add('active');
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  slides[state.slideIndex].classList.remove('active');
  dots[state.slideIndex].classList.remove('active');
  state.slideIndex = index;
  slides[state.slideIndex].classList.add('active');
  dots[state.slideIndex].classList.add('active');
}

// ── Countdown Timer ────────────────────────────────────────
function startTimer() {
  // Set end time to 8 hours from now (persisted in session)
  const key = 'desideal_timer_end';
  let endTime = parseInt(localStorage.getItem(key) || '0');
  if (!endTime || endTime < Date.now()) {
    endTime = Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem(key, endTime);
  }

  function updateTimer() {
    const remaining = Math.max(0, endTime - Date.now());
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const fmt = n => String(n).padStart(2, '0');
    const hEl = document.getElementById('timer-h');
    const mEl = document.getElementById('timer-m');
    const sEl = document.getElementById('timer-s');
    if (hEl) hEl.textContent = fmt(h);
    if (mEl) mEl.textContent = fmt(m);
    if (sEl) sEl.textContent = fmt(s);
    if (remaining <= 0) {
      localStorage.removeItem(key);
      startTimer();
    }
  }
  updateTimer();
  setInterval(updateTimer, 1000);
}

// ── Search ─────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
  });
  btn.addEventListener('click', performSearch);
}

function performSearch() {
  const input = document.getElementById('search-input');
  state.currentSearch = input.value.trim().toLowerCase();
  state.currentCategory = 'all';
  state.displayedCount = 12;
  const catSelect = document.getElementById('search-category');
  if (catSelect.value !== 'all') {
    state.currentCategory = catSelect.value;
  }
  renderProducts();
  const titleEl = document.getElementById('products-title');
  const subEl = document.getElementById('products-subtitle');
  if (state.currentSearch) {
    titleEl.textContent = `Search results for "${state.currentSearch}"`;
    const matches = getFilteredProducts();
    subEl.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''} found`;
  }
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}

// ── Filter by Category ─────────────────────────────────────
function filterCategory(cat) {
  state.currentCategory = cat;
  state.currentSearch = '';
  state.displayedCount = 12;
  document.getElementById('search-input').value = '';

  const titleEl = document.getElementById('products-title');
  const subEl = document.getElementById('products-subtitle');
  const labels = {
    all: 'All Products',
    electronics: 'Electronics',
    clothing: 'Fashion & Clothing',
    home: 'Home & Kitchen',
    books: 'Books & Media',
    sports: 'Sports & Outdoors',
    toys: 'Toys & Games',
    beauty: 'Beauty & Personal Care'
  };
  titleEl.textContent = labels[cat] || 'Products';
  const filtered = getFilteredProducts();
  subEl.textContent = `${filtered.length} products available`;

  renderProducts();
  updateActiveFilters();
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}

function updateActiveFilters() {
  const container = document.getElementById('active-filters');
  if (state.currentCategory === 'all' && !state.currentSearch) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  container.innerHTML = '<span style="font-size:13px;font-weight:600;color:#565959;">Active Filters:</span>';
  if (state.currentCategory !== 'all') {
    const tag = document.createElement('span');
    tag.className = 'filter-tag';
    tag.innerHTML = `${state.currentCategory} <button onclick="filterCategory('all')">×</button>`;
    container.appendChild(tag);
  }
  if (state.currentSearch) {
    const tag = document.createElement('span');
    tag.className = 'filter-tag';
    tag.innerHTML = `"${state.currentSearch}" <button onclick="clearSearch()">×</button>`;
    container.appendChild(tag);
  }
}

function clearSearch() {
  state.currentSearch = '';
  document.getElementById('search-input').value = '';
  filterCategory(state.currentCategory);
}

// ── Sort ───────────────────────────────────────────────────
function sortProducts() {
  state.currentSort = document.getElementById('sort-select').value;
  renderProducts();
}

// ── View Mode ──────────────────────────────────────────────
function setView(viewType) {
  state.currentView = viewType;
  document.getElementById('grid-view-btn').classList.toggle('active', viewType === 'grid');
  document.getElementById('list-view-btn').classList.toggle('active', viewType === 'list');
  renderProducts();
}

// ── Get Filtered & Sorted Products ────────────────────────
function getFilteredProducts() {
  let products = [...PRODUCTS];

  if (state.currentCategory !== 'all') {
    products = products.filter(p => p.category === state.currentCategory);
  }

  if (state.currentSearch) {
    const q = state.currentSearch;
    products = products.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  switch (state.currentSort) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price); break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price); break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating); break;
    case 'reviews':
      products.sort((a, b) => b.reviews - a.reviews); break;
    case 'newest':
      products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    default: break;
  }

  return products;
}

// ── Render Products ────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const allProducts = getFilteredProducts();
  const visible = allProducts.slice(0, state.displayedCount);
  const loadBtn = document.getElementById('load-more-btn');
  const loadWrap = document.getElementById('load-more-wrapper');

  grid.className = state.currentView === 'list' ? 'list-view' : '';

  if (visible.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#565959;">
        <i class="fas fa-search" style="font-size:48px;opacity:.3;display:block;margin-bottom:16px;"></i>
        <h3 style="font-size:20px;margin-bottom:8px;">No products found</h3>
        <p>Try adjusting your search or browse all categories</p>
        <button class="btn-primary" style="margin-top:16px;" onclick="filterCategory('all')">Browse All Products</button>
      </div>
    `;
    loadWrap.style.display = 'none';
    return;
  }

  grid.innerHTML = visible.map(p => createProductCard(p)).join('');
  loadWrap.style.display = allProducts.length > state.displayedCount ? 'block' : 'none';
  if (loadBtn) {
    const remaining = allProducts.length - state.displayedCount;
    loadBtn.innerHTML = `Load More (${remaining} more) <i class="fas fa-chevron-down"></i>`;
  }
  updateActiveFilters();
}

function loadMore() {
  state.displayedCount += 8;
  renderProducts();
}

// ── Create Product Card ────────────────────────────────────
function createProductCard(product) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const stars = renderStars(product.rating);
  const isWishlisted = state.wishlist.includes(product.id);
  const isList = state.currentView === 'list';

  const badgeHTML = product.badge
    ? `<span class="product-badge badge-${product.badge}">${getBadgeLabel(product.badge)}</span>`
    : '';

  const priceHTML = product.originalPrice
    ? `<span class="price-sale">₹${product.price.toFixed(2)}</span>
       <span class="price-original">₹${product.originalPrice.toFixed(2)}</span>
       <span class="price-discount">-${discount}%</span>`
    : `<span class="price-regular">₹${product.price.toFixed(2)}</span>`;

  const shippingHTML = product.freeShipping
    ? `<p class="product-shipping"><i class="fas fa-shipping-fast"></i> FREE Delivery${product.prime ? ' <span style="color:#007185">Prime</span>' : ''}</p>`
    : `<p class="product-shipping paid"><i class="fas fa-truck"></i> Ships ₹40.00</p>`;

  const listClass = isList ? 'list-card' : '';

  return `
    <article class="product-card ${listClass}" onclick="openProductModal(${product.id})" role="button" aria-label="${product.title}">
      ${badgeHTML}
      <button class="wishlist-btn ${isWishlisted ? 'active' : ''}"
        onclick="event.stopPropagation(); toggleWishlist(${product.id})"
        aria-label="Add to wishlist">
        <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <div class="product-image-wrap">
        <span class="product-emoji">${product.emoji}</span>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-title">${product.title}</h3>
        <div class="star-rating">
          <span class="stars" aria-label="${product.rating} out of 5">${stars}</span>
          <span class="rating-text">(${formatNum(product.reviews)})</span>
        </div>
        <div class="product-price-wrap">${priceHTML}</div>
        ${shippingHTML}
      </div>
      <div class="product-actions">
        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        <button class="btn-quick-view" onclick="event.stopPropagation(); openProductModal(${product.id})" aria-label="Quick view">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </article>
  `;
}

function getBadgeLabel(badge) {
  const labels = { sale: 'Sale', new: 'New', prime: 'Prime', hot: '🔥 Hot' };
  return labels[badge] || badge;
}

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars += '★';
    else if (i - rating < 1) stars += '✮';
    else stars += '☆';
  }
  return stars;
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

// ── Product Modal ──────────────────────────────────────────
function openProductModal(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  state.modalQty = 1;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const savings = product.originalPrice
    ? (product.originalPrice - product.price).toFixed(2)
    : 0;

  const priceHTML = product.originalPrice
    ? `<div class="modal-price-row">
         <span class="modal-price-sale">₹${product.price.toFixed(2)}</span>
         <span class="modal-price-orig">₹${product.originalPrice.toFixed(2)}</span>
       </div>
       <p class="modal-price-save">You save: ₹${savings} (${discount}% off)</p>`
    : `<div class="modal-price-row"><span class="modal-price-sale">₹${product.price.toFixed(2)}</span></div>`;

  const featuresHTML = product.features.map(f => `<li>${f}</li>`).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-image-section">
      <div class="modal-emoji" id="modal-main-emoji">${product.emoji}</div>
      <div class="modal-thumbnails">
        <div class="modal-thumb active">${product.emoji}</div>
        <div class="modal-thumb">🛍️</div>
        <div class="modal-thumb">📦</div>
      </div>
    </div>
    <div class="modal-details">
      <p class="modal-category"><i class="fas fa-tag"></i> ${product.category}</p>
      <h2 class="modal-title">${product.title}</h2>
      <div class="modal-rating">
        <span class="stars">${renderStars(product.rating)}</span>
        <span>${product.rating} (${formatNum(product.reviews)} ratings)</span>
        ${product.prime ? '<span style="color:#007185;font-weight:600;font-size:12px;">✓ Prime</span>' : ''}
      </div>
      <div class="modal-price-section">
        ${priceHTML}
        <p class="modal-in-stock"><i class="fas fa-check-circle"></i> In Stock – Ready to Ship</p>
      </div>
      <p class="modal-desc">${product.description}</p>
      <div class="modal-features">
        <h4>Key Features:</h4>
        <ul>${featuresHTML}</ul>
      </div>
      <div class="modal-qty-section">
        <span class="modal-qty-label">Qty:</span>
        <div class="modal-qty-controls">
          <button onclick="changeModalQty(-1)">−</button>
          <span id="modal-qty-display">1</span>
          <button onclick="changeModalQty(1)">+</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-gold" onclick="addToCartFromModal(${product.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
        <button class="btn-primary" onclick="addToCartFromModal(${product.id}); closeProductModal(); goToCheckout()">
          <i class="fas fa-bolt"></i> Buy Now
        </button>
        <button class="btn-outline" onclick="toggleWishlist(${product.id})" id="modal-wishlist-btn">
          <i class="${state.wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart"></i>
        </button>
      </div>
    </div>
  `;

  document.getElementById('product-modal-overlay').classList.add('active');
  document.getElementById('product-modal').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Add to recently viewed
  addToRecentlyViewed(id);
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('active');
  document.getElementById('product-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function changeModalQty(delta) {
  state.modalQty = Math.max(1, Math.min(10, state.modalQty + delta));
  const el = document.getElementById('modal-qty-display');
  if (el) el.textContent = state.modalQty;
}

function addToCartFromModal(id) {
  addToCart(id, state.modalQty);
}

// ── Cart ───────────────────────────────────────────────────
function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 10);
  } else {
    state.cart.push({ id: productId, qty });
  }

  saveCart();
  updateCartUI();
  showToast(`<i class="fas fa-check-circle"></i> <span><strong>${product.title.substring(0, 40)}...</strong> added to cart!</span>`, 'success');
  
  // Animate cart icon
  animateCartIcon();
}

function animateCartIcon() {
  const cartIcon = document.querySelector('#cart-toggle-btn .cart-icon-wrapper');
  if (cartIcon) {
    cartIcon.style.transform = 'scale(1.3)';
    setTimeout(() => cartIcon.style.transform = 'scale(1)', 300);
  }
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  showToast('<i class="fas fa-trash"></i> <span>Item removed from cart</span>', 'error');
}

function updateCartQty(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, Math.min(10, item.qty + delta));
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('desideal_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalItems = state.cart.reduce((sum, i) => sum + i.qty, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = totalItems;

  const itemCountEl = document.getElementById('cart-item-count');
  if (itemCountEl) itemCountEl.textContent = totalItems;

  renderCartItems();
  updateCartTotals();
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  container.innerHTML = state.cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return '';
    return `
      <div class="cart-item" id="cart-item-${product.id}">
        <div class="cart-item-image">${product.emoji}</div>
        <div class="cart-item-details">
          <p class="cart-item-title">${product.title}</p>
          <p class="cart-item-price">₹${(product.price * item.qty).toFixed(2)}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="updateCartQty(${product.id}, -1)">−</button>
            <span class="qty-display">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty(${product.id}, 1)">+</button>
            <button class="cart-item-remove" onclick="removeFromCart(${product.id})">
              <i class="fas fa-trash-alt"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return product ? sum + product.price * item.qty : sum;
  }, 0);

  const discount = subtotal * (state.promoDiscount / 100);
  const total = subtotal - discount;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('cart-subtotal', `₹${subtotal.toFixed(2)}`);
  setEl('cart-total', `₹${total.toFixed(2)}`);
  setEl('cart-discount-amount', `-₹${discount.toFixed(2)}`);

  const discRow = document.getElementById('cart-discount-row');
  if (discRow) discRow.classList.toggle('hidden', state.promoDiscount === 0);

  setEl('cart-shipping', subtotal >= 499 || subtotal === 0 ? 'FREE' : '₹40.00');
}

// ── Promo Code ─────────────────────────────────────────────
function applyPromo() {
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  if (PROMO_CODES[code]) {
    state.promoDiscount = PROMO_CODES[code];
    updateCartTotals();
    showToast(`<i class="fas fa-tag"></i> <span>Promo applied! ${code} – ${state.promoDiscount}% off!</span>`, 'success');
    input.style.borderColor = '#067D62';
  } else {
    showToast('<i class="fas fa-times-circle"></i> <span>Invalid promo code</span>', 'error');
    input.style.borderColor = '#CC0000';
    setTimeout(() => input.style.borderColor = '', 2000);
  }
}

// ── Toggle Cart ────────────────────────────────────────────
function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const isOpen = drawer.classList.contains('open');

  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartUI();
  }
}

// ── Sidebar ────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
  document.body.style.overflow = sidebar.classList.contains('hidden') ? '' : 'hidden';
}

// ── Wishlist ───────────────────────────────────────────────
function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId);
  const product = PRODUCTS.find(p => p.id === productId);

  if (idx > -1) {
    state.wishlist.splice(idx, 1);
    showToast(`<i class="far fa-heart"></i> <span>Removed from wishlist</span>`, 'info');
  } else {
    state.wishlist.push(productId);
    showToast(`<i class="fas fa-heart"></i> <span><strong>${product?.title?.substring(0, 30)}...</strong> added to wishlist!</span>`, 'success');
  }

  localStorage.setItem('desideal_wishlist', JSON.stringify(state.wishlist));

  // Update wishlist button in modal
  const modalBtn = document.getElementById('modal-wishlist-btn');
  if (modalBtn) {
    const icon = modalBtn.querySelector('i');
    if (icon) {
      icon.className = state.wishlist.includes(productId) ? 'fas fa-heart' : 'far fa-heart';
    }
  }

  // Re-render products to update wishlist icons
  renderProducts();
}

// ── Recently Viewed ────────────────────────────────────────
function addToRecentlyViewed(productId) {
  state.recentlyViewed = state.recentlyViewed.filter(id => id !== productId);
  state.recentlyViewed.unshift(productId);
  if (state.recentlyViewed.length > 8) state.recentlyViewed.pop();
  localStorage.setItem('desideal_recent', JSON.stringify(state.recentlyViewed));
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const section = document.getElementById('recently-section');
  const grid = document.getElementById('recently-grid');
  if (!section || !grid) return;

  if (state.recentlyViewed.length < 2) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  grid.innerHTML = state.recentlyViewed.map(id => {
    const p = PRODUCTS.find(prod => prod.id === id);
    if (!p) return '';
    return `
      <div class="product-card" onclick="openProductModal(${p.id})" style="cursor:pointer;">
        <div class="product-image-wrap" style="height:120px;">
          <span class="product-emoji" style="font-size:50px;">${p.emoji}</span>
        </div>
        <div class="product-info" style="padding:10px;">
          <p class="product-title" style="font-size:12px;-webkit-line-clamp:2;">${p.title}</p>
          <span class="price-sale" style="font-size:14px;">₹${p.price.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Sign In Modal ──────────────────────────────────────────
function showSignIn() {
  document.getElementById('signin-modal-overlay').classList.add('active');
  document.getElementById('signin-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSignIn() {
  document.getElementById('signin-modal-overlay').classList.remove('active');
  document.getElementById('signin-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById('signin-email').value;
  closeSignIn();
  showToast(`<i class="fas fa-user-check"></i> <span>Welcome back! Signed in as <strong>${email}</strong></span>`, 'success');
  const headerBtn = document.querySelector('#account-btn .bold-label');
  if (headerBtn) headerBtn.textContent = 'Account & Lists ▾';
}

function togglePassword() {
  const input = document.getElementById('signin-password');
  const btn = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// ── Payment Options ────────────────────────────────────────
function setupPaymentOptions() {
  const options = document.querySelectorAll('.payment-option');
  options.forEach(option => {
    option.addEventListener('click', function() {
      options.forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      const cardForm = document.getElementById('card-form');
      if (cardForm) {
        cardForm.style.display = this.dataset.method === 'card' || !this.dataset.method ? 'block' : 'none';
      }
    });
  });
}

function setupCardFormatting() {
  const cardInput = document.getElementById('card-number-input');
  if (!cardInput) return;
  cardInput.addEventListener('input', function() {
    let val = this.value.replace(/\D/g, '').substring(0, 16);
    this.value = val.replace(/(.{4})/g, '$1 ').trim();
  });
}

// ── Checkout ───────────────────────────────────────────────
function goToCheckout() {
  if (state.cart.length === 0) {
    showToast('<i class="fas fa-exclamation-circle"></i> <span>Your cart is empty!</span>', 'error');
    return;
  }

  // Close cart drawer
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  drawer.classList.remove('open');
  overlay.classList.remove('active');

  // Render checkout items
  const subtotal = state.cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
  const tax = subtotal * 0.18; // Updated to 18% GST for India
  const total = subtotal + tax;

  document.getElementById('co-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('co-tax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('co-total').textContent = `₹${total.toFixed(2)}`;

  const itemsHtml = state.cart.map(item => {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    if (!p) return '';
    return `
      <div class="checkout-item">
        <span class="checkout-item-emoji">${p.emoji}</span>
        <div class="checkout-item-info">
          <p class="checkout-item-name">${p.title.substring(0, 45)}${p.title.length > 45 ? '...' : ''}</p>
          <p class="checkout-item-qty">Qty: ${item.qty}</p>
        </div>
        <span class="checkout-item-price">₹${(p.price * item.qty).toFixed(2)}</span>
      </div>
    `;
  }).join('');

  document.getElementById('checkout-items-list').innerHTML = itemsHtml;

  const checkoutOverlay = document.getElementById('checkout-overlay');
  checkoutOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkout-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Place Order ────────────────────────────────────────────
function placeOrder() {
  const orderNum = 'DD-' + Date.now().toString().slice(-8);
  
  const successItems = state.cart.map(item => {
    const p = PRODUCTS.find(prod => prod.id === item.id);
    if (!p) return '';
    return `
      <div class="checkout-item" style="padding:8px 0;border-bottom:1px solid #eee;">
        <span class="checkout-item-emoji">${p.emoji}</span>
        <div class="checkout-item-info">
          <p class="checkout-item-name">${p.title.substring(0, 50)}</p>
          <p class="checkout-item-qty">Qty: ${item.qty}</p>
        </div>
        <span class="checkout-item-price">₹${(p.price * item.qty).toFixed(2)}</span>
      </div>
    `;
  }).join('');

  document.getElementById('order-number').textContent = `Order #${orderNum}`;
  document.getElementById('success-items').innerHTML = successItems;
  
  // Close checkout
  document.getElementById('checkout-overlay').classList.add('hidden');
  
  // Show success
  document.getElementById('order-success-overlay').classList.remove('hidden');

  // Clear cart
  state.cart = [];
  saveCart();
  updateCartUI();
}

function closeOrderSuccess() {
  document.getElementById('order-success-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  showToast('<i class="fas fa-check-circle"></i> <span>Thank you for your order! Happy shopping! 🎉</span>', 'success');
}

// ── Toast Notifications ────────────────────────────────────
function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'default' ? 'toast-default' : type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Keyboard Shortcuts ─────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeSignIn();
    closeCheckout();
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('hidden')) toggleSidebar();
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer.classList.contains('open')) toggleCart();
  }
});

// ── Scroll Effects ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  if (window.scrollY > 60) {
    header.style.boxShadow = '0 4px 20px rgba(0,0,0,.4)';
  } else {
    header.style.boxShadow = '0 2px 8px rgba(0,0,0,.4)';
  }
});
