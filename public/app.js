// ===== PRODUCT DATA (loaded from Supabase via API) =====
let PRODUCTS = [];

// Load products from Supabase API — falls back to hardcoded if API unavailable
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    // Map Supabase fields to storefront field names
    PRODUCTS = data.map(p => ({
      id: p.id,
      name: p.title,
      price: parseFloat(p.price),
      category: p.category,
      badge: p.badge || '',
      image: p.image_url || '',
      gallery: p.gallery_images || [],
      desc: p.description || '',
      longDesc: p.long_description || p.description || '',
      features: p.features || [],
      reviews: []
    }));
    console.log(`✅ Loaded ${PRODUCTS.length} products from Supabase`);
  } catch (err) {
    console.warn('⚠️ Could not load from API, using fallback data:', err.message);
    // Minimal fallback so the site doesn't break
    PRODUCTS = [];
  }
  // Re-render once products are loaded
  renderCurrentPage();
}


// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('tw_cart') || '[]');

function saveCart() {
  localStorage.setItem('tw_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  }
}

// ===== AUTH STATE (Firebase Connected) =====
window.currentUser = JSON.parse(localStorage.getItem('tw_user') || 'null');

function updateUserUI() {
  const userCta = document.getElementById('user-cta');
  if (!userCta) return;

  const user = window.currentUser;

  if (user) {
    userCta.innerHTML = `
      <div class="user-profile-menu">
        <a href="#/settings" class="user-name">Hey, ${user.name.split(' ')[0]}!</a>
        <button onclick="logout()" class="btn-logout">Logout</button>
      </div>`;
  } else {
    userCta.innerHTML = `
      <a href="#/login" class="nav-icon-link" title="Sign In">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </a>`;
  }
}

function logout() {
  if (window.supabase) {
    window.supabase.auth.signOut().then(() => {
      window.currentUser = null;
      localStorage.removeItem('tw_user');
      updateUserUI();
      showToast('Logged out securely');
      window.location.hash = '#/';
    });
  } else {
    window.currentUser = null;
    localStorage.removeItem('tw_user');
    updateUserUI();
    window.location.hash = '#/';
  }
}
window.updateUserUI = updateUserUI;
window.logout = logout;

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, qty: 1 });
  }
  saveCart();
  showToast(`${product.name} added to cart!`);
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
  renderCurrentPage();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  renderCurrentPage();
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

