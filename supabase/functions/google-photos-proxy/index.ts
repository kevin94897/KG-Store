// supabase/functions/google-photos-proxy/index.ts
// ─────────────────────────────────────────────────────────────
// Edge Function que actúa como proxy para descargar imágenes
// de Google Photos/Drive y subirlas a Supabase Storage.
// Evita el bloqueo CORS que Google impone en el navegador.
// ─────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  mediaItemId?: string
  fileId?: string
  mimeType?: string
  accessToken: string
  thumbnailUrl?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { mediaItemId, fileId, mimeType, accessToken, thumbnailUrl } = body

    console.log('[google-photos-proxy] Request received:', {
      hasMediaItemId: !!mediaItemId,
      hasFileId: !!fileId,
      hasAccessToken: !!accessToken,
      hasThumbnailUrl: !!thumbnailUrl,
      mimeType,
    })

    if (!accessToken) {
      console.error('[google-photos-proxy] Missing accessToken')
      return new Response(
        JSON.stringify({ error: 'accessToken requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let imageBlob: Blob | null = null
    let downloadStrategy = 'none'

    // ── Estrategia 1: Google Photos Library API (PRINCIPAL) ──
    // Usa mediaItemId del Google Photos Picker
    // NO requiere auth para descargar (baseUrl es público después de =d)
    if (!imageBlob && mediaItemId) {
      downloadStrategy = 'photos-library-api'
      console.log('[google-photos-proxy] Trying Photos Library API with mediaItemId:', mediaItemId)
      try {
        const metaRes = await fetch(
          `https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`,
          { 
            headers: { Authorization: `Bearer ${accessToken}` },
            method: 'GET',
          }
        )

        console.log('[google-photos-proxy] Photos Library API response status:', metaRes.status)

        if (metaRes.ok) {
          const meta = await metaRes.json()
          console.log('[google-photos-proxy] Media metadata:', {
            hasBaseUrl: !!meta.baseUrl,
            mimeType: meta.mimeType,
          })

          if (meta.baseUrl) {
            // baseUrl + '=d' para descarga de máxima calidad
            // NO requiere Bearer token - es una URL pública firmada
            const downloadUrl = `${meta.baseUrl}=d`
            console.log('[google-photos-proxy] Downloading from baseUrl...')

            const imgRes = await fetch(downloadUrl)
            console.log('[google-photos-proxy] Download response status:', imgRes.status)

            if (imgRes.ok) {
              imageBlob = await imgRes.blob()
              console.log('[google-photos-proxy] Successfully downloaded image, size:', imageBlob.size)
            } else {
              const errBody = await imgRes.text()
              console.error('[google-photos-proxy] Download failed:', imgRes.status, errBody)
            }
          }
        } else {
          const errBody = await metaRes.text()
          console.error('[google-photos-proxy] Photos Library API error:', metaRes.status, errBody)
        }
      } catch (e) {
        console.error('[google-photos-proxy] Photos Library API exception:', e.message)
      }
    }

    // ── Estrategia 2: Drive API (fallback si viene fileId) ──
    // Solo si el cliente explícitamente envía Drive fileId (no de Photos Picker)
    if (!imageBlob && fileId && !mediaItemId) {
      downloadStrategy = 'drive-api'
      console.log('[google-photos-proxy] Trying Drive API with fileId:', fileId)
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { 
            headers: { Authorization: `Bearer ${accessToken}` },
            method: 'GET',
          }
        )
        console.log('[google-photos-proxy] Drive API response status:', res.status)

        if (res.ok) {
          imageBlob = await res.blob()
          console.log('[google-photos-proxy] Successfully downloaded from Drive, size:', imageBlob.size)
        } else {
          const errText = await res.text()
          console.error('[google-photos-proxy] Drive API error:', res.status, errText)
        }
      } catch (e) {
        console.error('[google-photos-proxy] Drive API exception:', e.message)
      }
    }

    // ── Estrategia 3: Thumbnail URL como último recurso ──
    // IMPORTANTE: NO pasar Bearer token a URLs públicas de Google
    if (!imageBlob && thumbnailUrl) {
      downloadStrategy = 'thumbnail-url'
      console.log('[google-photos-proxy] Trying thumbnail URL (without auth)...')
      try {
        // Las URLs de Google Photos ya son firmadas y NO necesitan Bearer token
        // Si la URL ya tiene parámetros =w###, los reemplazamos para mayor resolución
        const highResUrl = thumbnailUrl.includes('=w')
          ? thumbnailUrl.replace(/=w\d+/, '=w2048')
          : `${thumbnailUrl}=w2048`

        const res = await fetch(highResUrl, { method: 'GET' })
        console.log('[google-photos-proxy] Thumbnail response status:', res.status)

        if (res.ok) {
          imageBlob = await res.blob()
          console.log('[google-photos-proxy] Successfully downloaded thumbnail, size:', imageBlob.size)
        } else {
          console.error('[google-photos-proxy] Thumbnail download failed:', res.status)
        }
      } catch (e) {
        console.error('[google-photos-proxy] Thumbnail download exception:', e.message)
      }
    }

    if (!imageBlob || imageBlob.size < 100) {
      console.error('[google-photos-proxy] Download failed - no image blob or too small', {
        strategy: downloadStrategy,
        blobSize: imageBlob?.size || 0,
      })
      return new Response(
        JSON.stringify({
          error: 'No se pudo descargar la imagen de Google Photos/Drive.',
          details: {
            strategy: downloadStrategy,
            blobSize: imageBlob?.size || 0,
            hint: mediaItemId 
              ? 'mediaItemId provided but API returned no usable image'
              : fileId
              ? 'fileId provided but Drive API rejected it'
              : 'No mediaItemId or fileId in request',
          },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // ── Subir a Supabase Storage ───────────────────────────
    console.log('[google-photos-proxy] Uploading image to Supabase Storage...')
    
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[google-photos-proxy] Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Servidor mal configurado - env vars faltantes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)

    const ext = (mimeType || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const filename = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    console.log('[google-photos-proxy] Uploading file:', { filename, contentType: mimeType })

    const arrayBuffer = await imageBlob.arrayBuffer()
    const { error: uploadError } = await sb.storage
      .from('product-images')
      .upload(filename, arrayBuffer, {
        contentType: mimeType || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[google-photos-proxy] Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Error subiendo a Storage: ' + uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[google-photos-proxy] Upload successful:', filename)

    const { data: urlData } = sb.storage
      .from('product-images')
      .getPublicUrl(filename)

    console.log('[google-photos-proxy] Generated public URL:', urlData.publicUrl)

    return new Response(
      JSON.stringify({ publicUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[google-photos-proxy] Unhandled exception:', {
      message: err.message,
      stack: err.stack,
    })
    return new Response(
      JSON.stringify({ 
        error: err.message,
        type: err.constructor.name,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
