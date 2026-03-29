/**
 * thumbUrl.js
 * Deriva URLs de variantes a partir de la URL web de una imagen de producto.
 *
 * Convención de paths en Supabase Storage:
 *   Web:    product-images/products/<basename>.<ext>
 *   Thumb:  product-images/products/thumbs/<basename>.<ext>   (~20 KB, 200×200)
 *   Medium: product-images/products/medium/<basename>.<ext>   (~80 KB, 600px)
 *
 * Si la imagen no está en Supabase Storage (URL externa) devuelve la original.
 * Usar onError en <img> para fallback a la URL original si la variante no existe.
 */
// Las variantes (thumbs y medium) se guardan siempre como .webp en Supabase.
// La extensión de la imagen original puede ser .jpg, .png, etc. — no importa.

export function thumbUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  // Reemplaza extensión original por .webp y mueve a /thumbs/
  return clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/thumbs/$1.webp'
  )
}

/**
 * Variante medium (~80 KB, 600px) — para ProductCard de la tienda y slider.
 */
export function mediumUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/medium/$1.webp'
  )
}

export function thumbFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = originalUrl
  }
}

export function mediumFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = originalUrl
  }
}