// ===== TOAST =====
function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.innerHTML = `<span class="toast-icon">✓</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(80px) scale(0.95)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// ===== ROUTER =====
function getRoute() {
  return window.location.hash.slice(1) || '/';
}

function renderCurrentPage() {
  const route = getRoute();
  const app = document.getElementById('app');

  // Update active nav
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (route === '/') document.getElementById('nav-home')?.classList.add('active');
  else if (route === '/products') document.getElementById('nav-products')?.classList.add('active');
  else if (route === '/cart') document.getElementById('nav-cart')?.classList.add('active');

  if (route === '/') app.innerHTML = renderHome();
  else if (route.startsWith('/products')) {
    const category = route.split('/')[2];
    app.innerHTML = renderProducts(category || 'All');
  }
  else if (route.startsWith('/product/')) {
    const productId = route.split('/')[2];
    app.innerHTML = renderProductDetail(productId);
  }
  else if (route === '/cart') app.innerHTML = renderCart();
  else if (route === '/checkout') app.innerHTML = renderCheckout();
  else if (route === '/contact') app.innerHTML = renderContact();
  else if (route === '/shipping') app.innerHTML = renderShipping();
  else if (route === '/returns') app.innerHTML = renderReturns();
  else if (route === '/faq') app.innerHTML = renderFAQ();
  else if (route === '/blog') app.innerHTML = renderBlog();
  else if (route === '/login') app.innerHTML = renderLogin();
  else if (route === '/settings') app.innerHTML = renderSettings();
  else app.innerHTML = renderHome();

  updateUserUI();

  attachEventListeners();
  initScrollReveal();
  initCardGlow();

  // Custom: Trigger review load if on product page
  if (route.startsWith('/product/')) {
    const productId = route.split('/')[2];
    setTimeout(() => loadLiveReviews(productId), 100);
  }

  if (route === '/' || route === '') {
    setTimeout(initSpline, 150);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', renderCurrentPage);

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const options = { threshold: 0.1, rootMargin: '0px 0px -60px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Reveal once
      }
    });
  }, options);

  // Small timeout to ensure DOM is ready
  setTimeout(() => {
    document.querySelectorAll('.reveal, .stagger-children').forEach(el => {
      observer.observe(el);
    });
  }, 50);
}

// ===== CARD GLOW EFFECT =====
function initCardGlow() {
  document.querySelectorAll('.product-card, .feature-card').forEach(card => {
    let ticking = false;
    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty('--mouse-x', x + '%');
          card.style.setProperty('--mouse-y', y + '%');
          ticking = false;
        });
        ticking = true;
      }
    });
  });
}

// ===== PAGE RENDERERS =====

function renderHome() {
  const featured = PRODUCTS.slice(0, 4);
  return `
  <div class="page-transition">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-label"><span class="dot"></span> Premium Tech Store</div>
        <h1>
          <span class="line">Cutting-edge</span>
          <span class="line"><span class="accent">tech</span> for the</span>
          <span class="line">future</span>
        </h1>
        <p class="hero-desc">We deliver the latest cutting-edge devices and accessories. Explore our curated collection of premium technology products.</p>
        <div class="hero-actions">
          <a href="#/products" class="btn-primary">Browse Products</a>
          <a href="#/products" class="btn-secondary">View All →</a>
        </div>
      </div>
      <div class="hero-sphere-container">
        <div class="spline-container" id="spline-container">
          <div class="spline-loader" id="spline-loader">
            <div class="spline-spinner"></div>
          </div>
          <canvas id="canvas3d"></canvas>
        </div>
      </div>
      <div class="scroll-indicator">
        <span>Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- Partners -->
    <section class="partners reveal">
      <div class="partners-row">
        <span class="partner"><span class="partner-dot"></span> Samsung</span>
        <span class="partner"><span class="partner-dot"></span> Apple</span>
        <span class="partner"><span class="partner-dot"></span> Sony</span>
        <span class="partner"><span class="partner-dot"></span> NVIDIA</span>
        <span class="partner"><span class="partner-dot"></span> Intel</span>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="features-grid stagger-children reveal">
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure Payments</h3>
          <p>Every transaction is encrypted and secured with bank-level security protocols.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Fast Shipping</h3>
          <p>Free express delivery on all orders. Get your gear in 1-3 business days.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <h3>2-Year Warranty</h3>
          <p>All products come with an extended 2-year manufacturer warranty included.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3>Easy Returns</h3>
          <p>30-day hassle-free returns. No questions asked on any product.</p>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="featured-products">
      <div class="section-header reveal">
        <h2>Featured Products</h2>
        <p>Handpicked cutting-edge tech for you</p>
      </div>
      <div class="products-grid stagger-children reveal">
        ${featured.map(p => productCard(p)).join('')}
      </div>
      <div class="reveal" style="text-align:center;margin-top:2.5rem;">
        <a href="#/products" class="btn-primary">View All Products →</a>
      </div>
    </section>
  </div>`;
}

function renderProducts(filter = 'All') {
  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  const filtered = filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  return `
  <div class="page-transition products-page">
    <div class="section-header" style="text-align:left;margin-bottom:2rem;">
      <h2>All Products</h2>
      <p style="margin:0;">Browse our complete collection</p>
    </div>
    <div class="products-filter">
      ${categories.map(c => `<button class="filter-btn${c === filter ? ' active' : ''}" data-filter="${c}">${c}</button>`).join('')}
    </div>
    <div class="products-grid stagger-children reveal">
      ${filtered.map(p => productCard(p)).join('')}
    </div>
  </div>`;
}

function productCard(p) {
  return `
  <div class="product-card reveal" onclick="if(!event.target.classList.contains('btn-add-cart')) window.location.hash = '#/product/${p.id}'">
    <div class="product-image">
      <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <div class="product-card-overlay">
        <span class="btn-view-detail">View Details</span>
      </div>
    </div>
    <div class="product-info">
      <span class="product-category">${p.category}</span>
      <h3 class="product-name"><a href="#/product/${p.id}" onclick="event.preventDefault();">${p.name}</a></h3>
      <p class="product-desc">${p.desc}</p>
      <div class="product-footer">
        <span class="product-price">$${p.price.toFixed(2)}</span>
        <button class="btn-add-cart" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  </div>`;
}

function renderCart() {
  if (cart.length === 0) {
    return `
    <div class="page-transition cart-page">
      <div class="section-header" style="text-align:left;margin-bottom:2rem;">
        <h2>Your Cart</h2>
      </div>
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any products yet.</p>
        <a href="#/products" class="btn-primary">Start Shopping</a>
      </div>
    </div>`;
  }

  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return `
  <div class="page-transition cart-page">
    <div class="section-header" style="text-align:left;margin-bottom:2rem;">
      <h2>Your Cart</h2>
      <p style="margin:0;">${cart.reduce((s, i) => s + i.qty, 0)} item(s)</p>
    </div>
    <div class="cart-items">
      ${cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return '';
    return `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
          </div>
          <div class="cart-item-details">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-category">${p.category}</div>
          </div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="qty-btn" data-id="${p.id}" data-delta="-1">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" data-id="${p.id}" data-delta="1">+</button>
            </div>
            <span class="cart-item-price">$${(p.price * item.qty).toFixed(2)}</span>
            <button class="btn-remove" data-id="${p.id}" title="Remove">✕</button>
          </div>
        </div>`;
  }).join('')}
    </div>
    <div class="cart-summary">
      <h3>Order Summary</h3>
      <div class="summary-row muted"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="summary-row muted"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
      <div class="summary-row muted"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
      <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      <button class="btn-checkout" id="btn-go-checkout">Proceed to Checkout</button>
    </div>
  </div>`;
}

function renderCheckout() {
  if (cart.length === 0) {
    window.location.hash = '#/cart';
    return '';
  }

  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return `
  <div class="page-transition checkout-page">
    <div class="section-header" style="text-align:left;margin-bottom:2rem;">
      <h2>Checkout</h2>
      <p style="margin:0;">Complete your order</p>
    </div>
    <div class="checkout-grid">
      <form class="checkout-form" id="checkout-form">
        <!-- Contact -->
        <div class="form-section">
          <h3><span class="step-num">1</span> Contact Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="first-name">First Name</label>
              <input type="text" id="first-name" placeholder="John" required>
            </div>
            <div class="form-group">
              <label for="last-name">Last Name</label>
              <input type="text" id="last-name" placeholder="Doe" required>
            </div>
            <div class="form-group full-width">
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="john@example.com" required>
            </div>
            <div class="form-group full-width">
              <label for="phone">Phone</label>
              <input type="tel" id="phone" placeholder="+1 (555) 123-4567">
            </div>
          </div>
        </div>

        <!-- Shipping -->
        <div class="form-section">
          <h3><span class="step-num">2</span> Shipping Address</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="address">Address</label>
              <input type="text" id="address" placeholder="123 Tech Street" required>
            </div>
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" id="city" placeholder="San Francisco" required>
            </div>
            <div class="form-group">
              <label for="state">State</label>
              <input type="text" id="state" placeholder="CA" required>
            </div>
            <div class="form-group">
              <label for="zip">ZIP Code</label>
              <input type="text" id="zip" placeholder="94102" required>
            </div>
            <div class="form-group">
              <label for="country">Country</label>
              <select id="country">
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>Australia</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Payment -->
        <div class="form-section">
          <h3><span class="step-num">3</span> Payment (Demo)</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="card-number">Card Number</label>
              <input type="text" id="card-number" placeholder="4242 4242 4242 4242" maxlength="19">
            </div>
            <div class="form-group">
              <label for="expiry">Expiry Date</label>
              <input type="text" id="expiry" placeholder="MM/YY" maxlength="5">
            </div>
            <div class="form-group">
              <label for="cvv">CVV</label>
              <input type="text" id="cvv" placeholder="123" maxlength="4">
            </div>
          </div>
        </div>

        <button type="submit" class="btn-place-order">🔒 Place Order — $${total.toFixed(2)}</button>
      </form>

      <!-- Order Summary Sidebar -->
      <div class="order-summary-sidebar">
        <div class="cart-summary">
          <h3>Order Summary</h3>
          ${cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return '';
    return `
            <div class="summary-row muted">
              <span>${p.name} × ${item.qty}</span>
              <span>$${(p.price * item.qty).toFixed(2)}</span>
            </div>`;
  }).join('')}
          <div class="summary-row muted" style="margin-top:1rem;"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="summary-row muted"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
          <div class="summary-row muted"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
          <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ===== EVENT LISTENERS =====
