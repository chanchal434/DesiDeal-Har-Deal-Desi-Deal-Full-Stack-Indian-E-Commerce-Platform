/**
 * ============================================================
 * DesiDeal – Main Application JavaScript
 * Architecture: ES6 Class-Based Modular Structure
 * ============================================================
 */

"use strict"; // Enforce strict mode for cleaner, safer code

// ── 1. CONFIGURATION & STATE ────────────────────────────────

class StoreConfig {
    static SHIPPING_THRESHOLD = 499;
    static SHIPPING_COST = 40;       
    static GST_RATE = 0.18;          
    static MAX_QTY = 10;             
    static SLIDER_DELAY = 6000;      
    static SKELETON_DELAY = 1200;    
    static PROMO_CODES = {
        'SAVE10': 10,
        'WELCOME20': 20,
        'PRIME15': 15,
        'FLASH25': 25
    };
    static API_BASE = '/api';
}

class StateManager {
    constructor() {
        this.products = [];
        this.cart = JSON.parse(localStorage.getItem('desideal_cart') || '[]');
        this.wishlist = JSON.parse(localStorage.getItem('desideal_wishlist') || '[]');
        this.recentlyViewed = JSON.parse(localStorage.getItem('desideal_recent') || '[]');
        
        this.filters = {
            category: 'all',
            search: '',
            sort: 'featured',
            view: 'grid'
        };
        
        this.display = {
            count: 12,
            slideIndex: 0,
            promoDiscount: 0,
            modalQty: 1
        };
    }

    saveWishlist() { 
        localStorage.setItem('desideal_wishlist', JSON.stringify(this.wishlist)); 
    }
    
    saveRecent() { 
        localStorage.setItem('desideal_recent', JSON.stringify(this.recentlyViewed)); 
    }
}

const state = new StateManager();

// ── 2. SERVICES (Business Logic) ────────────────────────────

class ProductAPI {
    /**
     * Filters and sorts the global product list based on current state.
     * @returns {Array} Array of filtered product objects
     */
    static getFilteredProducts() {
        let filtered = [...state.products];

        if (state.filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === state.filters.category);
        }

        if (state.filters.search) {
            const q = state.filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }

        switch (state.filters.sort) {
            case 'price-low': return filtered.sort((a, b) => a.price - b.price);
            case 'price-high': return filtered.sort((a, b) => b.price - a.price);
            case 'rating': return filtered.sort((a, b) => b.rating - a.rating);
            case 'reviews': return filtered.sort((a, b) => b.reviews - a.reviews);
            case 'newest': return filtered.sort((a, b) => (b.badge === 'new' ? -1 : 1));
            default: return filtered;
        }
    }

    static trackRecentView(productId) {
        state.recentlyViewed = state.recentlyViewed.filter(id => id !== productId);
        state.recentlyViewed.unshift(productId);
        if (state.recentlyViewed.length > 8) state.recentlyViewed.pop();
        state.saveRecent();
    }
}

class CartManager {
    /**
     * Calculates all cart totals including tax and shipping.
     * @returns {Object} Object containing subtotal, discount, shipping, tax, and total
     */
    static calculateTotals() {
        const subtotal = state.cart.reduce((sum, item) => {
            const product = state.products.find(p => p.id === item.id);
            return product ? sum + (product.price * item.qty) : sum;
        }, 0);

        const discount = subtotal * (state.display.promoDiscount / 100);
        const totalAfterDiscount = subtotal - discount;
        const shipping = (totalAfterDiscount >= StoreConfig.SHIPPING_THRESHOLD || totalAfterDiscount === 0) 
            ? 0 : StoreConfig.SHIPPING_COST;
        const tax = totalAfterDiscount * StoreConfig.GST_RATE;

        return {
            subtotal,
            discount,
            shipping,
            tax,
            total: totalAfterDiscount + shipping + tax
        };
    }

    static addItem(productId, qty = 1) {
        const existing = state.cart.find(item => item.id === productId);
        if (existing) {
            existing.qty = Math.min(existing.qty + qty, StoreConfig.MAX_QTY);
        } else {
            state.cart.push({ id: productId, qty });
        }
        this.saveCart(); 
    }

