// Статический экспорт сайта для Firebase Hosting (там нельзя запустить Express).
// Поднимает сервер, обходит страницы из sitemap.xml и сохраняет HTML со статикой в firebase-dist/.
// Запуск: npm run export (база должна быть запущена: npm run db:start)
// Внимание: в статической версии форма заявки не сохраняет данные — для неё нужен работающий сервер.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'firebase-dist');
const port = process.env.EXPORT_PORT || '3187';
const origin = `http://127.0.0.1:${port}`;

// SITE_URL попадает в canonical, sitemap и JSON-LD — берём из окружения или .env
const envFile = join(root, '.env');
const siteUrl = (
  process.env.SITE_URL ||
  (existsSync(envFile) ? readFileSync(envFile, 'utf8').match(/^SITE_URL=(.+)$/m)?.[1] : '') ||
  ''
)
  .trim()
  .replace(/\/+$/, '');
if (!siteUrl || siteUrl.includes('localhost')) {
  console.error('Укажите в .env боевой адрес сайта: SITE_URL=https://ваш-домен');
  process.exit(1);
}

const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, PORT: port, NODE_ENV: 'production' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stop = () => server.kill();
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Сервер не запустился (проверьте базу: npm run db:start)');
    try {
      if ((await fetch(`${origin}/robots.txt`)).ok) return;
    } catch {
      /* порт ещё не слушается */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Сервер не ответил за 30 секунд');
}

function save(relPath, content) {
  const file = join(outDir, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

try {
  await waitForServer();

  rmSync(outDir, { recursive: true, force: true });
  cpSync(join(root, 'public'), outDir, { recursive: true });

  // Библиотеки из node_modules → /vendor
  const vendor = require('../src/vendor.js');
  mkdirSync(join(outDir, 'vendor'), { recursive: true });
  for (const [name, file] of Object.entries(vendor)) copyFileSync(file, join(outDir, 'vendor', name));

  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (!paths.length) throw new Error('sitemap.xml пустой');

  for (const path of paths) {
    const res = await fetch(origin + path);
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    // «/» → index.html, «/catalog» → catalog.html (Firebase cleanUrls отдаёт его по адресу /catalog)
    save(path === '/' ? 'index.html' : `${path.slice(1)}.html`, await res.text());
  }

  save('404.html', await (await fetch(`${origin}/__404__`)).text());
  save('sitemap.xml', sitemap);
  save('robots.txt', await (await fetch(`${origin}/robots.txt`)).text());

  console.log(`Экспортировано страниц: ${paths.length} (+404) → firebase-dist/, адрес сайта: ${siteUrl}`);
} catch (err) {
  console.error('Ошибка экспорта:', err.message);
  process.exitCode = 1;
} finally {
  stop();
}
