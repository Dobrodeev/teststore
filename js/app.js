/* ===== КанцМаркет — app.js ===== */

// Безопасный вызов Lucide после вставки HTML
function refreshIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---- Корзина ----
const Cart = {
  items: JSON.parse(localStorage.getItem('kanz_cart') || '[]'),

  save() { localStorage.setItem('kanz_cart', JSON.stringify(this.items)); },

  add(product) {
    const exist = this.items.find(i => i.id === product.id);
    if (exist) { exist.qty++; }
    else { this.items.push({ ...product, qty: 1 }); }
    this.save();
    this.updateUI();
    toast(`«${product.name}» добавлен в корзину`);
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save(); this.updateUI(); this.renderPanel();
  },

  setQty(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) { this.remove(id); return; }
    item.qty = qty;
    this.save(); this.updateUI(); this.renderPanel();
  },

  total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return this.items.reduce((s, i) => s + i.qty, 0); },

  updateUI() {
    const badge = document.querySelector('.cart-count');
    if (!badge) return;
    const n = this.count();
    badge.textContent = n;
    badge.style.display = n > 0 ? 'block' : 'none';
  },

  renderPanel() {
    const el = document.getElementById('cart-items');
    if (!el) return;
    if (this.items.length === 0) {
      el.innerHTML = `
        <div class="cart-empty">
          <i data-lucide="shopping-cart" class="cart-empty-icon-svg"></i>
          <p style="margin-bottom:16px;">Корзина пуста</p>
          <a href="catalog.html" class="btn btn-primary btn-sm" onclick="closeCart()">Перейти в каталог</a>
        </div>`;
    } else {
      el.innerHTML = this.items.map(item => `
        <div class="cart-item">
          <div class="cart-item-thumb" style="background:${item.color}">
            <i data-lucide="${item.icon}" class="cart-item-icon" style="color:${item.iconColor}"></i>
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${(item.price * item.qty).toLocaleString('ru')} грн</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="Cart.setQty(${item.id}, ${item.qty - 1})">
                <i data-lucide="minus"></i>
              </button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.setQty(${item.id}, ${item.qty + 1})">
                <i data-lucide="plus"></i>
              </button>
            </div>
          </div>
          <button class="cart-item-del" onclick="Cart.remove(${item.id})" title="Удалить">
            <i data-lucide="trash-2"></i>
          </button>
        </div>`).join('');
    }
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = this.total().toLocaleString('ru') + ' грн';
    refreshIcons();
  }
};

// ---- Тост ----
function toast(msg, dur = 2800) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

// ---- Корзина — открыть/закрыть ----
function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-panel')?.classList.add('open');
  Cart.renderPanel();
}
function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-panel')?.classList.remove('open');
}

// ---- Рендер карточки товара с SVG иллюстрацией ----
function renderProductCard(p) {
  const badgeClass = { 'Хит': 'badge-hit', 'Топ': 'badge-top', 'Скидка': 'badge-sale' }[p.badge] || '';
  const disabled = !p.inStock ? 'disabled' : '';

  return `
    <div class="product-card" data-id="${p.id}" data-cat="${p.category}">
      ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ''}
      <div class="product-img" style="background:${p.color}">
        <div class="product-img-circle"></div>
        <i data-lucide="${p.icon}" class="product-icon-svg" style="color:${p.iconColor}"></i>
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <div class="product-price-wrap">
            ${p.oldPrice ? `<div class="product-old-price">${p.oldPrice} грн</div>` : ''}
            <div class="product-price">${p.price.toLocaleString('ru')} грн</div>
            <div class="product-unit">за ${p.unit}</div>
            ${!p.inStock ? `<div class="product-out">Нет в наличии</div>` : ''}
          </div>
          <button class="btn-cart" title="В корзину"
            onclick="addToCart(${p.id})"
            ${disabled}
            id="cart-btn-${p.id}">
            <i data-lucide="shopping-cart" class="btn-cart-icon"></i>
          </button>
        </div>
      </div>
    </div>`;
}

// ---- Добавить в корзину ----
let _products = [];
function addToCart(id) {
  const p = _products.find(x => x.id === id);
  if (!p) return;
  Cart.add(p);
  const btn = document.getElementById('cart-btn-' + id);
  if (btn) {
    btn.classList.add('added');
    btn.innerHTML = '<i data-lucide="check"></i>';
    refreshIcons();
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = '<i data-lucide="shopping-cart" class="btn-cart-icon"></i>';
      refreshIcons();
    }, 1500);
  }
}

// ---- Поиск ----
function initSearch() {
  const form = document.getElementById('search-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if (q) window.location.href = `catalog.html?q=${encodeURIComponent(q)}`;
  });
}

// ---- Мобильное меню ----
function initBurger() {
  document.getElementById('burger')?.addEventListener('click', () =>
    document.getElementById('header-nav')?.classList.toggle('open'));
}

// ---- Инициализация ----
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateUI();
  initSearch();
  initBurger();
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  refreshIcons();
});
