/**
 * Vercel Edge Middleware — OG meta tags para crawlers de redes sociales.
 *
 * Las redes sociales (Facebook, WhatsApp, Twitter, etc.) NO ejecutan JavaScript,
 * por lo que no pueden ver los meta tags generados por React (useSeo).
 * Este middleware detecta crawlers y devuelve HTML estático con las OG tags
 * correctas para cada producto, obtenidas directamente de Supabase REST API.
 *
 * Usuarios normales pasan directamente a la SPA sin ningún cambio.
 */

const CRAWLER_AGENTS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'googlebot',
  'bingbot',
  'rogerbot',
  'embedly',
  'outbrain',
  'pinterest',
  'iframely',
  'vkshare',
  'w3c_validator',
  'applebot',
]

export const config = {
  matcher: ['/producto/:slug+'],
}

export default async function middleware(request) {
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  const isCrawler = CRAWLER_AGENTS.some(bot => ua.includes(bot))

  // Usuarios normales: pasar a la SPA sin intervención
  if (!isCrawler) return

  const url = new URL(request.url)
  const slug = url.pathname.replace(/^\/producto\//, '').split('/')[0]

  if (!slug) return

  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    'https://jkwndsbhrycyqwweungi.supabase.co'
  const SUPABASE_KEY =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd25kc2JocnljeXF3d2V1bmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTgyODUsImV4cCI6MjA4OTA3NDI4NX0.8LUvlqU_1LqzUuy6ckXoPYHbl9U8JRN2frBQIupyr6A'
  const SITE_URL = 'https://colecciones.grupo-gomez.com'

  try {
    const apiUrl =
      `${SUPABASE_URL}/rest/v1/products` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&select=name,short_description,images` +
      `&limit=1`

    const res = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    })

    if (!res.ok) return

    const data = await res.json()
    const product = Array.isArray(data) ? data[0] : null

    // Producto no encontrado: dejar que la SPA muestre el 404
    if (!product) return

    const title = `${product.name} | KG Store`
    const description =
      product.short_description
        ? product.short_description.replace(/<[^>]*>/g, '').slice(0, 160)
        : `Compra ${product.name} en KG Store. Envío rápido y pago en cuotas.`
    const image = product.images?.[0] || `${SITE_URL}/og-image.jpg`
    const pageUrl = `${SITE_URL}/producto/${slug}`

    const esc = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="KG Store" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:alt" content="${esc(product.name)}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />

  <link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body>
  <h1>${esc(product.name)}</h1>
  <p>${esc(description)}</p>
  <a href="${esc(pageUrl)}">Ver producto</a>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (_) {
    // Si falla la consulta, dejar que la SPA maneje la ruta
    return
  }
}
