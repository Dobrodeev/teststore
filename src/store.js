// Запросы к каталогу и заявкам
const { pool } = require('./db');

// Форма товара совпадает с прежним data/products.json — её же хранит корзина в localStorage
const toProduct = (r) => ({
  id: r.id,
  category: r.category_id,
  categoryName: r.category_name,
  name: r.name,
  desc: r.description,
  price: r.price,
  oldPrice: r.old_price,
  unit: r.unit,
  inStock: r.in_stock,
  badge: r.badge,
  icon: r.icon,
  iconColor: r.icon_color,
  color: r.color,
  img: r.img ? '/' + r.img.replace(/^\/+/, '') : null,
});

async function getCategories() {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description AS desc, c.lucide_icon AS "lucideIcon",
            (SELECT count(*)::int FROM products p WHERE p.category_id = c.id) AS count
       FROM categories c
      ORDER BY c.sort_order, c.name`,
  );
  return rows;
}

async function getProducts() {
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
      ORDER BY p.sort_order, p.id`,
  );
  return rows.map(toProduct);
}

async function createOrder({ name, phone, email, type, message, items }) {
  // Цены и названия берём из базы, а не из запроса
  let lines = [];
  if (items.length) {
    const { rows } = await pool.query(
      'SELECT id, name, price, unit FROM products WHERE id = ANY($1::int[])',
      [items.map((i) => i.id)],
    );
    const byId = new Map(rows.map((r) => [r.id, r]));
    lines = items
      .filter((i) => byId.has(i.id))
      .map((i) => {
        const p = byId.get(i.id);
        return { id: p.id, name: p.name, price: p.price, unit: p.unit, qty: i.qty };
      });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const { rows } = await pool.query(
    `INSERT INTO orders (name, phone, email, type, message, items, total)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING id`,
    [name, phone, email || null, type || null, message || null, JSON.stringify(lines), total],
  );
  return { id: rows[0].id, total, items: lines.length };
}

module.exports = { getCategories, getProducts, createOrder };
