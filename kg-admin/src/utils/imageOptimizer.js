/**
 * imageOptimizer.js
 * Genera tres variantes por imagen:
 *   - webFile:    ≤300 KB, máx 900px  → galería del producto (guardada en BD)
 *   - mediumFile: ~80 KB,  máx 600px  → ProductCard de la tienda y slider
 *   - thumbFile:  ~20 KB,  200×200px  → listas del admin
 *
 * Detecta soporte de encoding WebP (falla en iOS <16) y usa JPEG como fallback.
 *
 * API pública:
 *   optimizeImage(file)              → { webFile, thumbFile, mediumFile }
 *   optimizeImages(files)            → [{ webFile, thumbFile, mediumFile }, ...]
 *   generateAllVariantsFromUrl(url)  → { webFile, thumbFile, mediumFile } — para migración
 */

// ── Web variant ────────────────────────────────────────────────────
const WEB_TARGET_SIZE   = 300 * 1024
const WEB_INIT_QUALITY  = 0.82
const WEB_MIN_QUALITY   = 0.30
const WEB_QUALITY_STEP  = 0.08
const WEB_SKIP_BYTES    = 280 * 1024
const WEB_RES_STEPS     = [900, 720, 600, 480]

// ── Medium variant ─────────────────────────────────────────────────
const MEDIUM_TARGET_SIZE = 80 * 1024
const MEDIUM_SKIP_BYTES  = 70 * 1024
const MEDIUM_RES_STEPS   = [600, 480, 360]
const MEDIUM_INIT_QUALITY = 0.78
const MEDIUM_MIN_QUALITY  = 0.30
const MEDIUM_QUALITY_STEP = 0.08

// ── Thumb variant ──────────────────────────────────────────────────
const THUMB_SIZE        = 200
const THUMB_QUALITY     = 0.65
const THUMB_TARGET_SIZE = 20 * 1024

// ──────────────────────────────────────────────────────────────────

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload  = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Error al leer archivo'))
    reader.readAsDataURL(file)
  })
}

function calcDimensions(width, height, maxDim) {
  if (width <= maxDim && height <= maxDim) return { width, height }
  const ratio = Math.min(maxDim / width, maxDim / height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

function drawToCanvas(canvas, img, width, height) {
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
}

// ── Detección de soporte WebP (iOS <16 falla en encoding) ──────────
let _webpSupported = null
async function supportsWebpEncoding() {
  if (_webpSupported !== null) return _webpSupported
  try {
    const c = document.createElement('canvas')
    c.width = 4; c.height = 4
    const blob = await canvasToBlob(c, 'image/webp', 0.8)
    _webpSupported = blob?.type === 'image/webp'
  } catch {
    _webpSupported = false
  }
  if (!_webpSupported) console.warn('[Optimizer] WebP encoding no soportado — usando JPEG')
  return _webpSupported
}

// ── Thumb (200×200 crop cuadrado centrado) ─────────────────────────
async function generateThumb(img, useWebp) {
  const canvas = document.createElement('canvas')
  canvas.width  = THUMB_SIZE
  canvas.height = THUMB_SIZE
  const ctx = canvas.getContext('2d')

  const src = Math.min(img.naturalWidth, img.naturalHeight)
  const sx  = (img.naturalWidth  - src) / 2
  const sy  = (img.naturalHeight - src) / 2

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE)
  ctx.drawImage(img, sx, sy, src, src, 0, 0, THUMB_SIZE, THUMB_SIZE)

  const fmt = useWebp ? 'image/webp' : 'image/jpeg'
  let blob = await canvasToBlob(canvas, fmt, THUMB_QUALITY)

  // Si aún supera el cap, bajar calidad
  if (blob && blob.size > THUMB_TARGET_SIZE) {
    const lower = await canvasToBlob(canvas, fmt, 0.45)
    if (lower && lower.size < blob.size) blob = lower
  }

  if (!blob) return null
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  console.log(`[Optimizer] thumb: ${(blob.size / 1024).toFixed(1)} KB — ${THUMB_SIZE}×${THUMB_SIZE}px`)
  return new File([blob], `thumb.${ext}`, { type: blob.type })
}

// ── Medium (≤600px, ~80 KB) ────────────────────────────────────────
async function generateMedium(img, originalSize, baseName, useWebp) {
  const fmt = useWebp ? 'image/webp' : 'image/jpeg'
  const ext = useWebp ? 'webp' : 'jpg'
  const outName = baseName.replace(/\.\w+$/, `.${ext}`)

  if (originalSize <= MEDIUM_SKIP_BYTES) {
    // Imagen ya pequeña: solo redimensionar al máximo si hace falta
    const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, 600)
    const canvas = document.createElement('canvas')
    drawToCanvas(canvas, img, width, height)
    const blob = await canvasToBlob(canvas, fmt, MEDIUM_INIT_QUALITY)
    if (blob) return new File([blob], outName, { type: blob.type })
    return null
  }

  const canvas = document.createElement('canvas')
  let blob = null

  for (const maxDim of MEDIUM_RES_STEPS) {
    const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, maxDim)
    drawToCanvas(canvas, img, width, height)

    let quality = MEDIUM_INIT_QUALITY
    while (quality >= MEDIUM_MIN_QUALITY) {
      blob = await canvasToBlob(canvas, fmt, quality)
      if (!blob) break
      console.log(`[Optimizer] Medium ${maxDim}px q=${quality.toFixed(2)} → ${(blob.size / 1024).toFixed(0)} KB`)
      if (blob.size <= MEDIUM_TARGET_SIZE) {
        console.log(`[Optimizer] ✓ Medium: ${(blob.size / 1024).toFixed(0)} KB — ${width}×${height}px`)
        return new File([blob], outName, { type: blob.type })
      }
      quality = parseFloat((quality - MEDIUM_QUALITY_STEP).toFixed(2))
    }
    if (!blob) break
  }

  if (blob) return new File([blob], outName, { type: blob.type })
  return null
}

