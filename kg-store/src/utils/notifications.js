import { supabase } from './supabase'

/**
 * Envía una push notification al panel de administración.
 * Silencia errores — nunca bloquea el flujo principal.
 */
export const sendAdminPush = (title, body, url) =>
  supabase.functions
    .invoke('send-push-notification', { body: { title, body, url } })
    .catch(console.error)
