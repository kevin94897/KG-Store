-- ============================================================
-- KG Store — Supabase Schema + Seed
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── CATEGORIES ──────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  created_at  timestamptz default now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default uuid_generate_v4(),
  wc_id             integer,
  name              text not null,
  slug              text not null unique,
  sku               text,
  type              text default 'simple',
  status            text default 'published' check (status in ('published','draft','archived')),
  short_description text,
  description       text,
  regular_price     numeric(10,2),
  sale_price        numeric(10,2),
  in_stock          boolean default true,
  featured          boolean default false,
  images            text[] default '{}',
  tags              text[] default '{}',
  category_id       uuid references categories(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── ORDERS ──────────────────────────────────────────────────
create table if not exists orders (
  id           uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  status       text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total        numeric(10,2),
  notes        text,
  items        jsonb default '[]',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

-- Public read for categories and products
create policy "Public read categories" on categories for select using (true);
create policy "Public read products" on products for select using (true);

-- Admin full access (authenticated users)
create policy "Admin all categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin all products" on products for all using (auth.role() = 'authenticated');
create policy "Admin all orders" on orders for all using (auth.role() = 'authenticated');

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_status_idx on products(status);
create index if not exists products_slug_idx on products(slug);

-- ─── SEED DATA ───────────────────────────────────────────────
-- Categories

insert into categories (name, slug) values ('Coleccionables', 'coleccionables') on conflict (slug) do nothing;
insert into categories (name, slug) values ('Edición Coleccionista', 'edicion-coleccionista') on conflict (slug) do nothing;
insert into categories (name, slug) values ('Figuras', 'figuras') on conflict (slug) do nothing;
insert into categories (name, slug) values ('Sin categoría', 'sin-categoria') on conflict (slug) do nothing;

-- Products
insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  12468,
  'Nier Automata SQUARE ENIX 1/6 Original',
  'nier-automata-square-enix-16-original',
  '204',
  'simple',
  'published',
  '2B (YoRHa Número 2 Tipo B), del juego de rol de acción NieR:Automata. La figura del prototipo ha sido creada por Mitsumasa Yoshizawa (REFLECT) y será un añadido impresionante para tu colección de NieR:Automata.

La versión estándar de 2B incluye gafas y cuerpo con la falda disipadora de calor, la espada Contrato virtuoso y una peana.',
  '2B (YoRHa Número 2 Tipo B), del juego de rol de acción NieR:Automata. La figura del prototipo ha sido creada por Mitsumasa Yoshizawa (REFLECT) y será un añadido impresionante para tu colección de NieR:Automata.

La versión estándar de 2B incluye gafas y cuerpo con la falda disipadora de calor, la espada Contrato virtuoso y una peana.



Esta figura es una reedición de la figura de 2B de FLARE, a la venta originalmente en 2020.



Este producto, producido por FLARE Co. Ltd., lo vende y distribuye SQUARE ENIX.



 	Dimensiones del producto: altura total aproximada: 28 cm

 	Prototipo esculpido por: [2B] Mitsumasa Yoshizawa (REFLECT)/[Contrato virtuoso] Takayuki Higashi

 	Materiales: PVC totalmente pintado',
  450.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1518.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1519.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1520.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1521.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1522.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1523.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1524.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2022/12/IMG_1525.png"}',
  '{"figura","Nier automata","PS4","Square enix"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16075,
  'Nero DmC 1/8 ARTFX Kotobukiya',
  'nero-dmc-18-artfx-kotobukiya',
  '204-1',
  'simple',
  'published',
  'El personaje de Nero está perfectamente representado mientras apunta con su característica pistola de dos cañones, "Blue Rose", y tiene una expresión provocativa en su rostro. La estatua está elaborada por expertos para mostrar cada detalle realista, desde las hebillas de metal de su atuendo hasta las mangas dobladas de su abrigo.



Las armas características de Nero, Blue Rose y Red Queen, también están recreadas fielmente. Los detalles de la empuñadura y el motor de combustión de Red Queen son',
  'El brazo “Devil Breaker” de Nero, una nueva incorporación a la franquicia en la quinta entrega, también está en exhibición, elaborado con el mismo nivel de cuidado y detalle que el resto de la estatua.



Al igual que en el juego, además de “Gerbera”, que está adherida a su brazo, también se muestran “Overture” y “Punch Line” colgando de la cintura de Nero. Aunque los dos últimos están cubiertos por su abrigo, los Devil Breakers son extremadamente detallados y fieles al juego, lo que los convierte en una visita obligada para cualquier fan de Devil May Cry 5.



Una pieza bellamente detallada de la cabeza a los pies. Agrega esta estatua a tu colección hoy para presenciar su artesanía en persona y muéstrala junto a la estatua ARTFX J Dante para recrear el mundo de Devil May Cry.



 	Dimensiones del producto: altura total aproximada: 27 cm

 	Prototipo esculpido por: ESTUDIO CERO x SH-ESTUDIO

 	Materiales: PVC, ABS',
  400.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1213.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1214.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1215.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1217.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1218.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1220.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1221.png"}',
  '{"dmc","figura","nero","PS4"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16115,
  'Jump Force PS4 Edición Coleccionista',
  'jump-force-ps4-edicion-coleccionista',
  '204-2',
  'simple',
  'published',
  'Por primera vez, los héroes más famosos del manga se lanzan a un nuevo campo de batalla: nuestro mundo. Al unirse para luchar contra la amenaza más peligrosa, Jump Force asumirá el destino de toda la humanidad. Para celebrar el 50 aniversario de la famosa revista semanal Jump, Jump Force aprovecha al máximo las últimas tecnologías para dar vida a los personajes con un diseño realista nunca antes visto. La Edición de Coleccionista incluye: diorama exclusivo, juego completo, 3 tableros de arte, li',
  'La Edición Coleccionista de Jump Force incluye:



 	El juego Jump Force.

 	Diorama exclusivo de 30 Cm, con una representación de Goku, Naruto y Luffy en una misma figura.

 	Caja metálica con arte del juego.

 	3 láminas de arte de 28x28 cm con representaciones de Goku, Naruto y Luffy.

 	El Pase de Temporada, que incluye 9 personajes adicionales.

 	Caja Edición Coleccionista.',
  950.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1475.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1478.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1479.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1477.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1476.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1474.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1473.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1472.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1471.jpg"}',
  '{"collector edition","edicion coleccionista","Jump Force","PS4"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16220,
  'inFamous PS4 Edición Coleccionista',
  'infamous-ps4-edicion-coleccionista',
  '204-2-1',
  'variable',
  'published',
  'Prepárate para explorar la realista ciudad de Seattle de la mano de un joven que de repente adquiere extraordinarios poderes en inFAMOUS, que regresa para PS4. Cuando las cosas se ponen feas, de ti depende el camino a elegir.',
  'Superhumano. Temido. Delsin se ve obligado a tomar decisiones que afectan a los que le rodean.



Toma decisiones y cambia el futuro.



Rodeado por una sociedad que los teme, los superhumanos son cazados y enjaulados por el Departamento de Protección Unificada.



Cuando Delsin Rowe descubre sus poderes se ve obligado a huir, buscando a otros superhumanos para salvar a sus seres queridos del opresor D.P.U. que ahora le pisa los talones. Las elecciones que tome mientras tanto cambiarán el futuro de todos los que le rodean.



La Edición Coleccionista incluye:



 	Copia comercial completa de inFAMOUS Second Son con portada exclusiva de la Edición de Coleccionista.

 	Réplica premium del gorro de Delsin.

 	Conjunto de 8 pines del chaleco del juego de Delsin.

 	Parche oficial del Departamento de Protección Unificada.

 	Stickers

 	No incluye estatua



La estatua de Delsin Rowe tiene las siguientes caracterisiticas:



 	Material:  Polystone

 	Escala: 1/6

 	Limitado a 300 unidades en el mundo

 	Desarrollado por: Sucker Punch Productions',
  null,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1257.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1258.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1259.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1260.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1261.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1262.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1263.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1264.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1265.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1266.jpg"}',
  '{"collector edition","edicion coleccionista","infamous","PS4"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16231,
  'inFamous PS4 Edición Coleccionista - Ambos',
  'infamous-ps4-edicion-coleccionista---ambos',
  '',
  'simple',
  'published',
  '',
  'Incluye todo el contenido de la foto.',
  2800.0,
  2500.0,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1259.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16232,
  'inFamous PS4 Edición Coleccionista - Edición',
  'infamous-ps4-edicion-coleccionista---edicion',
  '',
  'simple',
  'published',
  '',
  'Incluye la edición coleccionista (no viene la estatua).',
  400.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/11/IMG_1260.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16233,
  'inFamous PS4 Edición Coleccionista - Estatua de Delsin',
  'infamous-ps4-edicion-coleccionista---estatua-de-delsin',
  '968986986',
  'simple',
  'published',
  '',
  'Incluye solo la estatua de Delsin limitada a solo 300 unidades en el mundo.',
  1500.0,
  1400.0,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/ESTATUA.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16277,
  'Sekiro PS4 Edición Coleccionista',
  'sekiro-ps4-edicion-coleccionista',
  '204-2-1-1',
  'variable',
  'published',
  'Crea tu propio e inteligente camino hacia la venganza en una nueva aventura del desarrollador FromSoftware, creadores de Bloodborne y la serie Dark Souls.',
  'En Sekiro: Shadows Die Twice eres el "lobo manco", un guerrero desfigurado y caído en desgracia rescatado del borde de la muerte. En tu misión de proteger a un joven señor que es descendiente de un antiguo linaje, te conviertes en el objetivo de muchos enemigos feroces, incluido el peligroso clan Ashina. Cuando el joven señor sea capturado, nada te detendrá en una peligrosa misión para recuperar tu honor, ni siquiera la muerte misma.; Número de jugadores: 1 jugador; Contenido ESRB: Sangre y gore | Violencia; Género: Acción y aventura



La edición coleccionista de Sekiro: Shadows Die Twice incluye



 	Juego completo

 	Libro de acero

 	Estatua de Shinobi de 7”

 	Mapa

 	Monedas de juego de réplica

 	Banda sonora digital

 	Libro de arte coleccionable',
  null,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1139.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1141.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1142.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1143.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1144.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1145.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1146.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1148.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1150.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1151.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/F1168B1F-0836-4A8B-89D2-288FDC902446-scaled.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/3E05A097-1B24-4EC0-B019-DD2B6153818D-scaled.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/01CB047A-D8C5-4FB7-855A-7385CC9F6BA1-scaled.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/068669B4-2573-4F61-8483-FD7819FE8C81-scaled.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9797.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9798.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9799.jpg"}',
  '{"collector edition","edicion coleccionista","PS4","sekiro"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16278,
  'Sekiro PS4 Edición Coleccionista - Edición + Extras',
  'sekiro-ps4-edicion-coleccionista---edicion-extras',
  '',
  'simple',
  'published',
  '',
  'Incluye la edición completa, steelbook azul limitado y la katana (letter opener)',
  1400.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1148.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16279,
  'Sekiro PS4 Edición Coleccionista - Figura 1/6',
  'sekiro-ps4-edicion-coleccionista---figura-16',
  '968986986-1',
  'simple',
  'published',
  '',
  'Solo incluye la figura en escala 1/6 con todos sus accesorios.',
  1200.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1142.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16280,
  'Sekiro PS4 Edición Coleccionista - Ambos',
  'sekiro-ps4-edicion-coleccionista---ambos',
  '',
  'simple',
  'published',
  '',
  'Incluye todo el contenido de la foto.',
  2500.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1140.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16320,
  'Resident Evil Biohazard PS4 Edición Coleccionista',
  'resident-evil-biohazard-ps4-edicion-coleccionista',
  '204-2-1-1-1',
  'simple',
  'published',
  'La Edición de coleccionista de Resident Evil 7 trae el terror a casa. Repleta de elementos únicos con modelos basados ​​en elementos y lugares de Resident Evil 7 Biohazard, esta Edición de coleccionista seguramente será la pieza central de la colección de cualquier fan.',
  'Por supuesto, lo más destacado es la réplica de la mansión Baker, que mide 20 cm de alto, 19 cm de largo y 21 cm de profundidad y que también funciona como una caja de música que reproduce una melodía familiar con efectos LED de acompañamiento. Esta también es tu oportunidad de tener el dedo falso, el mismo que ha atormentado a los fanáticos desde el anuncio del juego. Pero eso no es todo; también se incluye un estuche de metal para el juego, una litografía que muestra a la familia Baker en todo su misterio, una caja de video para el dedo falso y una nota espeluznante de uno de los residentes de la mansión.



La edición de coleccionista incluye:



 	Una unidad USB de 4 GB con la forma del misterioso dedo falso del juego

 	Una caja de metal SteelBook exclusiva

 	Una caja de cinta VHS

 	Una litografía con la familia Baker

 	Una "nota espeluznante"

 	Una copia del juego

 	Caja de música de la mansión (que reproduce una muestra de la versión del juego de "Go Tell Aunt Rhody")',
  2800.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0341.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0337.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0338.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0339.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0340.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0342.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0343.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0344.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0345.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0346.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/467E39AE-D3DE-4D5F-A11C-DC8BC918C543-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/2C0C87D9-1A2A-46A0-97A2-19611E572228-rotated.jpg"}',
  '{"biohazard","collector edition","edicion coleccionista","PS4","resident evil"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16354,
  'Estatua de Joel - Last of Us II',
  'estatua-de-joel---last-of-us-ii',
  '204-1-1',
  'simple',
  'published',
  'En asociación con Naughty Dog Studios, Dark Horse Direct se enorgullece de presentar una nueva estatua de Joel, el personaje de The Last of Us Part II. Defensor, protector y figura paterna, Joel te cuidará las espaldas y te tocará una melodía clásica.',
  'Joel mide 14,25" de alto sobre una base de 10" de diámetro, estoicamente en posición con su guitarra y su arma. Elaborado meticulosamente por los artistas de Bigshot Toyworks y Level 52, es la continuación de nuestras estatuas de Ellie con arco, Ellie con machete y Abby, que fueron muy populares (y se agotaron).



La estatua tiene las siguientes caracteristicas:



 	Limitado a 2500 piezas

 	Material: Poliresina

 	Largo: 21” (533,4 mm)

 	Ancho:  16” (406,4 mm)

 	Alto: 15” (381 mm)

 	37 libras (16,78 kg)',
  1200.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_3184.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_3181.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_3183.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_3114.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_3180.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_2882.png"}',
  '{"dark horse","figura","joel","last of us","PS4"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16361,
  'Lies of P PS5 Edición coleccionista',
  'lies-of-p-ps5-edicion-coleccionista',
  '204-2-2',
  'simple',
  'published',
  '¿Qué es Lies of P? Un juego de acción y fantasía oscura basado en el famoso Pinocho de los cuentos de hadas para PS5.',
  'Eres un títere creado por Geppetto que está atrapado en una red de mentiras con monstruos inimaginables y figuras poco confiables que se interponen entre tú y los eventos que han sucedido en el mundo de Lies of P.



¿Qué incluye?



 	Juego PS5.

 	Steelbook.

 	DLC.

 	Póster en A4.

 	Portadas de personajes y con mensaje de los desarrolladores.

 	Banda sonora.

 	Banda sonora especial en vinilo.

 	Placa metálica de Venigni Company.

 	Placa metálica de Workshop Union.',
  650.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0208.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0211.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0210.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0209.jpg"}',
  '{"collector edition","edicion coleccionista","lies of p","PS5"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16366,
  'Last of Us Edición de Ellie',
  'last-of-us-edicion-de-ellie',
  '204-2-2-1',
  'simple',
  'published',
  'Una historia compleja y emotiva: experimente los conflictos morales cada vez más intensos que genera la incesante búsqueda de venganza de Ellie. El ciclo de violencia que deja a su paso desafiará sus nociones de lo correcto contra lo incorrecto, el bien contra el mal y el héroe contra el villano.



Un mundo hermoso pero peligroso: emprende el viaje de Ellie, que la llevará desde las pacíficas montañas y bosques de Jackson hasta las exuberantes ruinas del área metropolitana de Seattle. Conoce nu',
  'La edición de Ellie de The LAST of Us Part II incluye el siguiente contenido: 



 	Parche con el logo de The Last of Us Part II

 	Disco de vinilo de 7” con música de la banda sonora original

 	Réplica de la mochila de Ellie

 	Mini libro de arte de 48 páginas de Dark Horse E

 	Estuche steelbook con el juego completo

 	Estatua de Ellie de 12”

 	Litografía y carta de agradecimiento

 	Réplica de la pulsera de Ellie

 	Juego de 6 pines esmaltados

 	Juego de 5 pegatinas

 	Tema dinámico de PS4

 	Juego de 6 avatares de PSN

 	Banda sonora digital

 	Mini libro de arte digital de Dark Horse proporcionado por el cupón dentro del paquete.',
  1500.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0164.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0171.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0170.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0169.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0168.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0167.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0166.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0165.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0163.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0180.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0179.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0178.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0177.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0176.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0175.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0174.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0173.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_0172.jpg"}',
  '{"collector edition","edicion coleccionista","ellie edition","last of us","PS4"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16398,
  'Gotham Knights PS5 Edición Coleccionista + Extra',
  'gotham-knights-ps5-edicion-coleccionista-extra',
  '204-2-3',
  'simple',
  'published',
  'Gotham Knights es un juego de acción RPG de mundo abierto, ambientado en la versión de Gotham dinámica e interactiva hasta la fecha. Tanto jugando en solitario como junto a otro héroe, podrás patrullar los cinco distritos de Gotham y desbaratar actividades criminales allí donde las encuentres. Tu legado comienza aquí. Conviértete en el Caballero.',
  'Batman ha muerto. Una nueva organización criminal ha barrido las calles de Gotham City. La batfamilia, compuesta por Batgirl, Nightwing, Capucha Roja y Robin, deberá proteger Gotham, devolver la esperanza a sus ciudadanos, la disciplina a sus policías y el miedo a sus criminales. Además de resolver los misterios que conectan los capítulos más oscuros de la historia de la ciudad y derrotar a famosos villanos en enfrentamientos épicos, deberás convertirte en el nuevo Caballero Oscuro y evitar que el caos se apodere de las calles.



La Edición Coleccionista de Gotham Knights incluye:



 	El juego Gotham Knights

 	Maquete exclusiva inspirada en el arte de Jim Lee y certificado de autenticidad

 	Presentación Original Ledbook Edición Libro 16 Páginas

 	Pin Coleccionable en Realidad Aumentada

 	Mapa de Gotham City

 	Estuche Edición Coleccionista

 	Maqueta exclusiva inspirada en el arte de Jim Lee

 	Certificado de autenticidad

 	Extra: Steelbook metálico (adicional a la edición)',
  750.0,
  650.0,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9699.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9704.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9705.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9703.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9702.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9701.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_9700.jpg"}',
  '{"collector edition","edicion coleccionista","Gotham Knights","PS5"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16439,
  'Metal Gear Solid Venom Snake (Phantom Pain)',
  'metal-gear-solid-venom-snake-phantom-pain',
  '204-4',
  'simple',
  'published',
  '"El guerrero más grande del siglo XX" mira fijamente a la distancia: listo para la acción, Venom Snake, también conocido como Big Boss, es el único hombre que puede prever los resultados de su ambición.



Del equipo de Play Arts Kai, esta edición especial de Big Boss intenta capturar a este hombre en su forma de Phantom Pain. Se han realizado detalles especiales para replicar su brazo protésico y su equipo opcional: ¡el desgaste de su equipo refleja todo lo que este hombre ha visto!',
  'De Square Enix. Esta recreación detallada por expertos de Venom Snake del videojuego cuenta con nuevas estructuras articulares que permiten una articulación suave en los codos, rodillas, cuello, tobillos y hombros para un aspecto más natural. Su línea corporal extremadamente en forma y la recreación de la textura en sus músculos exudan una sensación de tensión y resistencia, única de Snake.



La figura incluye una cabeza alternativa, manos intercambiables, una radio, un rifle, una pistola, una daga y un soporte de exhibición.



 	Altura total aproximada: 28 cm

 	Tipo : ORIGINAL

 	Empresa: SQUARE ENIX

 	De: PLAY ARTS KAI 

 	Non Scale Pre-Painted PVC Figure',
  680.0,
  null,
  false,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1825.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1827.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1828.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1829.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1830.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1831.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1832.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1826.jpg"}',
  '{"figura","metal gear solid","phantom pain","PS4","snake","venom snake"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16448,
  'Metal Gear Solid Venom (Ground Zeroes)',
  'metal-gear-solid-venom-ground-zeroes',
  '204-4-1',
  'simple',
  'published',
  'Al igual que todas las figuras de Play Arts Kai, se destacan los numerosos puntos de articulación que garantizan que esta versión de Snake se integrará perfectamente con una colección cada vez mayor. Además, la nueva tecnología en las articulaciones de las rodillas y los codos garantiza una postura realista; junto con la zona de los hombros de resina suave, se ha aumentado el rango de movimiento; tal vez esta sea la versión de Snake con más posturas hasta el momento.',
  'Con su prototipo presentado en el Tokyo Game Show 2013, los fanáticos de Metal Gear Solid de Hideo Kojima se maravillaron con el detalle cinético presentado en la iteración Play Arts Kai de Snake de  Metal Gear Solid V: Ground Zeroes.



Snake viene con una pistola Wu Silent, un rifle MRS-4, un cuchillo de combate, una cabeza intercambiable de Snake con sus gafas de visión nocturna y un par de manos adicionales. Esta figura también se puede adaptar y se lanzará en la primavera de 2014, en conmemoración del lanzamiento del juego MGSV:GZ.



 	Altura total aproximada: 28 cm

 	Tipo : ORIGINAL

 	Empresa: SQUARE ENIX

 	De: PLAY ARTS KAI 

 	Non Scale Pre-Painted PVC Figure',
  680.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1833.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1835.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1836.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1837.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1838.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1839.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1840.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1841.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1842.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1834.jpg"}',
  '{"figura","ground zeroes","metal gear solid","PS4","snake","venom snake"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16460,
  'Play Arts Kai Spike Spiegel Cowboy Bebop',
  'play-arts-kai-spike-spiegel-cowboy-bebop',
  '204-4-1-1',
  'simple',
  'published',
  'Spike, Jet, Faye y Ed son vaqueros en la nueva frontera del espacio, y juntos, esta banda de cazarrecompensas asume los trabajos que cualquier persona en su sano juicio rechazaría. Los fanáticos del anime Cowboy Bebop apreciarán las figuras de acción Play Arts ~Kai~ de Square Enix, una versión actualizada de su serie Play Arts altamente detallada.',
  'Estas figuras cuentan con mejores detalles, más articulación y accesorios adicionales, lo que permite que los personajes de los juegos salgan del televisor y entren en tu colección. Elige entre personajes como Spike Spiegel (9 7/8 "de alto) y su rival Vicious (9 7/8 "de alto). Empaque en caja con ventana.



 	Altura total aproximada: 25 cm

 	Tipo : ORIGINAL

 	Empresa: SQUARE ENIX

 	De: PLAY ARTS KAI 

 	Non Scale Pre-Painted PVC Figure',
  350.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1705.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1706.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1707.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1708.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1709.jpg"}',
  '{"cowboy bebop","figura","play arts kai","spike"}',
  (select id from categories where slug = 'figuras' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16528,
  'Far Cry 6 Edición coleccionista PS4/PS5',
  'far-cry-6-edicion-coleccionista-ps4ps5',
  '204-2-2-2',
  'simple',
  'published',
  'Prende la llama de la revolución con Far Cry 6 Collector’s Edition, disponible exclusivamente en Ubisoft Store.



Esta Collector’s Edition especial trae toda una serie de objetos coleccionables de alta calidad, la Ultimate Edition del juego y más contenido extra.',
  'Incluye una réplica* de alta gama del "Tostador", el lanzallamas casero del juego, compuesto por 7 piezas y con una longitud de 72 cm. Viene con una hoja de instrucciones para el montaje ilustrada por el famoso artista Tobatron. También recibirás un Steelbook exclusivo, una caja de coleccionista, un libro de ilustraciones de 64 páginas (formato A4), un llavero de Chorizo, un mapa del mundo y la banda sonora del juego seleccionada. No incluye el juego de pegatinas :c



Además, también recibirás la Ultimate Edition, que incluye el juego, el Season Pass y el pack Ultimate, para que puedas disfrutar de más contenido premium. El pack Ultimate incluye: el pack Antivicio, el pack Cazador de cocodrilos y el pack Expedición en la jungla.',
  950.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1963.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1966.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1968.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1970.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1967.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1969.png","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1971.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1964.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1965.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1973.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/IMG_1972.jpg"}',
  '{"collector edition","edicion coleccionista","far cry 6","PS5"}',
  (select id from categories where slug = 'edicion-coleccionista' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16546,
  'Death Stranding Coleccionables',
  'death-stranding-coleccionables',
  '204-2-2-2-1',
  'variable',
  'published',
  'Pongo a la venta algunos objetos coleccionables directos de Kojima Productions.',
  'Cojín con diseño del logotipo de KOJIMA PRODUCTIONS

 	Mochila pequeña  original de la colaboracion de GU X Kojima Productions.

 	Ludens Peace Mark Unit



&nbsp;',
  null,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2302.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2303-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2309-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2308-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/F2635700-FD94-4CFC-8804-86E631D25B4A.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2304-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2305-rotated.jpg","https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2306.jpg"}',
  '{"death stranding","kojima productions"}',
  (select id from categories where slug = 'coleccionables' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16551,
  'Death Stranding Coleccionables - Morral',
  'death-stranding-coleccionables---morral',
  '',
  'simple',
  'published',
  '',
  '',
  175.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2303-rotated.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16552,
  'Death Stranding Coleccionables - Cojin',
  'death-stranding-coleccionables---cojin',
  '',
  'simple',
  'published',
  '',
  '',
  185.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2308-rotated.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;

insert into products (wc_id, name, slug, sku, type, status, short_description, description, regular_price, sale_price, in_stock, featured, images, tags, category_id)
values (
  16553,
  'Death Stranding Coleccionables - Llavero',
  'death-stranding-coleccionables---llavero',
  '',
  'simple',
  'published',
  '',
  '',
  750.0,
  null,
  true,
  false,
  '{"https://colecciones.grupo-gomez.com/wp-content/uploads/2025/02/IMG_2305-rotated.jpg"}',
  '{}',
  (select id from categories where slug = 'sin-categoria' limit 1)
) on conflict (slug) do nothing;


-- ─── STORAGE BUCKET FOR PRODUCT IMAGES ──────────────────────
-- Run this separately if needed:
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- create policy "Public read images" on storage.objects for select using (bucket_id = 'product-images');
-- create policy "Auth upload images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

