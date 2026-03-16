import { useEffect, useRef } from 'react'

/**
 * usePWA
 * ──────
 * 1. Registra el Service Worker
 * 2. Escucha mensajes del SW cuando llegan imágenes compartidas
 * 3. Llama a onSharedImages(files[]) cuando hay nuevas fotos
 */
export function usePWA({ onSharedImages } = {}) {
  const callbackRef = useRef(onSharedImages)
  callbackRef.current = onSharedImages

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Registrar el SW
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[PWA] SW registrado:', reg.scope)
      })
      .catch(err => {
        console.warn('[PWA] SW no pudo registrarse:', err)
      })

    // Escuchar mensajes del SW
    const handleMessage = async (event) => {
      // El SW avisa que llegaron imágenes compartidas
      if (event.data?.type === 'SHARED_IMAGES') {
        // Pedirle al SW los blobs
        navigator.serviceWorker.controller?.postMessage({
          type: 'GET_SHARED_IMAGES',
        })
      }

      // El SW responde con los blobs
      if (event.data?.type === 'SHARED_IMAGES_DATA') {
        const { images } = event.data
        if (!images?.length) return

        // Convertir blobs a File objects
        const files = images.map(img =>
          new File([img.blob], img.name, { type: img.type })
        )

        callbackRef.current?.(files)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])
}

/**
 * useSharedImagesOnLoad
 * ──────────────────────
 * Al cargar la página /productos/nuevo?shared=1,
 * pide inmediatamente las imágenes pendientes al SW.
 */
export function useSharedImagesOnLoad({ onSharedImages } = {}) {
  const callbackRef = useRef(onSharedImages)
  callbackRef.current = onSharedImages

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('shared')) return
    if (!('serviceWorker' in navigator)) return

    // Limpiar el param de la URL sin recargar
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, '', cleanUrl)

    const handleMessage = async (event) => {
      if (event.data?.type !== 'SHARED_IMAGES_DATA') return

      const { images } = event.data
      if (!images?.length) return

      const files = images.map(img =>
        new File([img.blob], img.name, { type: img.type })
      )
      callbackRef.current?.(files)

      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // Esperar a que el SW esté listo y pedir las imágenes
    navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: 'GET_SHARED_IMAGES',
      })
    })

    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [])
}