function attachEventListeners() {
  // Add to Cart buttons
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      addToCart(id);
      // Button animation
      const original = e.target.textContent;
      e.target.textContent = '✓ Added!';
      e.target.style.background = 'var(--success)';
      e.target.style.transform = 'scale(1.05)';
      setTimeout(() => {
        e.target.textContent = original;
        e.target.style.background = '';
        e.target.style.transform = '';
      }, 1200);
    });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      document.getElementById('app').innerHTML = renderProducts(filter);
      attachEventListeners();
      initScrollReveal();
      initCardGlow();
    });
  });

  // Quantity buttons
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const delta = parseInt(e.target.dataset.delta);
      updateQty(id, delta);
    });
  });

  // Remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      removeFromCart(id);
    });
  });

  // Checkout button
  const btnCheckout = document.getElementById('btn-go-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      window.location.hash = '#/checkout';
    });
  }

  // Checkout form
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCheckout();
    });
  }
  initButtonGlow();
}

function handleCheckout() {
  const orderId = 'TW-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  // Show success modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'success-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="success-icon">✓</div>
      <h2>Order Placed!</h2>
      <p>Thank you for your purchase! This is a demo checkout — no real charges have been made.</p>
      <div class="order-id">Order: ${orderId}</div>
      <br>
      <button class="btn-primary" id="btn-close-modal">Continue Shopping</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Clear cart
  cart = [];
  saveCart();

  // Close modal handler
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      modal.remove();
      window.location.hash = '#/';
    }, 300);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        modal.remove();
        window.location.hash = '#/';
      }, 300);
    }
  });
}

