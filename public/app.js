const PAYMENT_OPTIONS = [
  'Visa ending 4242',
  'Mastercard ending 5555',
  'PayPal',
  'Apple Pay',
  'Corporate invoice (Net 30)'
];

const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('apexcart.cart') || '[]'),
  user: JSON.parse(localStorage.getItem('apexcart.user') || 'null'),
  token: localStorage.getItem('apexcart.token') || '',
  wishlist: [],
  profile: null,
  category: 'all',
  query: '',
  currentProduct: null,
  pendingRating: 5,
  historyStack: [location.hash || '#/'],
  historyIndex: 0
};

const $ = (id) => document.getElementById(id);

function money(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function stars(n) {
  const filled = Math.round(Number(n) || 0);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function saveSession() {
  localStorage.setItem('apexcart.cart', JSON.stringify(state.cart));
  if (state.token) localStorage.setItem('apexcart.token', state.token);
  else localStorage.removeItem('apexcart.token');
  if (state.user) localStorage.setItem('apexcart.user', JSON.stringify(state.user));
  else localStorage.removeItem('apexcart.user');
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2200);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + item.quantity * item.price_usd, 0);
}

function wished(id) {
  return state.wishlist.some((item) => item.id === id);
}

function formatAddress(profile) {
  if (!profile) return '';
  return [profile.address_line, profile.city, profile.region, profile.postal_code, profile.country]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
}

