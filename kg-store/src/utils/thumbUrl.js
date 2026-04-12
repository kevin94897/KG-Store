/**
 * Deriva URLs de variantes desde la URL web almacenada en la BD.
 *
 * Web:    products/<basename>.<ext>          (≤300 KB, 900px)
 * Medium: products/medium/<basename>.<ext>   (~80 KB,  600px) — para cards y slider
 * Thumb:  products/thumbs/<basename>.<ext>   (~20 KB,  200px) — para listas pequeñas
 *
 * Si VITE_CDN_URL está definido, el hostname de Supabase se reemplaza por el CDN
 * (Cloudflare Worker) para reducir egress.
 */

const SUPABASE_BASE = 'https://jkwndsbhrycyqwweungi.supabase.co'
const CDN_BASE = import.meta.env.VITE_CDN_URL || SUPABASE_BASE

function toCdn(url) {
  if (!url || !CDN_BASE || CDN_BASE === SUPABASE_BASE) return url
  return url.replace(SUPABASE_BASE, CDN_BASE)
}

// Full-size pero servida por CDN (para fullscreen/zoom)
export function cdnUrl(url) {
  if (!url) return null
  return toCdn(url.split('?')[0])
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

export function thumbUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return toCdn(clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/thumbs/$1.webp'
  ))
}

export function mediumFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = toCdn(originalUrl)
  }
}

export function thumbFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = mediumUrl(originalUrl) || toCdn(originalUrl)
  }
}
