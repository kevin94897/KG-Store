# KG Store — Ecosistema completo

Proyecto completo con 3 partes:

```
kg-store/      → Frontend público (tienda) — React + Vite + Tailwind
kg-admin/      → Dashboard admin (móvil) — React + Vite + Tailwind
supabase_seed.sql → Schema + datos migrados desde WooCommerce
```

---

## 🗄️ 1. Configurar Supabase

### Paso 1 — Ejecutar el SQL

1. Ve a [supabase.com](https://supabase.com) → tu proyecto `jkwndsbhrycyqwweungi`
2. Abre **SQL Editor**
3. Pega y ejecuta el contenido de `supabase_seed.sql`

Esto crea:
- Tabla `categories` (con tus 3 categorías)
- Tabla `products` (con tus 24 productos migrados de WooCommerce)
- Tabla `orders` (para pedidos)
- Políticas RLS (lectura pública, escritura para usuarios auth)
- Triggers `updated_at`

### Paso 2 — Crear bucket de imágenes

En Supabase → **Storage** → New Bucket:
- Name: `product-images`
- Public: ✅ activado

### Paso 3 — Obtener la Anon Key

En Supabase → **Settings → API** → copia la `anon / public key`

---

## ⚙️ 2. Variables de entorno

Crea un archivo `.env` en cada proyecto:

```bash
# kg-store/.env
VITE_SUPABASE_URL=https://jkwndsbhrycyqwweungi.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# kg-admin/.env
VITE_SUPABASE_URL=https://jkwndsbhrycyqwweungi.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

---

## 🚀 3. Instalar y correr

### Tienda (frontend público)
```bash
cd kg-store
npm install
npm run dev   # http://localhost:5174
```

### Admin dashboard
```bash
cd kg-admin
npm install
npm run dev   # http://localhost:5175
```

Desde tu celular (mismo WiFi): `http://TU_IP:5175`

---

## 🔐 4. Crear cuenta de admin en Supabase

1. En Supabase → **Authentication → Users** → **Add user**
2. Crea tu usuario con email y contraseña
3. Usa esas credenciales para entrar al dashboard admin

---

## 🏗️ 5. Build para producción

```bash
cd kg-store && npm run build    # → kg-store/dist/
cd kg-admin && npm run build    # → kg-admin/dist/
```

Sube cada `dist/` a Vercel, Netlify, o cualquier hosting.

**Vercel (recomendado):**
```bash
npm i -g vercel
cd kg-store && vercel --prod
cd kg-admin && vercel --prod
```

---

## 📱 Funciones del Admin Dashboard

| Pantalla | Funciones |
|----------|-----------|
| Dashboard | Stats (productos, stock), accesos rápidos, últimos productos |
| Productos | Lista con búsqueda/filtros, crear, editar, eliminar |
| Nuevo/Editar producto | 5 secciones: General, Precio, Stock, Imágenes, Categoría |
| Imágenes | Cámara directa + galería, upload a Supabase Storage |
| Categorías | CRUD completo |
| Pedidos | Crear, ver, cambiar estado, contacto por WhatsApp |

## 🛍️ Funciones de la Tienda

| Pantalla | Funciones |
|----------|-----------|
| Home | Hero, categorías, productos recientes, banner de cuotas |
| Tienda | Grid de productos, filtros por categoría, búsqueda |
| Producto | Galería con swipe, precio, stock, tags, CTA WhatsApp |

---

## 📦 Stack

- React 18 + Vite + Tailwind CSS 3
- Supabase (PostgreSQL + Auth + Storage + Row Level Security)
- Fuente: Manrope
- React Router v6