// ===== HEADER SCROLL =====
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  const currentScroll = window.scrollY;
  header.classList.toggle('scrolled', currentScroll > 50);
  lastScroll = currentScroll;
});

// ===== HAMBURGER =====
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});
// Close mobile menu on nav click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('nav-links').classList.remove('open');
  });
});

// ===== BUTTON GLOW EFFECT =====
function initButtonGlow() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta, .filter-btn, .btn-add, .btn-remove, .btn-place-order');
  buttons.forEach(btn => {
    let ticking = false;
    btn.addEventListener('mousemove', e => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          btn.style.setProperty('--mx', `${x}px`);
          btn.style.setProperty('--my', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });
  });
}

// ===== SMOOTH CURSOR GLOW ON NAV =====
let navTicking = false;
document.querySelector('header').addEventListener('mousemove', (e) => {
  if (!navTicking) {
    window.requestAnimationFrame(() => {
      const header = document.querySelector('header');
      const rect = header.getBoundingClientRect();
      const x = e.clientX - rect.left;
      header.style.background = `radial-gradient(600px circle at ${x}px 36px, rgba(59, 130, 246, 0.04), transparent 40%), rgba(6, 8, 16, ${window.scrollY > 50 ? '0.95' : '0.7'})`;
      navTicking = false;
    });
    navTicking = true;
  }
});



// ===== SPLINE 3D =====
let splineApp = null;

function initSpline() {
  const canvas = document.getElementById('canvas3d');
  const loader = document.getElementById('spline-loader');
  if (!canvas || canvas.classList.contains('loaded')) return;

  // Block scroll wheel zoom in Spline but allow the page to scroll normally
  canvas.addEventListener('wheel', (e) => {
    e.stopImmediatePropagation(); // Stops Spline from seeing the event
  }, { capture: true, passive: true }); // passive: true allows the page to scroll


  import('https://esm.sh/@splinetool/runtime@1.9.5')
    .then(({ Application }) => {
      splineApp = new Application(canvas);
      return splineApp.load('https://prod.spline.design/pJ4uHb69Owd17qHv/scene.splinecode');
    })
    .then(() => {
      console.log('✅ Spline 3D scene loaded!');
      if (loader) loader.classList.add('hidden');
      canvas.classList.add('loaded');

      // OPTIMIZATION: Hide canvas when out of view to save GPU / avoid lag
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (splineApp) {
              if (entry.isIntersecting) {
                canvas.style.visibility = 'visible';
                if (typeof splineApp.play === 'function') splineApp.play();
              } else {
                canvas.style.visibility = 'hidden';
                if (typeof splineApp.stop === 'function') splineApp.stop();
              }
            }
          });
        }, { rootMargin: '150px' });
        observer.observe(heroSection);
      }
    })
    .catch(err => {
      console.warn('Spline load issue:', err);
      if (loader) {
        loader.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem;">Loading 3D...</p>';
      }
    });
}

