/**
 * thumbUrl.js
 * Deriva URLs de variantes a partir de la URL web de una imagen de producto.
 *
 * Convención de paths en Supabase Storage:
 *   Web:    product-images/products/<basename>.<ext>
 *   Thumb:  product-images/products/thumbs/<basename>.<ext>   (~20 KB, 200×200)
 *   Medium: product-images/products/medium/<basename>.<ext>   (~80 KB, 600px)
 *
 * Si VITE_CDN_URL está definido, el hostname de Supabase se reemplaza por el CDN
 * (Cloudflare Worker) para reducir egress a cero.
 */

const SUPABASE_BASE = 'https://jkwndsbhrycyqwweungi.supabase.co'
const CDN_BASE = import.meta.env.VITE_CDN_URL || SUPABASE_BASE

function toCdn(url) {
  if (!url || CDN_BASE === SUPABASE_BASE) return url
  return url.replace(SUPABASE_BASE, CDN_BASE)
}

export function thumbUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return toCdn(clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/thumbs/$1.webp'
  ))
}

export function mediumUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return toCdn(clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/medium/$1.webp'
  ))
}

export function thumbFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = mediumUrl(originalUrl) || toCdn(originalUrl)
  }
}

export function mediumFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = toCdn(originalUrl)
  }
}
