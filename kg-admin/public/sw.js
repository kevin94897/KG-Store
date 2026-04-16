// ─── KG Admin Service Worker ─────────────────────────────────
// Maneja Web Share Target: cuando el usuario comparte una imagen
// desde Google Photos (u otra app) al admin, este SW intercepta
// el POST, guarda las imágenes en un store temporal y redirige
// a la app para que las procese.

const CACHE_NAME = 'kg-admin-v1'
const SHARE_STORE = 'shared-images'

// ─── Instalación ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ─── Interceptar Share Target POST ───────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo interceptar el endpoint de compartir
  if (url.pathname === '/compartir' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request))
    return
  }

  // ⚠️ NO interceptar requests externos — dejar pasar sin modificar:
  // - Supabase Storage (subida de imágenes)
  // - Supabase Edge Functions
  // - Google APIs
  // - Cualquier origen distinto al propio
  const isExternal = url.origin !== self.location.origin
  if (isExternal) {
    // Dejar que el navegador maneje directamente sin SW
    return
  }

  // Para requests internos (assets, páginas), red normal
  event.respondWith(fetch(event.request))
})

async function handleShareTarget(request) {
  try {
    const formData = await request.formData()

    // Extraer archivos compartidos
    const files = formData.getAll('images')
    const imageFiles = files.filter(f => f instanceof File && f.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      // Guardar en Cache API como blobs temporales con timestamp
      const cache = await caches.open(SHARE_STORE)
      const timestamp = Date.now()

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const key  = `/shared-image-${timestamp}-${i}`
        const resp = new Response(file, {
          headers: {
            'Content-Type': file.type,
            'X-File-Name':  file.name || `shared-${i}.jpg`,
            'X-Timestamp':  timestamp.toString(),
          }
        })
        await cache.put(key, resp)
      }

      // Notificar a todos los clientes abiertos
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) {
        client.postMessage({
          type: 'SHARED_IMAGES',
          count: imageFiles.length,
          timestamp,
        })
      }
    }

    // Redirigir a la página de nuevo producto
    return Response.redirect('/productos/nuevo?shared=1', 303)

  } catch (err) {
    console.error('[SW] Error en share target:', err)
    return Response.redirect('/productos/nuevo', 303)
  }
}

// ─── Web Push ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'KG Admin'
  const options = {
    body: data.body || '',
    icon: '/icons/192.png',
    badge: '/icons/192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

// ─── Leer imágenes compartidas (llamado desde la app) ─────────
self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'GET_SHARED_IMAGES') return

  try {
    const cache   = await caches.open(SHARE_STORE)
    const keys    = await cache.keys()
    const results = []

    // Solo imágenes del último lote (últimos 60 segundos)
    const cutoff = Date.now() - 60_000

    for (const req of keys) {
      const resp = await cache.match(req)
      if (!resp) continue

      const ts = parseInt(resp.headers.get('X-Timestamp') || '0')
      if (ts < cutoff) {
        // Limpiar imágenes antiguas
        await cache.delete(req)
        continue
      }

      const blob = await resp.blob()
      const name = resp.headers.get('X-File-Name') || 'shared.jpg'

      results.push({ blob, name, type: blob.type, key: req.url })
    }

    // Responder al cliente con los blobs
    event.source?.postMessage({
      type: 'SHARED_IMAGES_DATA',
      images: results,
    })

    // Limpiar cache después de entregarlas
    for (const r of results) {
      await cache.delete(r.key)
    }

  } catch (err) {
    console.error('[SW] Error leyendo shared images:', err)
    event.source?.postMessage({ type: 'SHARED_IMAGES_DATA', images: [] })
  }
})