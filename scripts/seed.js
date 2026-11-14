// Перезаписывает каталог в базе из data/categories.json и data/products.json
const db = require('../src/db');

(async () => {
  try {
    await db.migrate();
    const r = await db.seed();
    console.log(`Каталог обновлён: категорий ${r.categories}, товаров ${r.products}`);
  } catch (err) {
    console.error('Ошибка наполнения базы:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
