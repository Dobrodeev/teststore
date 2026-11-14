// Локальний кластер PostgreSQL для розробки (окремий від системних інстансів).
// Використання: node scripts/local-db.mjs init | start | stop
// Потрібні бінарні файли PostgreSQL (PG_BIN або стандартний шлях Windows).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dataDir = join(root, '.pgdata');
const port = process.env.DB_PORT || '5441';
const dbName = process.env.DB_NAME || 'kanzmarket';
const dbUser = process.env.DB_USER || 'kanzmarket';

function findBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = 'C:/Program Files/PostgreSQL';
  if (existsSync(base)) {
    const versions = readdirSync(base)
      .filter((v) => existsSync(join(base, v, 'bin', 'initdb.exe')))
      .sort((a, b) => Number(b) - Number(a));
    if (versions.length) return join(base, versions[0], 'bin');
  }
  return ''; // розраховуємо на PATH
}

const bin = findBin();
const exe = (name) => (bin ? join(bin, name) : name);
const run = (name, args) => {
  const r = spawnSync(exe(name), args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const cmd = process.argv[2];
if (cmd === 'init') {
  if (existsSync(join(dataDir, 'PG_VERSION'))) {
    console.log('Кластер уже створено:', dataDir);
  } else {
    run('initdb', ['-D', dataDir, '-U', dbUser, '-A', 'trust', '-E', 'UTF8', '--locale=C']);
    appendFileSync(
      join(dataDir, 'postgresql.conf'),
      `\nport = ${port}\nlisten_addresses = '127.0.0.1'\n`,
    );
    writeFileSync(
      join(dataDir, 'pg_hba.conf'),
      'host all all 127.0.0.1/32 trust\nhost all all ::1/128 trust\n',
    );
  }
  run('pg_ctl', ['-D', dataDir, '-l', join(dataDir, 'server.log'), '-w', 'start']);
  run('createdb', ['-h', '127.0.0.1', '-p', port, '-U', dbUser, dbName]);
  console.log(`Готово: postgres://${dbUser}@127.0.0.1:${port}/${dbName}`);
} else if (cmd === 'start') {
  run('pg_ctl', ['-D', dataDir, '-l', join(dataDir, 'server.log'), '-w', 'start']);
} else if (cmd === 'stop') {
  run('pg_ctl', ['-D', dataDir, '-m', 'fast', 'stop']);
} else {
  console.log('Використання: node scripts/local-db.mjs init | start | stop');
  process.exit(1);
}
