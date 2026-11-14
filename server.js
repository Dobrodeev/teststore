// Точка входа: готовит базу (схема + первичное наполнение) и запускает Express
require('dotenv').config({ quiet: true });
const app = require('./src/app');
const db = require('./src/db');

const port = Number(process.env.PORT || 3100);

(async () => {
  try {
    await db.migrate();
    const seeded = await db.seedIfEmpty();
    if (seeded) console.log(`База наполнена: категорий ${seeded.categories}, товаров ${seeded.products}`);
  } catch (err) {
    console.error('Не удалось подключиться к PostgreSQL (запущена ли база? `npm run db:start`):', err.message);
    process.exit(1);
  }
  app.listen(port, () => console.log(`КанцМаркет запущен: http://localhost:${port}`));
})();