// ===== PRODUCT DETAIL =====
function renderProductDetail(id) {
  const p = PRODUCTS.find(prod => prod.id === id);
  if (!p) return renderHome();

  return `
  <div class="page-transition product-detail-page">
    <div class="detail-container reveal" style="padding: 10rem 2rem 4rem;">
      <div class="detail-top" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
        <a href="#/products" class="back-btn" style="color: var(--accent-light); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem; transition: transform 0.3s; font-size: 1.1rem;">
          <span style="font-size: 1.4rem;">←</span> Back to Products
        </a>
        <a href="#/" class="close-btn-detail" style="font-size: 1.5rem; color: var(--text-muted); text-decoration: none; transition: color 0.3s;">✕</a>
      </div>
      
      <div class="detail-grid">
        <!-- Image Gallery -->
        <div class="detail-gallery stagger-children">
          <div class="main-image">
            <img src="${p.image}" id="gallery-main" alt="${p.name}">
          </div>
          ${p.gallery && p.gallery.length > 1 ? `
          <div class="gallery-thumbs">
            ${p.gallery.map((img, i) => `
              <div class="thumb ${i === 0 ? 'active' : ''}" onclick="document.getElementById('gallery-main').src='${img}'; document.querySelectorAll('.thumb').forEach(t=>t.style.borderColor='var(--border)'); this.style.borderColor='var(--accent-light)'">
                <img src="${img}" alt="Preview">
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

        <!-- Product Specs -->
        <div class="detail-info stagger-children">
          <span class="detail-category">${p.category}</span>
          <h1 class="detail-title">${p.name}</h1>
          <div class="detail-price">$${p.price.toFixed(2)}</div>
          
          <div class="detail-description">
            <p>${p.longDesc || p.desc}</p>
          </div>

          ${p.features ? `
          <div class="detail-features">
            <h3>Core Technologies</h3>
            <ul>
              ${p.features.map(f => `<li><span class="feat-dot"></span> ${f}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="detail-actions">
            <button class="btn-primary btn-add-cart" data-id="${p.id}" style="width:100%; padding: 1.2rem; font-size: 1.1rem; border-radius: var(--radius-md);">Add to Shopping Vault</button>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <section class="reviews-section reveal">
        <h2 class="section-title">Client Experience</h2>
        
        <!-- Add Review Form (Only for logged in users) -->
        <div id="review-form-container" style="max-width: 600px; margin: 0 auto 4rem;">
          ${window.currentUser ? `
            <div class="review-compose-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem;">
              <h3 style="color: #fff; margin-bottom: 1.5rem; font-size: 1.1rem;">Submit Your Testimonial</h3>
              <form onsubmit="event.preventDefault(); submitUserReview(${p.id}, this);">
                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem;">Rating Performance</label>
                  <div class="star-rating-input" style="display: flex; gap: 0.5rem; font-size: 1.5rem; color: #444; cursor: pointer;">
                    ${[1, 2, 3, 4, 5].map(num => `<span class="star-node" data-value="${num}" onclick="selectStarRating(this, ${num})">☆</span>`).join('')}
                    <input type="hidden" name="rating" id="review-rating-value" value="5">
                  </div>
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <textarea name="comment" placeholder="Share your experience with this elite hardware..." required style="width: 100%; min-height: 100px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; color: #fff; font-size: 0.95rem; resize: vertical;"></textarea>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;" id="btn-submit-review">Publish Testimonial →</button>
              </form>
            </div>
          ` : `
            <div style="text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: var(--radius-lg);">
              <p style="color: var(--text-muted);">Please <a href="#/login" style="color: var(--accent-light);">Sign In</a> to share your experience with the community.</p>
            </div>
          `}
        </div>

        <div class="reviews-grid stagger-children reveal" id="live-reviews-container">
           <p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Synchronizing community testimonials...</p>
        </div>
      </section>
    </div>
  </div>`;
}

// Global scope helpers for dynamic review system
window.selectStarRating = (el, val) => {
  const container = el.parentElement;
  const stars = container.querySelectorAll('.star-node');
  const input = document.getElementById('review-rating-value');
  input.value = val;
  stars.forEach((s, idx) => {
    if (idx < val) {
      s.textContent = '★';
      s.style.color = '#f59e0b';
    } else {
      s.textContent = '☆';
      s.style.color = '#444';
    }
  });
};

window.submitUserReview = async (productId, form) => {
  const btn = document.getElementById('btn-submit-review');
  const rating = parseInt(form.rating.value);
  const comment = form.comment.value;

  try {
    btn.disabled = true;
    btn.textContent = 'Publishing to Cloud...';
    await window.fbAddReview(productId, { rating, comment });
    showToast('✨ Testimonial successfully archived in the community vault.');
    form.reset();
    loadLiveReviews(productId);
  } catch (err) {
    showToast('Cloud Sync Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Testimonial →';
  }
};

window.loadLiveReviews = async (productId) => {
  const container = document.getElementById('live-reviews-container');
  if (!container) return;

  try {
    const liveReviews = await window.fbGetReviews(productId);
    // Merge with static demo reviews for high-fidelity look
    const product = PRODUCTS.find(p => p.id === productId);
    const allReviews = [...liveReviews, ...(product.reviews || [])];

    if (allReviews.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); text-align: center; width: 100%;">Be the first to share your experience with this elite hardware.</p>';
      return;
    }

    container.innerHTML = allReviews.map(r => `
      <div class="review-card" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; backdrop-filter: blur(5px);">
        <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
          <span class="review-author" style="font-weight: 600; color: #fff;">${r.author}</span>
          <div class="review-rating" style="color: #f59e0b; font-size: 0.9rem; letter-spacing: 2px;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
        </div>
        <p class="review-comment" style="color: var(--text-secondary); line-height: 1.6; font-style: italic; font-size: 1rem;">"${r.comment}"</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to sync reviews:', err);
  }
};

// ===== INFO PAGES =====
function renderInfoPage(title, items) {
  return `
    <div class="page-transition info-page" style="padding: 6rem 2rem; max-width: 900px; margin: 0 auto; min-height: 70vh;">
      <div class="reveal">
        <h2 style="font-size: 3rem; margin-bottom: 3rem; font-family: var(--font-heading); color: var(--text-primary); text-align: center;">${title}</h2>
      </div>
      <div class="stagger-children reveal">
        ${items.map(item => `
          <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2.5rem; margin-bottom: 2rem; backdrop-filter: blur(20px); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);">
            <h3 style="color: var(--accent-light); margin-bottom: 1rem; font-size: 1.4rem; font-family: var(--font-heading);">${item.heading}</h3>
            <p style="color: var(--text-secondary); line-height: 1.8; font-size: 1.05rem;">${item.content}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderContact() {
  return renderInfoPage('Contact Us', [
    { heading: '24/7 Digital Support', content: 'Our global support team is available around the clock. For immediate technical assistance, please email support@techworld.com. We average a 4-minute response time for all priority inquiries.' },
    { heading: 'Global Headquarters', content: '100 Innovation Way, San Francisco, CA 94105, USA. Our flagship campus is where our engineering team builds the future of hardware.' },
    { heading: 'Live Chat', content: 'Accessible directly through your customer dashboard once you are logged in. Professional technicians are ready to walk you through any setup or troubleshooting.' }
  ]);
}

function renderShipping() {
  return renderInfoPage('Shipping Information', [
    { heading: 'Express Global Freight', content: 'We partner with the world\'s fastest logistics networks to ensure your gear arrives safe and fast. All orders over $500 receive complimentary overnight shipping.' },
    { heading: 'Real-time Tracking', content: 'Once your order leaves our facility, you will receive a neural-link tracking ID via email to monitor your package down to the meter.' },
    { heading: 'Safe-Arrival Guarantee', content: 'Every shipment is vacuum-sealed in anti-static, shock-proof packaging. If your device is damaged during transit, we provide a next-day replacement.' }
  ]);
}

function renderReturns() {
  return renderInfoPage('Returns & Replacements', [
    { heading: '30-Day Evaluation', content: 'Try any of our products for 30 days. If it doesn\'t perfectly fit your workflow, return it for a full refund—no questions asked.' },
    { heading: 'Zero-Cost Returns', content: 'We provide pre-paid digital shipping labels for all returns. Simply drop your package at any authorized hub, and we handle the rest.' },
    { heading: 'Rapid Processing', content: 'Once your return is scanned by the carrier, your refund is initiated immediately. Funds typically appear in your account within 2-4 hours.' }
  ]);
}

function renderFAQ() {
  return renderInfoPage('Frequently Asked Questions', [
    { heading: 'Are your devices compatible?', content: 'Yes, all Tech World hardware is designed to work seamlessly with major OS ecosystems including Windows, macOS, and Linux out of the box.' },
    { heading: 'What happens to my data?', content: 'Security is at our core. Our devices use local encryption chips; your personal data never leaves the hardware unless you explicitly authorize it.' },
    { heading: 'Do you ship to my country?', content: 'We ship to over 140 countries worldwide. If you can see our website, we can likely deliver to your doorstep.' }
  ]);
}

function renderAbout() {
  return renderInfoPage('About Tech World', [
    { heading: 'The Future of Hardware', content: 'Tech World was founded with one goal: to build the hardware that we wanted to use ourselves. We focus on performance, durability, and minimalist design.' },
    { heading: 'Our Community', content: 'Over 2 million creators and engineers trust Tech World for their daily high-stakes work. Your feedback drives our product roadmap.' }
  ]);
}

function renderCareers() {
  return renderInfoPage('Join Tech World', [
    { heading: 'Build the Future', content: 'We are looking for obsessive designers and world-class engineers. If you want to work on projects that define the next decade of technology, you belong here.' },
    { heading: 'Remote-First Culture', content: 'Our team is spread across 42 countries. We trust our people to do their best work wherever they feel most inspired and productive.' },
    { heading: 'Benefits Package', content: 'Beyond competitive salaries, we offer full health coverage, equity in the company, and an annual $10,000 stipend for your own home-office hardware.' }
  ]);
}

function renderPress() {
  return renderInfoPage('Press & Media', [
    { heading: 'Brand Assets', content: 'Download high-resolution product photography, logo kits, and brand guidelines for your editorial coverage of Tech World innovations.' },
    { heading: 'Media Inquiries', content: 'For interview requests or review unit applications, please reach out to press@techworld.com with your credentials.' },
    { heading: 'Recent News', content: 'Tech World secures "Innovation of the Year" award for the Quantum Pro line, setting a new benchmark for mobile workstation performance.' }
  ]);
}

function renderBlog() {
  return renderInfoPage('Tech Insights Blog', [
    { heading: 'The Path to 2nm Chips', content: 'An exploration into the manufacturing challenges and performance leaps coming in next year\'s processor lineup.' },
    { heading: 'Audio Purity in 2026', content: 'How we achieved near-perfect spatial transparency in our latest AeroSound headphones using custom-tuned acoustic chambers.' },
    { heading: 'The Home Office Evolution', content: 'Predictions on how hardware will adapt as the line between professional workstations and home environments continues to blur.' }
  ]);
}

// ===== AUTH PAGES (Supabase Email/Password) =====
let currentAuthMode = 'signin';
let pendingAuthEmail = '';

function renderLogin() {
  return `
    <div class="page-transition auth-page" style="display: flex; align-items: center; justify-content: center; min-height: 80vh;">
      <div class="auth-container reveal">
        <div class="auth-tabs">
            <button onclick="setAuthMode('signin')" class="auth-tab ${currentAuthMode === 'signin' ? 'active' : ''}">Sign In</button>
            <button onclick="setAuthMode('signup')" class="auth-tab ${currentAuthMode === 'signup' ? 'active' : ''}">New Account</button>
        </div>
        
        <div class="auth-content-slide">
            ${currentAuthMode === 'verify' ? `
              <h2 class="auth-title">Verify Email</h2>
              <p class="auth-subtitle">Enter the 6-digit PIN sent to ${pendingAuthEmail}</p>
              
              <form class="auth-form" onsubmit="event.preventDefault(); handleVerifyOtp(this);">
                <div class="input-group">
                  <label>Secure PIN</label>
                  <div class="input-wrapper-glow">
                    <input type="text" id="verify-code" placeholder="123456" required autofocus autocomplete="one-time-code" maxlength="6" pattern="[0-9]*">
                  </div>
                </div>
                <button type="submit" class="btn-primary auth-submit" id="submit-verify">Verify Identity →</button>
              </form>
            ` : `
            <h2 class="auth-title">${currentAuthMode === 'signup' ? 'Claim Your Identity' : 'Member Portal'}</h2>
            <p class="auth-subtitle">${currentAuthMode === 'signup' ? 'Create a unique persona in the tech world.' : 'Resume your elite hardware journey.'}</p>
            
            <form class="auth-form" onsubmit="event.preventDefault(); handleAuthSubmit(this);">
              ${currentAuthMode === 'signup' ? `
              <div class="input-group">
                <label>Display Name</label>
                <div class="input-wrapper-glow">
                  <input type="text" name="username" id="login-username" placeholder="TechEnthusiast" required>
                </div>
              </div>
              ` : ''}
              <div class="input-group">
                <label>Secure Email</label>
                <div class="input-wrapper-glow">
                  <input type="email" name="email" id="login-email" placeholder="name@email.com" required autofocus>
                </div>
              </div>
              <div class="input-group">
                <label>Password</label>
                <div class="input-wrapper-glow">
                  <input type="password" name="password" id="login-password" placeholder="••••••••" required minlength="6">
                </div>
              </div>
            </form>
            `}
      </div>
    </div>
  `;
}

window.setAuthMode = (mode) => {
  if (currentAuthMode === mode) return;
  const container = document.querySelector('.auth-container');
  if (container) container.style.opacity = '0';
  setTimeout(() => {
    currentAuthMode = mode;
    renderCurrentPage();
  }, 200);
};

window.handleAuthSubmit = async (form) => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const username = document.getElementById('login-username')?.value;
  const btn = document.getElementById('submit-auth');

  try {
    btn.disabled = true;
    btn.textContent = 'Authenticating...';

    if (currentAuthMode === 'signup') {
      const { data, error } = await window.supabase.auth.signUp({
        email,
        password,
        options: { data: { name: username } }
      });
      if (error) throw error;

      if (data?.session) {
        showToast('✨ Account created !');
        setTimeout(() => { window.location.hash = '#/'; }, 1000);
      } else {
        showToast('Verification code dispatched to your email.');
        pendingAuthEmail = email;
        setAuthMode('verify');
        return; // Don't redirect
      }
    } else {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      showToast('Welcome back to the elite tier!');
      setTimeout(() => { window.location.hash = '#/'; }, 800);
    }
  } catch (err) {
    showToast('Auth Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = currentAuthMode === 'signup' ? 'Create Account →' : 'Sign In →';
  }
};

window.handleVerifyOtp = async (form) => {
  const code = document.getElementById('verify-code').value.trim();
  const btn = document.getElementById('submit-verify');

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    const { data, error } = await window.supabase.auth.verifyOtp({
      email: pendingAuthEmail.trim(),
      token: code,
      type: 'signup'
    });

    if (error) throw error;

    showToast('✨ Identity verified! Welcome.');
    setTimeout(() => { window.location.hash = '#/'; }, 800);
  } catch (err) {
    showToast('Verification Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Verify Identity →';
  }
};


// ===== SETTINGS PAGE =====
function renderSettings() {
  const user = window.currentUser;
  if (!user) {
    window.location.hash = '#/login';
    return '';
  }

  return `
    <div class="page-transition settings-page" style="display: flex; align-items: center; justify-content: center; min-height: 80vh;">
      <div class="auth-container reveal">
        <h2 class="auth-title">Profile Settings</h2>
        <p class="auth-subtitle">Manage your Tech World identity</p>
        
        <form class="auth-form" onsubmit="event.preventDefault(); handleUpdateProfile(this);">
          <div class="input-group">
            <label>Current Email</label>
            <input type="text" value="${user.email}" disabled style="opacity: 0.6; cursor: not-allowed;">
          </div>
          <div class="input-group" style="margin-top: 2rem;">
            <label>Display Name</label>
            <input type="text" id="new-username" placeholder="${user.name}" required>
          </div>
          <button type="submit" class="btn-primary auth-submit" id="update-btn">Save Identity Changes →</button>
        </form>
        
        <p class="auth-footer"><a href="#/">← Back to Storefront</a></p>
      </div>
    </div>
  `;
}

window.handleUpdateProfile = async (form) => {
  const name = document.getElementById('new-username').value;
  const btn = document.getElementById('update-btn');

  try {
    btn.disabled = true;
    btn.textContent = 'Syncing Profile...';

    const { error } = await window.supabase.auth.updateUser({
      data: { name }
    });

    if (error) throw error;

    // Auto-login listener will update window.currentUser and local storage
    showToast('✨ Identity successfully updated.');
    window.location.hash = '#/';
  } catch (err) {
    showToast('Update failed: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Save Identity Changes →';
  }
};

// Global scope handlers
window.logout = logout;


updateCartBadge();
renderCurrentPage(); // Initial render with empty products (shows loading state)
loadProducts();      // Fetch from Supabase, then re-renders automatically