// ── Web variant (≤900px, ≤300 KB) ─────────────────────────────────
async function generateWeb(img, originalFile, useWebp) {
  const fmt = useWebp ? 'image/webp' : 'image/jpeg'
  const ext = useWebp ? 'webp' : 'jpg'
  const outName = originalFile.name.replace(/\.\w+$/, `.${ext}`)

  if (originalFile.size <= WEB_SKIP_BYTES) {
    console.log(`[Optimizer] Web: saltando — ya pesa ${(originalFile.size / 1024).toFixed(0)} KB`)
    return new File([originalFile], outName, { type: originalFile.type })
  }

  const originalSizeKB = (originalFile.size / 1024).toFixed(0)
  console.log(`[Optimizer] Web: procesando ${originalFile.name} — ${originalSizeKB} KB`)

  const canvas = document.createElement('canvas')
  let blob = null

  for (const maxDim of WEB_RES_STEPS) {
    const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, maxDim)
    drawToCanvas(canvas, img, width, height)

    let quality = WEB_INIT_QUALITY
    while (quality >= WEB_MIN_QUALITY) {
      blob = await canvasToBlob(canvas, fmt, quality)
      if (!blob) break
      console.log(`[Optimizer] Web ${maxDim}px q=${quality.toFixed(2)} → ${(blob.size / 1024).toFixed(0)} KB`)
      if (blob.size <= WEB_TARGET_SIZE) {
        const saving = ((1 - blob.size / originalFile.size) * 100).toFixed(0)
        console.log(`[Optimizer] ✓ Web: ${originalSizeKB} KB → ${(blob.size / 1024).toFixed(0)} KB (${saving}%) ${width}×${height}px`)
        return new File([blob], outName, { type: blob.type })
      }
      quality = parseFloat((quality - WEB_QUALITY_STEP).toFixed(2))
    }
    if (!blob) break
  }

  // Entregar mejor resultado
  if (blob) {
    console.warn(`[Optimizer] Web: mejor resultado disponible: ${(blob.size / 1024).toFixed(0)} KB`)
    return new File([blob], outName, { type: blob.type })
  }
  return new File([originalFile], outName, { type: originalFile.type })
}

// ──────────────────────────────────────────────────────────────────

/**
 * Optimiza un archivo de imagen.
 * Retorna { webFile, thumbFile, mediumFile }
 */
export async function optimizeImage(file) {
  const useWebp = await supportsWebpEncoding()
  let img
  try {
    img = await loadImage(file)
  } catch (e) {
    console.warn('[Optimizer] No se pudo cargar, usando original:', e.message)
    return { webFile: file, thumbFile: null, mediumFile: null }
  }

  const [thumbFile, mediumFile, webFile] = await Promise.all([
    generateThumb(img, useWebp),
    generateMedium(img, file.size, file.name, useWebp),
    generateWeb(img, file, useWebp),
  ])

  return { webFile, thumbFile, mediumFile }
}

/**
 * Procesa múltiples archivos de forma secuencial.
 * Retorna [{ webFile, thumbFile, mediumFile }, ...]
 */
export async function optimizeImages(files) {
  const results = []
  for (const file of files) {
    results.push(await optimizeImage(file))
  }
  return results
}

/**
 * Descarga una imagen desde URL pública y genera las tres variantes.
 * Usado para la migración de imágenes ya subidas.
 * Retorna { webFile, thumbFile, mediumFile } — alguno puede ser null si falla.
 */
export async function generateAllVariantsFromUrl(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) throw new Error('No es imagen')

    const useWebp = await supportsWebpEncoding()
    const file = new File([blob], 'source', { type: blob.type })
    const img  = await loadImage(file)

    const [thumbFile, mediumFile, webFile] = await Promise.all([
      generateThumb(img, useWebp),
      generateMedium(img, blob.size, 'source', useWebp),
      generateWeb(img, file, useWebp),
    ])

    return { webFile, thumbFile, mediumFile }
  } catch (e) {
    console.warn('[Optimizer] generateAllVariantsFromUrl failed:', e.message)
    return { webFile: null, thumbFile: null, mediumFile: null }
  }
}

/**
 * @deprecated Usar generateAllVariantsFromUrl en su lugar.
 */
export async function generateThumbFromUrl(url) {
  const { thumbFile } = await generateAllVariantsFromUrl(url)
  return thumbFile
}
