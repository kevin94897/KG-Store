/**
 * Deriva URLs de variantes desde la URL web almacenada en la BD.
 *
 * Web:    products/<basename>.<ext>          (≤300 KB, 900px)
 * Medium: products/medium/<basename>.<ext>   (~80 KB,  600px) — para cards y slider
 * Thumb:  products/thumbs/<basename>.<ext>   (~20 KB,  200px) — para listas pequeñas
 */
// Las variantes se guardan siempre como .webp — extensión original no importa.

export function mediumUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/medium/$1.webp'
  )
}

export function thumbUrl(url) {
  if (!url) return null
  if (!url.includes('/storage/v1/object/public/')) return url
  const clean = url.split('?')[0]
  return clean.replace(
    /\/products\/(?!thumbs\/|medium\/)([^/]+)\.\w+$/,
    '/products/thumbs/$1.webp'
  )
}

export function mediumFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    e.currentTarget.src = originalUrl
  }
}

export function thumbFallback(originalUrl) {
  return (e) => {
    e.currentTarget.onerror = null
    // Intenta medium antes de ir al full
    e.currentTarget.src = mediumUrl(originalUrl) || originalUrl
  }
}
