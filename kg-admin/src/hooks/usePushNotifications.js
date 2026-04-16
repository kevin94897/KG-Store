import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

async function saveSubscription(subscription) {
  const json = subscription.toJSON()
  await supabase.from('push_subscriptions').upsert(
    { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    { onConflict: 'endpoint' },
  )
}

/**
 * Solicita permiso de notificaciones y registra la suscripción push.
 * Solo activo si VITE_VAPID_PUBLIC_KEY está definido en .env
 */
export function usePushNotifications() {
  const [status, setStatus] = useState('idle') // idle | requesting | subscribed | denied | unsupported

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY no definida. Notificaciones desactivadas.')
      return
    }

    let cancelled = false

    const subscribe = async () => {
      try {
        const reg = await navigator.serviceWorker.ready

        // Ya tiene suscripción activa → solo guardar/actualizar en DB
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          await saveSubscription(existing)
          if (!cancelled) setStatus('subscribed')
          return
        }

        // Pedir permiso
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          if (!cancelled) setStatus('denied')
          return
        }

        if (!cancelled) setStatus('requesting')

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await saveSubscription(sub)
        if (!cancelled) setStatus('subscribed')
      } catch (e) {
        console.error('[Push] Error al suscribir:', e)
      }
    }

    subscribe()
    return () => { cancelled = true }
  }, [])

  return status
}
