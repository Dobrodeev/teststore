-- Схема базы данных КанцМаркет. Выполняется при каждом старте (идемпотентна).
CREATE TABLE IF NOT EXISTS categories (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  lucide_icon text NOT NULL DEFAULT 'tag',
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          integer PRIMARY KEY,
  category_id text NOT NULL REFERENCES categories (id),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  price       numeric(10, 2) NOT NULL,
  old_price   numeric(10, 2),
  unit        text NOT NULL DEFAULT 'шт',
  in_stock    boolean NOT NULL DEFAULT true,
  badge       text,
  icon        text,
  icon_color  text,
  color       text,
  img         text,
  sort_order  integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id);

-- Заявки из формы на странице контактов
CREATE TABLE IF NOT EXISTS orders (
  id         serial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  name       text NOT NULL,
  phone      text NOT NULL,
  email      text,
  type       text,
  message    text,
  items      jsonb NOT NULL DEFAULT '[]',
  total      numeric(10, 2) NOT NULL DEFAULT 0
);