function arrivalDate(days) {
  const date = new Date();
  let left = Number(days) || 4;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fillPaymentSelect(id, selected) {
  const el = $(id);
  if (!el) return;
  const options = (state.profile && state.profile.payment_options) || PAYMENT_OPTIONS;
  el.innerHTML = `<option value="">Select payment method</option>` + options.map((opt) => `
    <option value="${escapeHtml(opt)}" ${opt === selected ? 'selected' : ''}>${escapeHtml(opt)}</option>
  `).join('');
}

function fillAddressFields(prefix, profile) {
  const p = profile || {};
  $(`${prefix}Line`).value = p.address_line || '';
  $(`${prefix}City`).value = p.city || '';
  $(`${prefix}Region`).value = p.region || '';
  $(`${prefix}Postal`).value = p.postal_code || '';
  $(`${prefix}Country`).value = p.country || 'United States';
}

function readAddressFields(prefix) {
  return {
    address_line: $(`${prefix}Line`).value.trim(),
    city: $(`${prefix}City`).value.trim(),
    region: $(`${prefix}Region`).value.trim(),
    postal_code: $(`${prefix}Postal`).value.trim(),
    country: $(`${prefix}Country`).value.trim()
  };
}

function updateChrome() {
  $('cartCount').textContent = cartCount();
  $('wishCount').textContent = state.token ? String(state.wishlist.length) : '0';
  $('authBtn').textContent = state.user ? state.user.name.split(' ')[0] : 'Account';
  $('adminBtn').classList.toggle('hidden', !(state.user && state.user.role === 'admin'));
  $('logoutBtn').classList.toggle('hidden', !state.user);
  $('backBtn').disabled = state.historyIndex <= 0;
  $('fwdBtn').disabled = state.historyIndex >= state.historyStack.length - 1;
}

function stockLabel(product) {
  if (product.stock <= 0) return { cls: 'out', text: 'Out of stock' };
  if (product.stock <= product.safety_stock) return { cls: 'low', text: `Low stock · ${product.stock}` };
  return { cls: 'ok', text: `${product.stock} in warehouse` };
}

function hideViews() {
  ['storeView', 'productView', 'wishlistView', 'ordersView', 'adminView'].forEach((id) => $(id).classList.add('hidden'));
}

function parseRoute(hash) {
  const raw = (hash || '#/').replace(/^#/, '') || '/';
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'product' && parts[1]) return { name: 'product', id: parts[1] };
  if (parts[0] === 'wishlist') return { name: 'wishlist' };
  if (parts[0] === 'orders') return { name: 'orders' };
  if (parts[0] === 'admin') return { name: 'admin' };
  return { name: 'store' };
}

function goTo(hash, { replace = false } = {}) {
  const next = hash || '#/';
  if (replace) {
    state.historyStack[state.historyIndex] = next;
    history.replaceState({ index: state.historyIndex }, '', next);
  } else if (state.historyStack[state.historyIndex] !== next) {
    state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    state.historyStack.push(next);
    state.historyIndex += 1;
    history.pushState({ index: state.historyIndex }, '', next);
  }
  applyRoute(next);
}

function goBack() {
  if (state.historyIndex <= 0) return toast('No previous page');
  state.historyIndex -= 1;
  const hash = state.historyStack[state.historyIndex];
  history.pushState({ index: state.historyIndex }, '', hash);
  applyRoute(hash);
}

function goForward() {
  if (state.historyIndex >= state.historyStack.length - 1) return toast('No next page');
  state.historyIndex += 1;
  const hash = state.historyStack[state.historyIndex];
  history.pushState({ index: state.historyIndex }, '', hash);
  applyRoute(hash);
}

async function applyRoute(hash) {
  const route = parseRoute(hash);
  hideViews();
  if (route.name === 'product') {
    $('productView').classList.remove('hidden');
    await loadProduct(route.id);
  } else if (route.name === 'wishlist') {
    $('wishlistView').classList.remove('hidden');
    await showWishlist();
  } else if (route.name === 'orders') {
    $('ordersView').classList.remove('hidden');
    await showOrders();
  } else if (route.name === 'admin') {
    $('adminView').classList.remove('hidden');
    await showAdmin();
  } else {
    $('storeView').classList.remove('hidden');
    renderProducts();
  }
  updateChrome();
}

function productCard(p) {
  const stock = stockLabel(p);
  const count = Number(p.review_count) || 0;
  const saved = wished(p.id);
  // pick a badge
  const isNew  = p.stock > p.safety_stock * 2;
  const isSale = Number(p.rating) >= 4.5;
  const badge  = p.stock <= p.safety_stock
    ? `<span class="card-badge badge-sale">Low Stock</span>`
    : isNew
      ? `<span class="card-badge badge-new">New</span>`
      : isSale
        ? `<span class="card-badge badge-hot">⭐ Top Rated</span>`
        : '';
  // fake original price for visual interest
  const origPrice = (Number(p.price_usd) * 1.22).toFixed(2);
  return `
    <article class="card" onclick="goTo('#/product/${escapeHtml(p.id)}')">
      <div class="card-img-wrap">
        <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}">
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-cat">${escapeHtml(p.category)}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price-row">
          <span class="price">${money(p.price_usd)}</span>
          <span class="price-old">$${escapeHtml(origPrice)}</span>
        </div>
        <div class="stars small">${stars(p.rating)} <span class="muted">(${count})</span></div>
        <div class="card-actions">
          <button class="btn-primary" ${p.stock <= 0 ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${escapeHtml(p.id)}')">
            🛒 Add to Cart
          </button>
          <button class="wish-btn ${saved ? 'on' : ''}" title="${saved ? 'Remove from wishlist' : 'Save'}"
            onclick="event.stopPropagation(); toggleWishlist('${escapeHtml(p.id)}')">${saved ? '♥' : '♡'}</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const q = state.query.toLowerCase();
  const list = state.products.filter((p) => {
    const catOk = state.category === 'all' || p.category === state.category;
    const qOk = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return catOk && qOk;
  });

  $('productGrid').innerHTML = list.map(productCard).join('') || '<p class="muted">No products match that search.</p>';
}

async function loadProduct(id) {
  const product = await api(`/api/products/${id}`);
  state.currentProduct = product;
  const stock = stockLabel(product);
  const count = Number(product.review_count) || 0;
  const saved = wished(product.id);
  const specs = Array.isArray(product.specifications) ? product.specifications : [];
  $('productDetail').innerHTML = `
    <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">
    <div class="product-copy">
      <div class="kicker">${escapeHtml(product.category)}</div>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="muted">${escapeHtml(product.sku)}</p>
      <p class="stars">${stars(product.rating)} ${Number(product.rating).toFixed(1)} (${count})</p>
      <p>${escapeHtml(product.description)}</p>
      <div class="row">
        <div class="price">${money(product.price_usd)}</div>
        <div class="stock ${stock.cls}">${stock.text}</div>
      </div>
      <div class="product-facts">
        <div class="fact">
          <h4>Delivery date</h4>
          <p>Arrives by <strong>${arrivalDate(product.delivery_days)}</strong> with standard enterprise freight (${product.delivery_days} business days).</p>
        </div>
        <div class="fact">
          <h4>Return &amp; exchange</h4>
          <p>${escapeHtml(product.return_policy)}</p>
        </div>
        <div class="fact">
          <h4>Warranty</h4>
          <p>${escapeHtml(product.warranty)}</p>
        </div>
        <div class="fact">
          <h4>Fulfillment</h4>
          <p>${stock.text}. Orders placed before 3pm ship the same business day.</p>
        </div>
      </div>
      <h3>Specifications</h3>
      <table class="specs">
        <tbody>
          ${specs.map((row) => `
            <tr><th>${escapeHtml(row[0])}</th><td>${escapeHtml(row[1])}</td></tr>
          `).join('') || '<tr><td colspan="2">No specifications listed.</td></tr>'}
        </tbody>
      </table>
      <div class="card-actions">
        <button class="btn-primary" ${product.stock <= 0 ? 'disabled' : ''} onclick="addToCart('${product.id}')">🛒 Add to Cart</button>
        <button class="wish-btn ${saved ? 'on' : ''}" onclick="toggleWishlist('${product.id}')">${saved ? '♥' : '♡'}</button>
      </div>
    </div>
  `;
  $('reviewSummary').textContent = count
    ? `${count} customer review${count === 1 ? '' : 's'} · average ${Number(product.rating).toFixed(1)} / 5`
    : 'No reviews yet. Be the first to rate this item.';
  renderStarPicker();
  $('reviewList').innerHTML = (product.reviews || []).map((review) => `
    <article class="review-card">
      <div class="row">
        <strong>${escapeHtml(review.author)}</strong>
        <span class="stars small">${stars(review.rating)}</span>
      </div>
      <p>${escapeHtml(review.comment)}</p>
      <div class="muted small">${new Date(review.created_at).toLocaleDateString()}</div>
    </article>
  `).join('') || '<p class="muted">No feedback posted yet.</p>';
}

function renderStarPicker() {
  $('starPicker').innerHTML = [1, 2, 3, 4, 5].map((n) => `
    <button type="button" class="${n <= state.pendingRating ? 'active' : ''}" onclick="setPendingRating(${n})">${n <= state.pendingRating ? '★' : '☆'}</button>
  `).join('');
}

function setPendingRating(n) {
  state.pendingRating = n;
  renderStarPicker();
}

function currentProductIndex() {
  if (!state.currentProduct) return 0;
  const idx = state.products.findIndex((p) => p.id === state.currentProduct.id);
  return idx < 0 ? 0 : idx;
}

function showPrevProduct() {
  if (!state.products.length) return;
  const idx = (currentProductIndex() - 1 + state.products.length) % state.products.length;
  goTo(`#/product/${state.products[idx].id}`);
}

function showNextProduct() {
  if (!state.products.length) return;
  const idx = (currentProductIndex() + 1) % state.products.length;
  goTo(`#/product/${state.products[idx].id}`);
}

async function submitReview(event) {
  event.preventDefault();
  if (!state.currentProduct) return;
  if (!state.token) {
    openAuth(true, 'login');
    return toast('Sign in to leave feedback');
  }
  try {
    await api(`/api/products/${state.currentProduct.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: state.pendingRating,
        comment: $('reviewComment').value.trim()
      })
    });
    $('reviewComment').value = '';
    toast('Thanks for the feedback');
    await loadProducts();
    await loadProduct(state.currentProduct.id);
  } catch (err) {
    toast(err.message);
  }
}

function addToCart(id) {
  const product = state.products.find((p) => p.id === id) || state.currentProduct;
  if (!product || product.stock <= 0) return;
  const existing = state.cart.find((i) => i.id === id);
  const nextQty = existing ? existing.quantity + 1 : 1;
  if (nextQty > product.stock) return toast('Not enough stock');
  if (existing) existing.quantity = nextQty;
  else state.cart.push({ id: product.id, sku: product.sku, name: product.name, price_usd: product.price_usd, quantity: 1, image_url: product.image_url });
  saveSession();
  updateChrome();
  renderCart();
  toast(`${product.name} added`);
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  const product = state.products.find((p) => p.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) state.cart = state.cart.filter((i) => i.id !== id);
  if (product && item.quantity > product.stock) item.quantity = product.stock;
  saveSession();
  updateChrome();
  renderCart();
}

function renderCart() {
  $('cartItems').innerHTML = state.cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" style="width:56px;height:56px;object-fit:cover;border-radius:8px">` : '📦'}
      </div>
      <div style="flex:1">
        <strong style="font-size:14px">${escapeHtml(item.name)}</strong>
        <div class="muted small">${escapeHtml(item.sku)} · ${money(item.price_usd)}</div>
        <div class="qty" style="margin-top:6px">
          <button onclick="changeQty('${escapeHtml(item.id)}', -1)">−</button>
          <span style="font-weight:600">${item.quantity}</span>
          <button onclick="changeQty('${escapeHtml(item.id)}', 1)">+</button>
        </div>
      </div>
      <strong style="white-space:nowrap">${money(item.quantity * item.price_usd)}</strong>
    </div>
  `).join('') || '<p class="muted" style="text-align:center;padding:32px 0">Your cart is empty.</p>';
  $('cartTotal').textContent = money(cartTotal());
  fillAddressFields('cartAddr', state.profile || state.user);
  fillPaymentSelect('cartPayMethod', (state.profile || state.user || {}).payment_method);
}

function openDrawer(open) {
  $('cartDrawer').classList.toggle('open', open);
  if (open) renderCart();
}

function openAuth(open, mode = 'login') {
  $('authModal').classList.toggle('open', open);
  $('authTitle').textContent = mode === 'register' ? 'Create account' : 'Sign in';
  $('authName').classList.toggle('hidden', mode !== 'register');
  $('authSubmit').dataset.mode = mode;
}

async function submitAuth(event) {
  event.preventDefault();
  const mode = $('authSubmit').dataset.mode || 'login';
  const payload = {
    name: $('authName').value.trim(),
    email: $('authEmail').value.trim(),
    password: $('authPassword').value
  };
  try {
    const data = await api(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    state.token = data.token;
    state.user = data.user;
    saveSession();
    await loadAccountExtras();
    updateChrome();
    openAuth(false);
    toast(`Welcome, ${data.user.name}`);
    if (parseRoute(location.hash).name === 'store') renderProducts();
  } catch (err) {
    toast(err.message);
  }
}

async function toggleWishlist(id) {
  if (!state.token) {
    openAuth(true, 'login');
    return toast('Sign in to use wishlist');
  }
  try {
    if (wished(id)) {
      await api(`/api/wishlist/${id}`, { method: 'DELETE' });
      state.wishlist = state.wishlist.filter((item) => item.id !== id);
      toast('Removed from wishlist');
    } else {
      await api('/api/wishlist', { method: 'POST', body: JSON.stringify({ product_id: id }) });
      const product = state.products.find((p) => p.id === id) || state.currentProduct;
      if (product && !wished(id)) state.wishlist.unshift(product);
      toast('Saved to wishlist');
    }
    updateChrome();
    if (parseRoute(location.hash).name === 'store') renderProducts();
    if (parseRoute(location.hash).name === 'wishlist') renderWishlistGrid();
    if (state.currentProduct && state.currentProduct.id === id && parseRoute(location.hash).name === 'product') {
      await loadProduct(id);
    }
  } catch (err) {
    toast(err.message);
  }
}

async function showWishlist() {
  if (!state.token) {
    hideViews();
    $('storeView').classList.remove('hidden');
    openAuth(true, 'login');
    toast('Sign in to view wishlist');
    return;
  }
  await loadWishlist();
  renderWishlistGrid();
}

function renderWishlistGrid() {
  $('wishlistGrid').innerHTML = state.wishlist.map(productCard).join('') || '<p class="muted">Your wishlist is empty.</p>';
}

async function loadWishlist() {
  if (!state.token) {
    state.wishlist = [];
    return;
  }
  try {
    state.wishlist = await api('/api/wishlist');
  } catch {
    state.wishlist = [];
  }
}

async function loadProfile() {
  if (!state.token) {
    state.profile = null;
    return;
  }
  try {
    state.profile = await api('/api/account');
    state.user = { ...state.user, ...state.profile };
    saveSession();
  } catch {
    state.profile = state.user;
  }
}

async function loadAccountExtras() {
  await Promise.all([loadProfile(), loadWishlist()]);
}

function paintAccountForm() {
  fillAddressFields('addr', state.profile || state.user);
  fillPaymentSelect('payMethod', (state.profile || state.user || {}).payment_method);
}

async function saveAccount(event) {
  event.preventDefault();
  if (!state.token) {
    openAuth(true, 'login');
    return toast('Sign in to save account details');
  }
  try {
    const payload = {
      ...readAddressFields('addr'),
      payment_method: $('payMethod').value
    };
    state.profile = await api('/api/account', { method: 'PUT', body: JSON.stringify(payload) });
    state.user = { ...state.user, ...state.profile };
    saveSession();
    paintAccountForm();
    renderCart();
    toast('Account details saved');
  } catch (err) {
    toast(err.message);
  }
}

async function checkout() {
  if (!state.cart.length) return toast('Cart is empty');
  if (!state.token) {
    openDrawer(false);
    openAuth(true, 'login');
    return toast('Sign in to checkout');
  }
  const addressParts = readAddressFields('cartAddr');
  const payment_method = $('cartPayMethod').value;
  const delivery_address = formatAddress(addressParts);
  if (!delivery_address) return toast('Add a delivery address');
  if (!payment_method) return toast('Choose a payment method');
  try {
    await api('/api/account', {
      method: 'PUT',
      body: JSON.stringify({ ...addressParts, payment_method })
    });
    const data = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: state.cart.map(({ sku, quantity, price_usd }) => ({ sku, quantity, price_usd })),
        total_amount: cartTotal(),
        delivery_address,
        payment_method
      })
    });
    state.cart = [];
    saveSession();
    await loadAccountExtras();
    updateChrome();
    renderCart();
    openDrawer(false);
    await loadProducts();
    toast(`Order ${data.order_id} · ${data.tracking_code}`);
    goTo('#/orders');
  } catch (err) {
    toast(err.message);
  }
}

async function showOrders() {
  if (!state.token) {
    hideViews();
    $('storeView').classList.remove('hidden');
    openAuth(true, 'login');
    toast('Sign in to view orders');
    return;
  }
  await loadProfile();
  paintAccountForm();
  const orders = await api('/api/orders');
  $('ordersBody').innerHTML = orders.map((o) => `
    <tr>
      <td>${escapeHtml(o.id)}</td>
      <td>${escapeHtml(o.status)}</td>
      <td>${money(o.total_amount)}</td>
      <td>${escapeHtml(o.delivery_address || '—')}</td>
      <td>${escapeHtml(o.payment_method || '—')}</td>
      <td>${escapeHtml(o.tracking_code || '—')}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">No orders yet.</td></tr>';
}

async function showAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    toast('Admin access required');
    goTo('#/', { replace: true });
    return;
  }
  const [products, orders] = await Promise.all([api('/api/products'), api('/api/admin/orders')]);
  state.products = products;
  const revenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const alerts = products.filter((p) => p.stock <= p.safety_stock).length;
  $('kpiRevenue').textContent = money(revenue);
  $('kpiOrders').textContent = String(orders.length);
  $('kpiAlerts').textContent = String(alerts);
  $('adminOrders').innerHTML = orders.map((o) => `
    <tr>
      <td>${escapeHtml(o.id)}</td>
      <td>${escapeHtml(o.customer_name)}<div class="muted small">${escapeHtml(o.customer_email)}</div></td>
      <td>${escapeHtml(o.delivery_address || '—')}</td>
      <td>${escapeHtml(o.payment_method || '—')}</td>
      <td>${escapeHtml(o.status)}</td>
      <td>${money(o.total_amount)}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">No transactions yet.</td></tr>';
  $('adminStock').innerHTML = products.map((p) => `
    <tr>
      <td>${escapeHtml(p.name)}<div class="muted small">${escapeHtml(p.sku)}</div></td>
      <td>${p.stock}</td>
      <td>${p.safety_stock}</td>
      <td>
        <input class="field" style="margin:0;width:90px" type="number" min="0" value="${p.stock}" id="stock-${p.id}">
        <button class="ghost" onclick="saveStock('${p.id}')">Save</button>
      </td>
    </tr>
  `).join('');
}

async function saveStock(id) {
  const stock = Number($(`stock-${id}`).value);
  try {
    await api(`/api/products/${id}/stock`, { method: 'PUT', body: JSON.stringify({ stock }) });
    toast('Inventory updated');
    await loadProducts();
    await showAdmin();
  } catch (err) {
    toast(err.message);
  }
}

function logout() {
  state.user = null;
  state.token = '';
  state.profile = null;
  state.wishlist = [];
  saveSession();
  updateChrome();
  goTo('#/');
  toast('Signed out');
}

async function loadProducts() {
  state.products = await api('/api/products');
  const cats = ['all', ...new Set(state.products.map((p) => p.category))];
  const catIcons = {
    all: '🛍️', phones: '📱', computers: '💻', accessories: '🖱️',
    laptops: '💻', audio: '🎧', networking: '📡', gaming: '🎮',
    monitors: '🖥️', keyboards: '⌨️', storage: '💾', cameras: '📷',
    printers: '🖨️', tablets: '📟', wearables: '⌚', speakers: '🔊',
    'smart-home': '🏠'
  };
  $('filters').innerHTML = cats.map((c) => `
    <button class="chip ${state.category === c ? 'active' : ''}" onclick="setCategory('${escapeHtml(c)}')">
      <span class="chip-icon">${catIcons[c.toLowerCase()] || '📦'}</span>
      <span>${escapeHtml(c === 'all' ? 'All' : c)}</span>
    </button>
  `).join('');
  // Build hero carousel with real products (only on first load)
  if ($('heroSlides') && !$('heroSlides').innerHTML.trim()) {
    buildHeroCarousel(state.products);
  }
  if (parseRoute(location.hash).name === 'store') renderProducts();
}

function setCategory(c) {
  state.category = c;
  loadProducts();
}

$('search').addEventListener('input', (e) => {
  state.query = e.target.value;
  const clearBtn = $('searchClear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !state.query);
  if (parseRoute(location.hash).name !== 'store') goTo('#/');
  else renderProducts();
});

function clearSearch() {
  state.query = '';
  $('search').value = '';
  const clearBtn = $('searchClear');
  if (clearBtn) clearBtn.classList.add('hidden');
  $('search').focus();
  if (parseRoute(location.hash).name !== 'store') goTo('#/');
  else renderProducts();
}

function scrollToProducts() {
  // If not on store view, navigate there first then scroll
  if (parseRoute(location.hash).name !== 'store') {
    goTo('#/');
    setTimeout(() => {
      const el = document.getElementById('productGrid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  } else {
    const el = document.getElementById('productGrid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.addEventListener('popstate', (event) => {
  if (typeof event.state?.index === 'number') {
    state.historyIndex = event.state.index;
  }
  applyRoute(location.hash || '#/');
});

updateChrome();
renderCart();
history.replaceState({ index: 0 }, '', location.hash || '#/');
Promise.all([loadProducts(), loadAccountExtras()])
  .then(() => applyRoute(location.hash || '#/'))
  .catch((err) => toast(err.message));

// ── Hero carousel ──
const heroState = { index: 0, total: 0, timer: null, touchStartX: 0 };

function buildHeroCarousel(products) {
  // Pick 4 featured slides: highest-rated, varied categories
  const featured = [...products]
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .reduce((acc, p) => {
      if (acc.length < 4 && !acc.find(x => x.category === p.category)) acc.push(p);
      return acc;
    }, []);
  // Fill to 4 if categories ran out
  products.forEach(p => { if (featured.length < 4 && !featured.find(x => x.id === p.id)) featured.push(p); });

  heroState.total = featured.length;
  heroState.index = 0;

  const slidesEl = $('heroSlides');
  const dotsEl   = $('heroDots');

  slidesEl.innerHTML = featured.map((p, i) => {
    const origPrice = (Number(p.price_usd) * 1.22).toFixed(2);
    const gradients = [
      'linear-gradient(135deg,#fef3f2,#fdf4ff,#eff6ff)',
      'linear-gradient(135deg,#f0fdf4,#ecfdf5,#d1fae5)',
      'linear-gradient(135deg,#fefce8,#fef9c3,#fef3c7)',
      'linear-gradient(135deg,#eff6ff,#dbeafe,#e0e7ff)',
    ];
    return `
      <div class="hero-slide" style="background:${gradients[i % gradients.length]}">
        <div class="hero-slide-copy">
          <span class="hero-kicker">⭐ New Arrival</span>
          <h1>${escapeHtml(p.name)}</h1>
          <p>${escapeHtml(p.description)}</p>
          <div class="hero-cta-row">
            <button class="btn-primary" onclick="goTo('#/product/${escapeHtml(p.id)}')">Shop Now →</button>
            <div class="social-proof">
              <div class="avatar-stack">
                <div class="avatar" style="background:#6c7cf7"></div>
                <div class="avatar" style="background:#f76ca0"></div>
                <div class="avatar" style="background:#67d8a0"></div>
              </div>
              <span><strong>1,200+</strong><br>Happy Customers</span>
            </div>
          </div>
        </div>
        <div class="hero-slide-image">
          <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}"
            onerror="this.style.display='none'">
          <div class="hero-price-badge">Only<br><strong>${money(p.price_usd)}</strong></div>
        </div>
      </div>
    `;
  }).join('');

  dotsEl.innerHTML = featured.map((_, i) =>
    `<span class="hero-dot ${i === 0 ? 'active' : ''}" onclick="heroGoTo(${i})"></span>`
  ).join('');

  heroSetSlide(0);
  heroStartTimer();
  heroAddTouch();
}

function heroSetSlide(index) {
  heroState.index = ((index % heroState.total) + heroState.total) % heroState.total;
  $('heroSlides').style.transform = `translateX(-${heroState.index * 100}%)`;
  document.querySelectorAll('.hero-dot').forEach((d, i) =>
    d.classList.toggle('active', i === heroState.index)
  );
}

function heroGoTo(index) {
  heroResetTimer();
  heroSetSlide(index);
}

function heroNav(dir) {
  heroResetTimer();
  heroSetSlide(heroState.index + dir);
}

function heroStartTimer() {
  heroState.timer = setInterval(() => heroSetSlide(heroState.index + 1), 4500);
}

function heroResetTimer() {
  clearInterval(heroState.timer);
  heroStartTimer();
}

function heroAddTouch() {
  const el = $('heroCarousel');
  if (!el) return;
  el.addEventListener('touchstart', (e) => { heroState.touchStartX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - heroState.touchStartX;
    if (Math.abs(dx) > 40) heroNav(dx < 0 ? 1 : -1);
  }, { passive: true });
}
function openPage(name) {
  document.getElementById(name + 'Modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePage(name) {
  document.getElementById(name + 'Modal').classList.remove('open');
  document.body.style.overflow = '';
}
function submitContact(event) {
  event.preventDefault();
  closePage('contact');
  toast('Message sent! We\'ll get back to you within 24 hours.');
}
