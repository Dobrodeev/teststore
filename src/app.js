// Express-приложение КанцМаркет: страницы (EJS), API заявок, SEO-маршруты
const path = require('node:path');
const express = require('express');
const compression = require('compression');
const site = require('./site');
const store = require('./store');
const vendor = require('./vendor');

const root = path.resolve(__dirname, '..');
const app = express();
const assetVersion = Date.now().toString(36);

app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '20kb' }));

// Общие данные для всех шаблонов
app.locals.site = site;
app.locals.v = assetVersion;
app.locals.year = new Date().getFullYear();
app.locals.toJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
app.locals.money = (n) => Number(n).toLocaleString('ru-RU');

// ---- Статика ----
app.use(express.static(path.join(root, 'public'), { maxAge: '7d' }));
app.get('/vendor/:file', (req, res, next) => {
  const file = vendor[req.params.file];
  if (!file) return next();
  res.sendFile(file, { maxAge: '30d' });
});

// ---- Старые адреса статического сайта ----
const legacy = { '/index.html': '/', '/catalog.html': '/catalog', '/o-nas.html': '/o-nas', '/kontakty.html': '/kontakty' };
for (const [from, to] of Object.entries(legacy)) {
  app.get(from, (req, res) => {
    const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    res.redirect(301, to + query);
  });
}

// ---- Микроразметка ----
const abs = (p) => site.url + p;
const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Главная', path: '/' }, ...items].map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});
const postalAddress = (withOffice) => ({
  '@type': 'PostalAddress',
  streetAddress: withOffice ? `${site.address.street}, ${site.address.office}` : site.address.street,
  addressLocality: site.address.city,
  addressCountry: 'UA',
});

const faq = [
  {
    q: 'Как сделать заказ в КанцМаркет?',
    a: `Оформить заказ можно через форму на сайте, по телефону ${site.phone.display} или через Viber/WhatsApp ${site.messenger.display}. Ответим в течение 15 минут в рабочее время.`,
  },
  {
    q: 'Сколько стоит доставка по Киеву?',
    a: 'Доставка курьером по Киеву стоит 80 грн. При заказе от 800 грн доставка бесплатная. Срок — от 2 часов.',
  },
  {
    q: 'Какие способы оплаты принимает КанцМаркет?',
    a: 'Принимаем оплату наличными, картой Visa/MasterCard, через Приват24 и MonoBank, а также оплату при получении.',
  },
  {
    q: 'Как долго доставляются товары по Украине?',
    a: 'Доставка по Украине осуществляется Новой Почтой или Укрпочтой. Срок — 1–2 рабочих дня.',
  },
  {
    q: 'Можно ли забрать заказ самовывозом?',
    a: `Да, самовывоз бесплатный. Адрес: ${site.address.city}, ${site.address.street}, ${site.address.office}. Товар будет готов через 1 час после оформления заказа.`,
  },
];

// ---- Страницы ----
const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/price', priority: '0.8', changefreq: 'daily' },
  { path: '/o-nas', priority: '0.6', changefreq: 'monthly' },
  { path: '/kontakty', priority: '0.7', changefreq: 'monthly' },
];