    static updateQty(productId, delta) {
        const item = state.cart.find(i => i.id === productId);
        if (!item) return;
        item.qty = Math.max(1, Math.min(StoreConfig.MAX_QTY, item.qty + delta));
        if (item.qty <= 0) {
            state.cart = state.cart.filter(item => item.id !== productId);
        }
        this.saveCart(); 
    }

    static removeItem(productId) {
        state.cart = state.cart.filter(item => item.id !== productId);
        this.saveCart(); 
    }

    static async saveCart() {
        localStorage.setItem('desideal_cart', JSON.stringify(state.cart));
        const token = localStorage.getItem('desideal_token');
        if (!token) return;

        try {
            await fetch(`${StoreConfig.API_BASE}/cart`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ cart: state.cart })
            });
        } catch (error) {
            console.error("Failed to sync cart to database:", error);
        }
    }
    
    static async loadCartFromDB() {
        const token = localStorage.getItem('desideal_token');
        if (!token) return;

        try {
            const response = await fetch(`${StoreConfig.API_BASE}/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.cart.length > 0) {
                state.cart = data.cart;
                localStorage.setItem('desideal_cart', JSON.stringify(state.cart));
                UIManager.updateCartUI();
            }
        } catch (error) {
            console.error("Failed to load cart from database:", error);
        }
    }
}

// ── 3. UI CONTROLLER (Presentation) ──────────────────────────

class UIManager {
    static formatCurrency(amount) {
        return `₹${amount.toFixed(2)}`;
    }

    static formatNumber(n) {
        return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
    }

    static updateAuthUI() {
        const token = localStorage.getItem('desideal_token');
        const userName = localStorage.getItem('desideal_name');
        const isPrime = localStorage.getItem('desideal_prime') === 'true'; // Check for Prime Status
        
        const elements = {
            greeting: document.getElementById('nav-user-greeting'),
            dropHeader: document.getElementById('nav-dropdown-header'),
            signoutBtn: document.getElementById('nav-signout'),
            sidebarGreeting: document.querySelector('#sidebar-header span'),
            sidebarSignIn: document.getElementById('sidebar-signin-link'),
            sidebarSignOut: document.getElementById('sidebar-signout-link')
        };

        if (token && userName) {
            // Add Crown icon if user is Prime
            const displayGreeting = isPrime 
                ? `Hello, ${userName} <i class="fas fa-crown text-green" style="color: #FFD814 !important;" title="Prime Member"></i>` 
                : `Hello, ${userName}`;

            if (elements.greeting) elements.greeting.innerHTML = displayGreeting;
            if (elements.sidebarGreeting) elements.sidebarGreeting.innerHTML = displayGreeting;
            if (elements.dropHeader) elements.dropHeader.classList.add('hidden');
            if (elements.signoutBtn) elements.signoutBtn.classList.remove('hidden');
            if (elements.sidebarSignIn) elements.sidebarSignIn.style.display = 'none';
            if (elements.sidebarSignOut) elements.sidebarSignOut.style.display = 'block';
        } else {
            if (elements.greeting) elements.greeting.textContent = `Hello, Sign in`;
            if (elements.sidebarGreeting) elements.sidebarGreeting.textContent = `Hello, User`;
            if (elements.dropHeader) elements.dropHeader.classList.remove('hidden');
            if (elements.signoutBtn) elements.signoutBtn.classList.add('hidden');
            if (elements.sidebarSignIn) elements.sidebarSignIn.style.display = 'block';
            if (elements.sidebarSignOut) elements.sidebarSignOut.style.display = 'none';
        }
    }

    static async init() {
        try {
            const response = await fetch(`${StoreConfig.API_BASE}/products`);
            const result = await response.json();
            
            if (result.success) {
                state.products = result.data; 
                this.updateAuthUI();
                
                if (localStorage.getItem('desideal_token')) {
                    await CartManager.loadCartFromDB(); 
                }
            }
        } catch (error) {
            this.showToast("<i class='fas fa-wifi'></i> Server offline.", "error");
        }

        this.renderProducts();
        this.updateCartUI();
        this.startTimer();
        this.startHeroSlider();
        this.setupSearch();
        this.setupCardFormatting();
        this.renderRecentlyViewed();
    }

    static renderProducts() {
        const grid = document.getElementById('products-grid');
        const loadWrap = document.getElementById('load-more-wrapper');
        if (!grid) return; 

        const allProducts = ProductAPI.getFilteredProducts();
        const visible = allProducts.slice(0, state.display.count);

        grid.className = state.filters.view === 'list' ? 'list-view' : '';

        if (visible.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#565959;">
                    <i class="fas fa-search" style="font-size:48px;opacity:.3;display:block;margin-bottom:16px;"></i>
                    <h3 style="font-size:20px;margin-bottom:8px;">No products found</h3>
                </div>
            `;
            if(loadWrap) loadWrap.style.display = 'none';
            return;
        }

        grid.innerHTML = Array(Math.min(8, visible.length)).fill(`
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-btn"></div>
            </div>
        `).join('');
        if(loadWrap) loadWrap.style.display = 'none';

        setTimeout(() => {
            grid.innerHTML = visible.map(p => this.createProductCardHTML(p)).join('');
            this.updateActiveFilters();
            
            const loadBtn = document.getElementById('load-more-btn');
            if (loadWrap && loadBtn) {
                loadWrap.style.display = allProducts.length > state.display.count ? 'block' : 'none';
                loadBtn.innerHTML = `Load More (${allProducts.length - state.display.count} more) <i class="fas fa-chevron-down"></i>`;
            }
        }, StoreConfig.SKELETON_DELAY);
    }

    static createProductCardHTML(product) {
        const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
        const isWishlisted = state.wishlist.includes(product.id);
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
            ? `<p class="product-shipping"><i class="fas fa-shipping-fast"></i> FREE Delivery</p>`
            : `<p class="product-shipping paid"><i class="fas fa-truck"></i> Ships ${this.formatCurrency(StoreConfig.SHIPPING_COST)}</p>`;

        return `
            <article class="product-card ${state.filters.view === 'list' ? 'list-card' : ''}" onclick="window.openProductModal(${product.id})">
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
                </div>
            </article>
        `;
    }

    static updateActiveFilters() {
        const container = document.getElementById('active-filters');
        if(!container) return;
        if (state.filters.category === 'all' && !state.filters.search) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');
        container.innerHTML = '<span style="font-size:13px;font-weight:600;color:#565959;">Active Filters:</span>';
        
        if (state.filters.category !== 'all') {
            container.innerHTML += `<span class="filter-tag">${state.filters.category} <button onclick="window.filterCategory('all')">×</button></span>`;
        }
        if (state.filters.search) {
            container.innerHTML += `<span class="filter-tag">"${state.filters.search}" <button onclick="window.clearSearch()">×</button></span>`;
        }
    }

    static updateCartUI() {
        const totals = CartManager.calculateTotals();
        const totalItems = state.cart.reduce((sum, i) => sum + i.qty, 0);
        
        if(document.getElementById('cart-count')) document.getElementById('cart-count').textContent = totalItems;
        if(document.getElementById('cart-item-count')) document.getElementById('cart-item-count').textContent = totalItems;

        const subtotalEl = document.getElementById('cart-subtotal');
        if (subtotalEl) {
            subtotalEl.textContent = this.formatCurrency(totals.subtotal);
            document.getElementById('cart-total').textContent = this.formatCurrency(totals.total);
            
            const discEl = document.getElementById('cart-discount-amount');
            if(discEl) discEl.textContent = `-${this.formatCurrency(totals.discount)}`;
            
            const shipEl = document.getElementById('cart-shipping');
            if(shipEl) shipEl.textContent = totals.shipping === 0 ? 'FREE' : this.formatCurrency(totals.shipping);

            const discRow = document.getElementById('cart-discount-row');
            if(discRow) discRow.classList.toggle('hidden', state.display.promoDiscount === 0);

            const container = document.getElementById('cart-items');
            if (state.cart.length === 0) {
                container.innerHTML = '';
                document.getElementById('cart-empty').classList.remove('hidden');
                return;
            }
            
            document.getElementById('cart-empty').classList.add('hidden');
            container.innerHTML = state.cart.map(item => {
                const p = state.products.find(prod => prod.id === item.id);
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
        }
    }

    static showToast(message, type = 'default') {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'default' ? 'toast-default' : type}`;
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static renderRecentlyViewed() {
        const section = document.getElementById('recently-section');
        const grid = document.getElementById('recently-grid');
        if(!section || !grid) return;

        if (state.recentlyViewed.length < 2) {
            section.classList.add('hidden');
            return;
        }
        section.classList.remove('hidden');
        grid.innerHTML = state.recentlyViewed.map(id => {
            const p = state.products.find(prod => prod.id === id);
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
    }

    static startHeroSlider() { 
        if(document.getElementById('hero-slider')) {
            setInterval(() => window.changeSlide(1), StoreConfig.SLIDER_DELAY); 
        }
    }
    
    static startTimer() {
        const key = 'desideal_timer_end';
        let endTime = parseInt(localStorage.getItem(key) || '0');
        if (!endTime || endTime < Date.now()) {
            endTime = Date.now() + 8 * 60 * 60 * 1000;
            localStorage.setItem(key, endTime);
        }
        setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            if(document.getElementById('timer-h')) {
                document.getElementById('timer-h').textContent = String(Math.floor(remaining / 3600000)).padStart(2, '0');
                document.getElementById('timer-m').textContent = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
                document.getElementById('timer-s').textContent = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
            }
        }, 1000);
    }

    static setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        let timeout = null;
        if(searchInput && searchBtn) {
            searchInput.addEventListener('input', e => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if(e.target.value.length > 2 || e.target.value.length === 0) {
                        window.performSearch();
                    }
                }, 400);
            });
            
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    clearTimeout(timeout);
                    window.performSearch();
                }
            });
            
            searchBtn.addEventListener('click', window.performSearch);
        }
    }

    static setupCardFormatting() {
        const cardInput = document.getElementById('card-number-input');
        if(cardInput) {
            cardInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
            });
        }
    }
}

// ── 4. INITIALIZATION & EVENT LISTENERS ──────────────────────

document.addEventListener('DOMContentLoaded', () => UIManager.init());

window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if(header) {
        header.style.boxShadow = window.scrollY > 60 ? '0 4px 20px rgba(0,0,0,.4)' : '0 2px 8px rgba(0,0,0,.4)';
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        window.closeProductModal();
        window.closeAuthModal();
        window.closeCheckout();
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) window.toggleSidebar();
        const drawer = document.getElementById('cart-drawer');
        if (drawer && drawer.classList.contains('open')) window.toggleCart();
    }
});

// ── 5. GLOBAL BRIDGES (Connecting HTML to Classes) ──────────

window.filterCategory = (cat) => {
    state.filters.category = cat;
    state.filters.search = '';
    state.display.count = 12;
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    
    const title = document.getElementById('products-title');
    if(title) title.textContent = cat === 'all' ? 'All Products' : cat.toUpperCase();
    
    UIManager.renderProducts();
    const sec = document.getElementById('products-section');
    if(sec) sec.scrollIntoView({ behavior: 'smooth' });
};

window.performSearch = () => {
    state.filters.search = document.getElementById('search-input').value.trim();
    state.filters.category = document.getElementById('search-category').value;
    state.display.count = 12;
    
    const title = document.getElementById('products-title');
    if(title) title.textContent = `Search results for "${state.filters.search}"`;
    
    UIManager.renderProducts();
    const sec = document.getElementById('products-section');
    if(sec) sec.scrollIntoView({ behavior: 'smooth' });
};

window.clearSearch = () => {
    state.filters.search = '';
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    window.filterCategory(state.filters.category);
};

window.sortProducts = () => { 
    state.filters.sort = document.getElementById('sort-select').value; 
    UIManager.renderProducts(); 
};

window.setView = (view) => {
    state.filters.view = view;
    document.getElementById('grid-view-btn').classList.toggle('active', view === 'grid');
    document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
    UIManager.renderProducts();
};

window.loadMore = () => { 
    state.display.count += 8; 
    UIManager.renderProducts(); 
};

window.changeSlide = (direction) => {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if(!slides.length) return;
    
    slides[state.display.slideIndex].classList.remove('active');
    if(dots[state.display.slideIndex]) dots[state.display.slideIndex].classList.remove('active');
    
    state.display.slideIndex = (state.display.slideIndex + direction + slides.length) % slides.length;
    
    slides[state.display.slideIndex].classList.add('active');
    if(dots[state.display.slideIndex]) dots[state.display.slideIndex].classList.add('active');
};

window.goToSlide = (index) => {
    const slides = document.querySelectorAll('.hero-slide');
    if(!slides.length || index < 0 || index >= slides.length) return;
    window.changeSlide(index - state.display.slideIndex);
};

window.addToCart = (id) => {
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to add items.', 'error');
        return window.showAuthModal('signin');
    }
    CartManager.addItem(id, 1);
    UIManager.updateCartUI();
    const product = state.products.find(p => p.id === id);
    if(product) {
        UIManager.showToast(`<i class="fas fa-check-circle"></i> <span><strong>${product.title.substring(0, 30)}...</strong> added!</span>`, 'success');
    }
};

window.updateCartQty = (id, delta) => { 
    CartManager.updateQty(id, delta); 
    UIManager.updateCartUI(); 
};

window.removeFromCart = (id) => { 
    CartManager.removeItem(id); 
    UIManager.updateCartUI(); 
    UIManager.showToast('<i class="fas fa-trash"></i> <span>Item removed</span>', 'error'); 
};

window.toggleCart = () => {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if(!drawer || !overlay) return;
    
    drawer.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
};

window.applyPromo = () => {
    const codeInput = document.getElementById('promo-input');
    if(!codeInput) return;
    
    const code = codeInput.value.trim().toUpperCase();
    if (StoreConfig.PROMO_CODES[code]) {
        state.display.promoDiscount = StoreConfig.PROMO_CODES[code];
        UIManager.updateCartUI();
        UIManager.showToast(`<i class="fas fa-tag"></i> <span>Promo applied!</span>`, 'success');
    } else {
        UIManager.showToast('<i class="fas fa-times-circle"></i> <span>Invalid code</span>', 'error');
    }
};

window.toggleWishlist = (id) => {
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to use wishlist.', 'error');
        return window.showAuthModal('signin');
    }
    const idx = state.wishlist.indexOf(id);
    if (idx > -1) {
        state.wishlist.splice(idx, 1);
        UIManager.showToast(`<i class="far fa-heart"></i> <span>Removed from wishlist</span>`, 'info');
    } else {
        state.wishlist.push(id);
        UIManager.showToast(`<i class="fas fa-heart"></i> <span>Added to wishlist!</span>`, 'success');
    }
    state.saveWishlist();
    UIManager.renderProducts(); 
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if(!sidebar) return;
    sidebar.classList.toggle('hidden');
    document.body.style.overflow = sidebar.classList.contains('hidden') ? '' : 'hidden';
};

window.showAuthModal = (view = 'signin') => { 
    document.getElementById('auth-modal-overlay').classList.add('active'); 
    document.getElementById('auth-modal').classList.add('active'); 
    window.toggleAuthView(view);
};

window.closeAuthModal = () => { 
    const overlay = document.getElementById('auth-modal-overlay');
    if(overlay) overlay.classList.remove('active'); 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.remove('active'); 
};

window.toggleAuthView = (view) => {
    document.getElementById('signin-container').classList.toggle('hidden', view !== 'signin');
    document.getElementById('signup-container').classList.toggle('hidden', view !== 'signup');
};

// Auth API Bridges
window.handleSignIn = async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
        const response = await fetch(`${StoreConfig.API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();

        if (data.success) {
            const firstName = data.user.name.split(' ')[0];
            localStorage.setItem('desideal_token', data.token);
            localStorage.setItem('desideal_name', firstName); 
            localStorage.setItem('desideal_prime', data.user.is_prime);
            
            window.closeAuthModal();
            UIManager.showToast(`<i class="fas fa-user-check"></i> <span>Welcome back, <strong>${data.user.name}</strong>!</span>`, 'success');
            
            UIManager.updateAuthUI(); 
            document.getElementById('signin-form').reset();
            
            await CartManager.loadCartFromDB();
        } else {
            UIManager.showToast(`<i class="fas fa-exclamation-circle"></i> <span>${data.message}</span>`, 'error');
        }
    } catch (error) {
        UIManager.showToast('<i class="fas fa-wifi"></i> <span>Cannot connect to server. Is it running?</span>', 'error');
    }
};

window.handleSignOut = () => {
    const userConfirmed = confirm("Are you sure you want to sign out of DesiDeal? You'll miss out on personalized deals!");
    
    if (userConfirmed) {
        localStorage.removeItem('desideal_token');
        localStorage.removeItem('desideal_name');
        localStorage.removeItem('desideal_prime'); 
        
        state.cart = [];
        localStorage.setItem('desideal_cart', JSON.stringify([]));
        
        UIManager.updateCartUI();
        UIManager.updateAuthUI(); 
        
        UIManager.showToast('<i class="fas fa-sign-out-alt"></i> Signed out successfully.', 'info');
        
        if (window.location.pathname.includes('profile.html') || 
            window.location.pathname.includes('orders.html') || 
            window.location.pathname.includes('wishlist.html') ||
            window.location.pathname.includes('security.html')) {
            window.location.href = 'index.html';
        }
    }
};

window.handleRegister = async (e) => {
    e.preventDefault(); 
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${StoreConfig.API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            UIManager.showToast(`<i class="fas fa-check"></i> <span>Account created! You can now log in.</span>`, 'success');
            document.getElementById('signup-form').reset();
            window.toggleAuthView('signin'); 
            document.getElementById('signin-email').value = email; 
        } else {
            UIManager.showToast(`<i class="fas fa-times"></i> <span>${data.message}</span>`, 'error');
        }
    } catch (error) {
        UIManager.showToast('Error connecting to server.', 'error');
    }
};

window.togglePassword = (inputId) => {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    input.nextElementSibling.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
};

window.openProductModal = (id) => {
    const p = state.products.find(prod => prod.id === id);
    if (!p) return;
    state.display.modalQty = 1;
    ProductAPI.trackRecentView(id);

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
                <span style="font-size: 24px; font-weight: bold; color: #CC0000;">${UIManager.formatCurrency(p.price)}</span>
                ${p.originalPrice ? `<span style="text-decoration: line-through; color: #555; margin-left: 10px;">${UIManager.formatCurrency(p.originalPrice)}</span> (-${discount}%)` : ''}
            </div>
            <p class="modal-desc" style="margin: 15px 0;">${p.description}</p>
            <div class="modal-qty-section">
                <span>Qty:</span>
                <button onclick="window.changeModalQty(-1)">−</button>
                <span id="modal-qty-display">${state.display.modalQty}</span>
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

window.closeProductModal = () => { 
    const overlay = document.getElementById('product-modal-overlay');
    if(overlay) overlay.classList.remove('active'); 
    const modal = document.getElementById('product-modal');
    if(modal) modal.classList.remove('active'); 
};

window.changeModalQty = (delta) => { 
    state.display.modalQty = Math.max(1, Math.min(StoreConfig.MAX_QTY, state.display.modalQty + delta)); 
    document.getElementById('modal-qty-display').textContent = state.display.modalQty; 
};

window.addToCartFromModal = (id) => { 
    if (!localStorage.getItem('desideal_token')) {
        window.closeProductModal();
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to add items.', 'error');
        return window.showAuthModal('signin');
    }
    CartManager.addItem(id, state.display.modalQty); 
    UIManager.updateCartUI(); 
    window.closeProductModal(); 
    UIManager.showToast('Added to cart!', 'success'); 
};

window.goToCheckout = () => {
    if (state.cart.length === 0) return UIManager.showToast('Your cart is empty!', 'error');
    window.toggleCart();
    
    const totals = CartManager.calculateTotals();
    document.getElementById('co-subtotal').textContent = UIManager.formatCurrency(totals.subtotal);
    document.getElementById('co-tax').textContent = UIManager.formatCurrency(totals.tax);
    document.getElementById('co-total').textContent = UIManager.formatCurrency(totals.total);

    document.getElementById('checkout-items-list').innerHTML = state.cart.map(item => {
        const p = state.products.find(prod => prod.id === item.id);
        const img = p.image || `https://placehold.co/50x50/f3f4f6/565959`;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px;">
                    <span><img src="${img}" width="30" style="vertical-align:middle; margin-right:10px;"/>${p.title.substring(0, 20)} (x${item.qty})</span>
                    <strong>${UIManager.formatCurrency(p.price * item.qty)}</strong>
                </div>`;
    }).join('');
    
    document.getElementById('checkout-overlay').classList.remove('hidden');
};

window.closeCheckout = () => {
    const overlay = document.getElementById('checkout-overlay');
    if(overlay) overlay.classList.add('hidden');
};

window.selectPaymentOption = (method) => {
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.checked = false;
        const parentDiv = radio.closest('.payment-option');
        if(parentDiv) parentDiv.classList.remove('selected');
    });

    const selectedRadio = document.querySelector(`input[name="payment"][value="${method}"]`);
    if (selectedRadio) {
        selectedRadio.checked = true;
        const parentDiv = selectedRadio.closest('.payment-option');
        if(parentDiv) parentDiv.classList.add('selected');
    }

    const cardForm = document.getElementById('card-form');
    if (cardForm) {
        cardForm.style.display = (method === 'card') ? 'block' : 'none';
    }
};

window.placeOrder = async () => {
    const token = localStorage.getItem('desideal_token');
    if (!token) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to place an order.', 'error');
        window.closeCheckout();
        return window.showAuthModal('signin');
    }

    if (state.cart.length === 0) return UIManager.showToast('Your cart is empty!', 'error');

    const selectedRadio = document.querySelector('input[name="payment"]:checked');
    if (!selectedRadio) return UIManager.showToast('Please select a payment method.', 'error');
    
    const selectedPaymentMethod = selectedRadio.value;
    const totals = CartManager.calculateTotals();
    const shippingInfo = { address: "User Address from Checkout Form" };

    if (selectedPaymentMethod === 'desideal') {
        UIManager.showToast('<i class="fas fa-wallet"></i> Insufficient DesiDeal Balance. Please select Card, UPI, or COD.', 'error');
        return; 
    }

    if (selectedPaymentMethod === 'cod') {
        try {
            const response = await fetch(`${StoreConfig.API_BASE}/orders/cod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: state.cart, total: totals.total, shipping: shippingInfo })
            });
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('order-number').textContent = `Order #${data.order_number}`;
                window.closeCheckout();
                document.getElementById('order-success-overlay').classList.remove('hidden');
                state.cart = []; localStorage.setItem('desideal_cart', JSON.stringify([])); UIManager.updateCartUI();
            } else { UIManager.showToast(data.message, 'error'); }
        } catch (error) { UIManager.showToast('<i class="fas fa-wifi"></i> Failed to place COD order.', 'error'); }
        return; 
    }

    try {
        const orderRes = await fetch(`${StoreConfig.API_BASE}/payment/create-order`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ total: totals.total })
        });
        const orderData = await orderRes.json();
        
        if (!orderData.success) throw new Error("Could not create order");

        const options = {
            key: orderData.key_id, amount: orderData.amount, currency: "INR",
            name: "DesiDeal.in", description: "Secure Digital Payment", order_id: orderData.razorpay_order_id,
            handler: async function (response) {
                const verifyRes = await fetch(`${StoreConfig.API_BASE}/orders/verify-and-save`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ 
                        razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature, items: state.cart, total: totals.total, shipping: shippingInfo
                    })
                });
                const verifyData = await verifyRes.json();
                
                if (verifyData.success) {
                    document.getElementById('order-number').textContent = `Order #${verifyData.order_number}`;
                    window.closeCheckout(); document.getElementById('order-success-overlay').classList.remove('hidden');
                    state.cart = []; localStorage.setItem('desideal_cart', JSON.stringify([])); UIManager.updateCartUI();
                } else {
                    UIManager.showToast(verifyData.message, 'error');
                }
            },
            theme: { color: "#FF9933" }
        };
        
        const rzp = new window.Razorpay(options); rzp.open();
    } catch (error) { UIManager.showToast('Payment system error.', 'error'); }
};

