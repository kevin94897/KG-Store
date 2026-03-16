/**
 * ImageOptimizer.js
 * Optimiza y comprime imágenes a WebP con target de 500 KB.
 * Usa compresión adaptativa — baja calidad iterativamente hasta alcanzar el peso.
 */

// Target de peso máximo (500 KB)
const TARGET_SIZE = 500 * 1024

// Resolución máxima — 1200px es suficiente para e-commerce
const MAX_DIMENSION = 1200

// Calidad inicial WebP (irá bajando si es necesario)
const INITIAL_QUALITY = 0.82

// Calidad mínima permitida (no bajar de esto para no pixelar)
const MIN_QUALITY = 0.35

// Paso de reducción de calidad por iteración
const QUALITY_STEP = 0.08

// No optimizar si ya pesa menos que esto
const SKIP_THRESHOLD = 400 * 1024  // 400 KB

/**
 * Comprime un canvas a blob con calidad dada, retorna null si no es soportado
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

/**
 * Carga una imagen desde File y retorna el elemento Image
 */
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

/**
 * Calcula dimensiones respetando el aspect ratio
 */
function calcDimensions(width, height, maxDim) {
  if (width <= maxDim && height <= maxDim) return { width, height }
  const ratio = Math.min(maxDim / width, maxDim / height)
  return {
    width:  Math.round(width  * ratio),
    height: Math.round(height * ratio),
  }
}

/**
 * Optimiza una imagen a WebP con compresión adaptativa.
 * Baja la calidad iterativamente hasta alcanzar TARGET_SIZE.
 */
export async function optimizeImage(file) {
  // Si ya es suficientemente pequeña, no procesar
  if (file.size <= SKIP_THRESHOLD) {
    console.log(`[Optimizer] Saltando ${file.name} — ya pesa ${(file.size / 1024).toFixed(0)} KB`)
    return file
  }

  const originalSizeKB = (file.size / 1024).toFixed(0)
  console.log(`[Optimizer] Procesando ${file.name} — ${originalSizeKB} KB`)

  let img
  try {
    img = await loadImage(file)
  } catch (e) {
    console.warn('[Optimizer] No se pudo cargar, usando original:', e.message)
    return file
  }

  // Calcular dimensiones finales
  const { width, height } = calcDimensions(img.naturalWidth, img.naturalHeight, MAX_DIMENSION)

  // Crear canvas
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  // fondo blanco por si la imagen tiene transparencia
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // ── Compresión adaptativa WebP ────────────────────────────────
  let quality  = INITIAL_QUALITY
  let blob     = null
  let attempts = 0

  while (quality >= MIN_QUALITY) {
    attempts++
    blob = await canvasToBlob(canvas, 'image/webp', quality)

    if (!blob) break  // WebP no soportado, fallback abajo

    console.log(
      `[Optimizer] Intento ${attempts}: calidad=${quality.toFixed(2)} → ${(blob.size / 1024).toFixed(0)} KB`
    )

    if (blob.size <= TARGET_SIZE) break  // ✅ alcanzamos el target

    quality = parseFloat((quality - QUALITY_STEP).toFixed(2))
  }

  // ── Fallback a JPEG si WebP no está soportado ─────────────────
  if (!blob) {
    console.warn('[Optimizer] WebP no soportado, usando JPEG')
    quality = INITIAL_QUALITY
    while (quality >= MIN_QUALITY) {
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
      if (blob && blob.size <= TARGET_SIZE) break
      quality = parseFloat((quality - QUALITY_STEP).toFixed(2))
    }
    if (!blob) return file

    const jpegFile = new File(
      [blob],
      file.name.replace(/\.\w+$/, '.jpg'),
      { type: 'image/jpeg' }
    )
    const saving = ((1 - blob.size / file.size) * 100).toFixed(0)
    console.log(
      `[Optimizer] ✓ JPEG: ${(blob.size / 1024).toFixed(0)} KB — ${saving}% ahorro — ${width}×${height}px`
    )
    return jpegFile
  }

  // ── Si aún supera el target con MIN_QUALITY, bajar resolución ─
  if (blob.size > TARGET_SIZE) {
    console.warn(`[Optimizer] No alcanzó target con calidad mínima, reduciendo resolución`)

    // Escalar al 70% y reintentar
    const smallerDim = Math.round(MAX_DIMENSION * 0.7)
    const { width: w2, height: h2 } = calcDimensions(img.naturalWidth, img.naturalHeight, smallerDim)

    canvas.width  = w2
    canvas.height = h2
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w2, h2)
    ctx.drawImage(img, 0, 0, w2, h2)

    blob = await canvasToBlob(canvas, 'image/webp', MIN_QUALITY)
    if (!blob) blob = await canvasToBlob(canvas, 'image/jpeg', MIN_QUALITY)
    if (!blob) return file

    console.log(`[Optimizer] Reducido a ${w2}×${h2}px → ${(blob.size / 1024).toFixed(0)} KB`)
  }

  const optimizedFile = new File(
    [blob],
    file.name.replace(/\.\w+$/, '.webp'),
    { type: blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg' }
  )

  const finalKB  = (blob.size  / 1024).toFixed(0)
  const saving   = ((1 - blob.size / file.size) * 100).toFixed(0)
  console.log(
    `[Optimizer] ✓ ${file.name}: ${originalSizeKB} KB → ${finalKB} KB (${saving}% ahorro) ${width}×${height}px`
  )

  return optimizedFile
}

/**
 * Procesa múltiples archivos — secuencial para no saturar el hilo principal
 */
export async function optimizeImages(files) {
  const results = []
  for (const file of files) {
    const optimized = await optimizeImage(file)
    results.push(optimized)
  }
  return results
}