app.get('/', async (req, res) => {
  const [categories, products] = await Promise.all([store.getCategories(), store.getProducts()]);
  const hits = products.filter((p) => p.badge === 'Хит' || p.badge === 'Скидка').slice(0, 4);
  const top = products
    .filter((p) => p.badge === 'Топ')
    .concat(products.filter((p) => !p.badge))
    .slice(0, 4);
  res.render('pages/home', {
    active: 'home',
    meta: {
      title: 'КанцМаркет Киев — Канцтовары с доставкой по Киеву',
      description:
        'Интернет-магазин канцтоваров в Киеве. Ручки, тетради, папки, бумага, маркеры, товары для рисования. Доставка по Киеву и Украине.',
      keywords:
        'канцтовары Киев, купить канцтовары Киев, ручки карандаши Киев, тетради блокноты Киев, офисные принадлежности Киев',
      ogTitle: 'КанцМаркет — Канцтовары в Киеве',
      ogDescription:
        'Широкий выбор канцтоваров с доставкой по Киеву. Более 500 позиций. Ручки, тетради, маркеры, папки.',
      path: '/',
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: site.name,
        description: 'Интернет-магазин канцтоваров в Киеве',
        url: site.url,
        telephone: site.phone.tel,
        address: postalAddress(false),
        openingHours: site.hours.schema,
        priceRange: 'от 12 грн',
        sameAs: site.socials,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
    categories,
    hits,
    top,
    clientProducts: [...hits, ...top],
    scripts: ['/js/home.js'],
  });
});

app.get('/catalog', async (req, res) => {
  const [categories, products] = await Promise.all([store.getCategories(), store.getProducts()]);
  res.render('pages/catalog', {
    active: 'catalog',
    meta: {
      title: 'Каталог канцтоваров — КанцМаркет Киев',
      description:
        'Полный каталог канцтоваров в Киеве: ручки, тетради, папки, бумага, маркеры, товары для рисования. Фильтр по категориям.',
      ogDescription:
        'Более 500 наименований канцтоваров в Киеве: ручки, тетради, папки, бумага, маркеры. Доставка от 2 часов.',
      path: '/catalog',
    },
    jsonLd: [breadcrumbs([{ name: 'Каталог', path: '/catalog' }])],
    categories,
    products,
    clientProducts: products,
    scripts: ['/js/catalog.js'],
  });
});

app.get('/price', async (req, res) => {
  const products = await store.getProducts();
  res.render('pages/prices', {
    active: 'price',
    meta: {
      title: 'Прайс-лист на канцтовары — КанцМаркет Киев',
      description:
        'Прайс-лист КанцМаркет: цены на ручки, тетради, папки, бумагу, маркеры и товары для рисования в Киеве. Поиск и сортировка по всем позициям.',
      path: '/price',
    },
    jsonLd: [breadcrumbs([{ name: 'Прайс-лист', path: '/price' }])],
    products,
    clientProducts: products,
    styles: ['/vendor/dataTables.dataTables.min.css', '/vendor/responsive.dataTables.min.css'],
    scripts: ['/vendor/dataTables.min.js', '/vendor/dataTables.responsive.min.js', '/js/prices.js'],
  });
});

app.get('/o-nas', (req, res) => {
  res.render('pages/about', {
    active: 'about',
    meta: {
      title: 'О магазине КанцМаркет — канцтовары в Киеве',
      description:
        'КанцМаркет — интернет-магазин канцелярских товаров в Киеве. Товары для офиса, школы, студентов и художников. Доставка по Киеву и Украине.',
      path: '/o-nas',
    },
    jsonLd: [breadcrumbs([{ name: 'О нас', path: '/o-nas' }])],
  });
});

app.get('/kontakty', (req, res) => {
  const cityStreet = `${site.address.city} ${site.address.street}`;
  res.render('pages/contacts', {
    active: 'contacts',
    meta: {
      title: 'Контакты и доставка — КанцМаркет Киев | Телефон, адрес, заказ',
      description: `Контакты КанцМаркет: телефон ${site.phone.display}, ${cityStreet}. Доставка по Киеву от 2 часов, по Украине — Новая Почта. Оформить заказ онлайн.`,
      ogTitle: 'Контакты и доставка — КанцМаркет Киев',
      ogDescription: `Телефон ${site.phone.display}, ${cityStreet}. Доставка по Киеву от 2 часов.`,
      path: '/kontakty',
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: site.name,
        url: site.url,
        telephone: site.phone.tel,
        email: site.email,
        address: postalAddress(true),
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: site.hours.opens,
            closes: site.hours.closes,
          },
        ],
        geo: { '@type': 'GeoCoordinates', ...site.geo },
        priceRange: 'от 12 грн',
        sameAs: site.socials.slice(0, 2),
      },
      breadcrumbs([{ name: 'Контакты', path: '/kontakty' }]),
    ],
    scripts: ['/js/contacts.js'],
  });
});

// ---- API: заявка с формы ----
const recent = new Map(); // ip → отметки времени последних заявок
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.post('/api/orders', async (req, res) => {
  const now = Date.now();
  const stamps = (recent.get(req.ip) || []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= LIMIT) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок. Попробуйте позже или позвоните нам.' });
  }

  const body = req.body || {};
  const name = str(body.name, 120);
  const phone = str(body.phone, 40);
  if (!name || phone.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и номер телефона.' });
  }
  const items = (Array.isArray(body.items) ? body.items : [])
    .slice(0, 100)
    .map((i) => ({ id: Number(i && i.id), qty: Math.min(Math.max(Math.trunc(Number(i && i.qty)) || 0, 0), 999) }))
    .filter((i) => Number.isInteger(i.id) && i.qty > 0);

  const order = await store.createOrder({
    name,
    phone,
    email: str(body.email, 160),
    type: str(body.type, 80),
    message: str(body.message, 2000),
    items,
  });
  stamps.push(now);
  recent.set(req.ip, stamps);
  res.status(201).json({ ok: true, id: order.id, total: order.total, items: order.items });
});

// ---- SEO ----
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const urls = pages
    .map((p) => `  <url><loc>${abs(p.path)}</loc><priority>${p.priority}</priority><changefreq>${p.changefreq}</changefreq></url>`)
    .join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// ---- 404 и ошибки ----
app.use((req, res) => {
  res.status(404).render('pages/404', {
    active: '',
    meta: { title: 'Страница не найдена — КанцМаркет', description: 'Такой страницы нет.', path: req.path, noindex: true },
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ ok: false, error: 'Некорректный запрос.' });
  }
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: 'Ошибка сервера. Попробуйте позже или позвоните нам.' });
  }
  res.status(500).type('text/plain').send('Ошибка сервера. Попробуйте обновить страницу позже.');
});

module.exports = app;
