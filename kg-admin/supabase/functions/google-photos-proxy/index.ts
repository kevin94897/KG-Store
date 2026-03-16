// supabase/functions/google-photos-proxy/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { fileId, mimeType, accessToken, thumbnailUrl } = body

    console.log('[proxy] Request received:', {
      fileId,
      mimeType,
      hasThumbnail: !!thumbnailUrl,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
    })

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'accessToken requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'fileId requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let imageBlob: Blob | null = null
    const errors: string[] = []

    // ── Estrategia 1: thumbnail URL en alta resolución ─────
    if (thumbnailUrl) {
      try {
        // Reemplazar tamaño por w2048 para máxima resolución
        const highResUrl = thumbnailUrl.replace(/=[swh]\d+(-h\d+)?.*$/, '=w2048')
        console.log('[proxy] Strategy 1 - thumbnail URL:', highResUrl.substring(0, 80))

        const res = await fetch(highResUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        console.log('[proxy] Strategy 1 status:', res.status, res.statusText)

        if (res.ok) {
          imageBlob = await res.blob()
          console.log('[proxy] Strategy 1 success, size:', imageBlob.size)
        } else {
          const errText = await res.text().catch(() => '')
          errors.push(`Strategy1(thumbnail): ${res.status} ${errText.substring(0, 100)}`)
        }
      } catch (e) {
        errors.push(`Strategy1(thumbnail) exception: ${e.message}`)
        console.error('[proxy] Strategy 1 exception:', e.message)
      }
    }

    // ── Estrategia 2: Drive API media download ─────────────
    if (!imageBlob) {
      try {
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
        console.log('[proxy] Strategy 2 - Drive API:', driveUrl)

        const res = await fetch(driveUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        console.log('[proxy] Strategy 2 status:', res.status, res.statusText)

        if (res.ok) {
          imageBlob = await res.blob()
          console.log('[proxy] Strategy 2 success, size:', imageBlob.size)
        } else {
          const errText = await res.text().catch(() => '')
          errors.push(`Strategy2(drive): ${res.status} ${errText.substring(0, 200)}`)
          console.error('[proxy] Strategy 2 error body:', errText.substring(0, 200))
        }
      } catch (e) {
        errors.push(`Strategy2(drive) exception: ${e.message}`)
        console.error('[proxy] Strategy 2 exception:', e.message)
      }
    }

    // ── Estrategia 3: Photos Library API mediaItems ────────
    if (!imageBlob) {
      try {
        const metaUrl = `https://photoslibrary.googleapis.com/v1/mediaItems/${fileId}`
        console.log('[proxy] Strategy 3 - Photos Library API:', metaUrl)

        const metaRes = await fetch(metaUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        console.log('[proxy] Strategy 3 meta status:', metaRes.status)

        if (metaRes.ok) {
          const meta = await metaRes.json()
          console.log('[proxy] Strategy 3 meta response keys:', Object.keys(meta))

          if (meta.baseUrl) {
            // =d para máxima resolución sin expiración
            const imgRes = await fetch(`${meta.baseUrl}=d`)
            console.log('[proxy] Strategy 3 image download status:', imgRes.status)
            if (imgRes.ok) {
              imageBlob = await imgRes.blob()
              console.log('[proxy] Strategy 3 success, size:', imageBlob.size)
            } else {
              errors.push(`Strategy3(photos baseUrl download): ${imgRes.status}`)
            }
          } else {
            errors.push(`Strategy3(photos): no baseUrl in response`)
          }
        } else {
          const errText = await metaRes.text().catch(() => '')
          errors.push(`Strategy3(photos meta): ${metaRes.status} ${errText.substring(0, 200)}`)
          console.error('[proxy] Strategy 3 error:', errText.substring(0, 200))
        }
      } catch (e) {
        errors.push(`Strategy3(photos) exception: ${e.message}`)
        console.error('[proxy] Strategy 3 exception:', e.message)
      }
    }

    // ── Sin imagen ─────────────────────────────────────────
    if (!imageBlob || imageBlob.size < 100) {
      console.error('[proxy] All strategies failed:', errors)
      return new Response(
        JSON.stringify({
          error: 'No se pudo descargar la imagen de Google',
          details: errors,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Subir a Supabase Storage ───────────────────────────
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!

    if (!supabaseServiceKey) {
      console.error('[proxy] SERVICE_ROLE_KEY not set!')
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta (SERVICE_ROLE_KEY)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)

    const ext      = (mimeType || imageBlob.type || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    const filename = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    console.log('[proxy] Uploading to Storage:', filename, 'size:', imageBlob.size)

    const arrayBuffer = await imageBlob.arrayBuffer()
    const { error: uploadError } = await sb.storage
      .from('product-images')
      .upload(filename, arrayBuffer, {
        contentType: mimeType || imageBlob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[proxy] Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Error subiendo a Storage: ' + uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: urlData } = sb.storage
      .from('product-images')
      .getPublicUrl(filename)

    console.log('[proxy] Success! publicUrl:', urlData.publicUrl)

    return new Response(
      JSON.stringify({ publicUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[proxy] Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
