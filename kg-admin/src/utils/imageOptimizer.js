/**
 * Optimiza y comprime imágenes, convirtiendo a WebP
 * Ideal para fotos de iPhone que suelen ser muy pesadas
 */

// Tamaño máximo permitido en bytes (2 MB)
const MAX_SIZE = 2 * 1024 * 1024

// Resolución máxima (ancho o alto)
const MAX_DIMENSION = 1920

// Calidad de compresión WebP (0-1)
const WEBP_QUALITY = 0.75

export async function optimizeImage(file) {
  // Si el archivo es pequeño, devuelve tal cual
  if (file.size < 500 * 1024) {
    // Menos de 500 KB, no optimizar
    return file
  }

  console.log(`[ImageOptimizer] Optimizando ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // Crear canvas con dimensiones optimizadas
          const canvas = document.createElement('canvas')
          let { width, height } = img
          
          // Reducir dimensiones si son muy grandes
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          
          canvas.width = width
          canvas.height = height
          
          // Dibujar imagen escalada en el canvas
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convertir a Blob WebP
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback a PNG si WebP no es soportado
                canvas.toBlob(
                  (pngBlob) => {
                    const optimizedFile = new File([pngBlob], file.name.replace(/\.\w+$/, '.png'), {
                      type: 'image/png'
                    })
                    console.log(`[ImageOptimizer] Comprimido a PNG: ${(pngBlob.size / 1024 / 1024).toFixed(2)} MB`)
                    resolve(optimizedFile)
                  },
                  'image/png',
                  0.85
                )
                return
              }
              
              const optimizedFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
                type: 'image/webp'
              })
              
              const compression = ((1 - blob.size / file.size) * 100).toFixed(1)
              console.log(`[ImageOptimizer] ✓ Comprimido a WebP: ${(blob.size / 1024 / 1024).toFixed(2)} MB (${compression}% ahorro)`)
              resolve(optimizedFile)
            },
            'image/webp',
            WEBP_QUALITY
          )
        } catch (error) {
          console.error('[ImageOptimizer] Error procesando:', error)
          // Si hay error, usar el archivo original
          resolve(file)
        }
      }
      
      img.onerror = () => {
        console.error('[ImageOptimizer] No se pudo cargar la imagen')
        resolve(file)
      }
      
      img.src = event.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('Error al leer archivo'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Procesa múltiples archivos en paralelo
 */
export async function optimizeImages(files) {
  return Promise.all(files.map(file => optimizeImage(file)))
}