window.closeOrderSuccess = () => {
    const overlay = document.getElementById('order-success-overlay');
    if(overlay) overlay.classList.add('hidden');
};

// ── 6. PRIME, SUPPORT, & SELLER LOGIC ────────────────────────

window.handleJoinPrime = async () => {
    const token = localStorage.getItem('desideal_token');
    if (!token) return window.location.href = 'index.html';
    
    try {
        const response = await fetch(`${StoreConfig.API_BASE}/join-prime`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('desideal_prime', 'true');
            UIManager.showToast(`<i class="fas fa-crown"></i> ${data.message}`, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        } else {
            UIManager.showToast(`<i class="fas fa-info-circle"></i> ${data.message}`, 'info');
        }
    } catch (error) {
        UIManager.showToast('Failed to connect to server.', 'error');
    }
};

window.handleSupportTicket = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('desideal_token');
    if (!token) return UIManager.showToast('Please sign in to submit a ticket.', 'error');

    const subject = document.getElementById('ticket-subject').value;
    const message = document.getElementById('ticket-message').value;

    try {
        const response = await fetch(`${StoreConfig.API_BASE}/support-ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subject, message })
        });
        const data = await response.json();
        
        if (data.success) {
            UIManager.showToast(`<i class="fas fa-check"></i> ${data.message}`, 'success');
            e.target.reset(); 
        } else {
            UIManager.showToast(data.message, 'error');
        }
    } catch (error) {
        UIManager.showToast('Failed to submit ticket.', 'error');
    }
};

window.handleSellerApplication = (e) => {
    e.preventDefault();
    
    // Ensure user is signed in before applying to be a seller
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to your customer account first to apply as a seller.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }

    UIManager.showToast('<i class="fas fa-check-circle"></i> Application received! Our team will contact you soon.', 'success');
    e.target.reset();
};

window.handleAffiliateApplication = (e) => {
    e.preventDefault();
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to join the Affiliate Program.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }
    UIManager.showToast('<i class="fas fa-check-circle"></i> Affiliate application received! We will review your profile.', 'success');
    e.target.reset();
};

window.handleAdInquiry = (e) => {
    e.preventDefault();
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to request an advertising consultation.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }
    UIManager.showToast('<i class="fas fa-envelope"></i> Ad inquiry sent! A specialist will email you shortly.', 'success');
    e.target.reset();
};

window.handlePublishSubmit = (e) => {
    e.preventDefault();
    if (!localStorage.getItem('desideal_token')) {
        UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to set up your Author Account.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }
    UIManager.showToast('<i class="fas fa-book"></i> Author account setup initiated! Check your dashboard.', 'success');
    e.target.reset();
};

// New Implementations for Financial Pages
window.handleBusinessCardApply = (e) => {
    e.preventDefault(); 
    if (!localStorage.getItem('desideal_token')) return UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to apply.', 'error');
    UIManager.showToast('<i class="fas fa-check-circle"></i> Application securely submitted for review!', 'success'); 
    e.target.reset();
};

window.handleLinkCard = () => {
    if (!localStorage.getItem('desideal_token')) return UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to link accounts.', 'error');
    UIManager.showToast('<i class="fas fa-university"></i> Bank account securely linked for reward points!', 'success');
};

window.handleReloadBalance = (e) => {
    e.preventDefault(); 
    if (!localStorage.getItem('desideal_token')) return UIManager.showToast('<i class="fas fa-lock"></i> Please sign in to reload wallet.', 'error');
    const amt = document.getElementById('reload-amt').value;
    UIManager.showToast(`<i class="fas fa-wallet"></i> ₹${amt} securely added to DesiDeal Pay!`, 'success');
    document.getElementById('wallet-balance').innerText = `₹${amt}.00`;
    e.target.reset();
};

window.convertCurrency = () => {
    const amount = parseFloat(document.getElementById('conv-amount').value);
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    
    if(isNaN(amount)) return UIManager.showToast('Please enter a valid numeric amount.', 'error');
    
    // Baseline conversion rates against INR for the demo ecosystem
    const rates = { 'INR': 1, 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0095, 'AED': 0.044 };
    
    const inrValue = amount / rates[from];
    const finalValue = inrValue * rates[to];
    
    const resultBox = document.getElementById('conv-result');
    resultBox.style.display = 'block';
    resultBox.innerHTML = `${amount} ${from} = <strong>${finalValue.toFixed(2)} ${to}</strong>`;
    
    document.getElementById('conv-disabled').value = `${finalValue.toFixed(2)} ${to}`;
};
