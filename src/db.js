// Подключение к PostgreSQL, создание схемы и наполнение из data/*.json
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const { Pool, types } = require('pg');

// numeric → число (по умолчанию pg отдаёт строку)
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

const root = path.resolve(__dirname, '..');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5441),
  user: process.env.DB_USER || 'kanzmarket',
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || 'kanzmarket',
  max: 10,
});

async function migrate() {
  await pool.query(fs.readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8'));
}

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, 'data', name), 'utf8'));

// Полная перезапись каталога из data/categories.json и data/products.json (заявки не трогаем)
async function seed() {
  const categories = readJson('categories.json');
  const products = readJson('products.json');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    for (const [i, c] of categories.entries()) {
      await client.query(
        'INSERT INTO categories (id, name, description, lucide_icon, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [c.id, c.name, c.desc || '', c.lucideIcon || 'tag', i],
      );
    }
    for (const [i, p] of products.entries()) {
      await client.query(
        `INSERT INTO products
           (id, category_id, name, description, price, old_price, unit, in_stock, badge, icon, icon_color, color, img, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          p.id, p.category, p.name, p.desc || '', p.price, p.oldPrice ?? null, p.unit || 'шт',
          p.inStock !== false, p.badge || null, p.icon || null, p.iconColor || null, p.color || null,
          p.img || null, i,
        ],
      );
    }
    await client.query('COMMIT');
    return { categories: categories.length, products: products.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedIfEmpty() {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM products');
  return rows[0].n === 0 ? seed() : null;
}

module.exports = { pool, migrate, seed, seedIfEmpty };
