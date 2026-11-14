/* Каталог: фильтры, поиск и сортировка по карточкам, которые отрисовал сервер */
(function () {
  'use strict';
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  cards.forEach((card, i) => { card.dataset.idx = i; });

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const countEl = document.getElementById('catalog-count');
  const noResults = document.getElementById('no-results');
  const bcCurrent = document.getElementById('bc-current');
  const catButtons = Array.from(document.querySelectorAll('#cat-filter [data-cat]'));
  const badgeButtons = Array.from(document.querySelectorAll('[data-badge].filter-item'));
  const stockAll = document.getElementById('stock-all');
  const stockYes = document.getElementById('stock-yes');

  const params = new URLSearchParams(location.search);
  const state = {
    cat: catButtons.some((b) => b.dataset.cat === params.get('cat')) ? params.get('cat') : 'all',
    badge: params.get('badge') || null,
    stock: 'all',
  };
  if (params.get('q')) searchInput.value = params.get('q');

  function pluralize(n, one, few, many) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
    return many;
  }

  function syncButtons() {
    catButtons.forEach((b) => b.classList.toggle('active', b.dataset.cat === state.cat));
    badgeButtons.forEach((b) => b.classList.toggle('active', b.dataset.badge === state.badge));
    stockAll.classList.toggle('active', state.stock === 'all');
    stockYes.classList.toggle('active', state.stock === 'yes');
    const current = catButtons.find((b) => b.dataset.cat === state.cat);
    bcCurrent.textContent = state.cat !== 'all' && current ? current.dataset.name : 'Каталог';
  }

  function apply() {
    const q = searchInput.value.trim().toLowerCase();
    const visible = cards.filter((card) => {
      const d = card.dataset;
      const ok =
        (state.cat === 'all' || d.cat === state.cat) &&
        (!state.badge || d.badge === state.badge) &&
        (state.stock !== 'yes' || d.stock === 'yes') &&
        (!q || d.search.includes(q));
      card.hidden = !ok;
      return ok;
    });

    const sort = sortSelect.value;
    const sorted = cards.slice().sort((a, b) => {
      if (sort === 'price-asc') return a.dataset.price - b.dataset.price;
      if (sort === 'price-desc') return b.dataset.price - a.dataset.price;
      if (sort === 'name') return a.dataset.name.localeCompare(b.dataset.name, 'ru');
      return a.dataset.idx - b.dataset.idx;
    });
    sorted.forEach((card) => grid.insertBefore(card, noResults));

    countEl.textContent = `Найдено: ${visible.length} ${pluralize(visible.length, 'товар', 'товара', 'товаров')}`;
    noResults.hidden = visible.length > 0;
    syncButtons();
  }

  catButtons.forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.cat; apply(); }));
  badgeButtons.forEach((b) =>
    b.addEventListener('click', () => {
      state.badge = state.badge === b.dataset.badge ? null : b.dataset.badge;
      apply();
    }),
  );
  stockAll.addEventListener('click', () => { state.stock = 'all'; apply(); });
  stockYes.addEventListener('click', () => { state.stock = 'yes'; apply(); });
  sortSelect.addEventListener('change', apply);
  searchInput.addEventListener('input', apply);
  // На странице каталога поиск работает без перезагрузки
  document.getElementById('search-form').addEventListener('submit', (e) => { e.preventDefault(); apply(); });
  document.getElementById('reset-filters').addEventListener('click', () => {
    state.cat = 'all';
    state.badge = null;
    state.stock = 'all';
    searchInput.value = '';
    apply();
  });

  apply();
})();
