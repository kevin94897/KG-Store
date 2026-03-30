<?php
/**
 * OG Meta Tags Proxy para crawlers de redes sociales.
 *
 * Las redes sociales (Facebook, WhatsApp, Twitter, etc.) NO ejecutan JavaScript,
 * por lo que no ven los meta tags generados por React.
 * Este script detecta crawlers y sirve HTML estático con las OG tags correctas
 * del producto, obtenidas de Supabase REST API.
 *
 * Usuarios normales reciben index.html (la SPA de React) sin cambios.
 */

// ── Configuración ────────────────────────────────────────────────────────────

define('SUPABASE_URL', 'https://jkwndsbhrycyqwweungi.supabase.co');
define('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd25kc2JocnljeXF3d2V1bmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTgyODUsImV4cCI6MjA4OTA3NDI4NX0.8LUvlqU_1LqzUuy6ckXoPYHbl9U8JRN2frBQIupyr6A');
define('SITE_URL',     'https://colecciones.grupo-gomez.com');

// ── Detección de crawlers ─────────────────────────────────────────────────────

$ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');

$crawlers = [
    'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot',
    'whatsapp', 'slackbot', 'telegrambot', 'discordbot',
    'googlebot', 'bingbot', 'applebot', 'rogerbot',
    'embedly', 'outbrain', 'pinterest', 'iframely', 'vkshare',
];

$is_crawler = false;
foreach ($crawlers as $bot) {
    if (strpos($ua, $bot) !== false) {
        $is_crawler = true;
        break;
    }
}

// ── Usuario normal: servir la SPA ─────────────────────────────────────────────

if (!$is_crawler) {
    $html_path = __DIR__ . '/index.html';
    if (file_exists($html_path)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($html_path);
    }
    exit;
}

// ── Crawler detectado: construir OG tags ─────────────────────────────────────

// Sanitizar slug (solo letras minúsculas, números y guiones)
$slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($_GET['slug'] ?? ''));

if (!$slug) {
    serve_spa();
    exit;
}

$product = fetch_product($slug);

if (!$product) {
    serve_spa();
    exit;
}

// Preparar datos OG
$title       = $product['name'] . ' | KG Store';
$raw_desc    = strip_tags($product['short_description'] ?? '');
$description = $raw_desc
    ? mb_substr($raw_desc, 0, 160)
    : 'Compra ' . $product['name'] . ' en KG Store. Envío rápido y pago en cuotas.';
$images      = $product['images'] ?? [];
$image       = !empty($images) ? $images[0] : SITE_URL . '/og-image.jpg';
$page_url    = SITE_URL . '/producto/' . $slug;

serve_og_html($title, $description, $image, $page_url, $product['name']);
exit;

// ── Funciones ─────────────────────────────────────────────────────────────────

function fetch_product(string $slug): ?array
{
    $api_url = SUPABASE_URL
        . '/rest/v1/products'
        . '?slug=eq.' . urlencode($slug)
        . '&select=name,short_description,images'
        . '&limit=1';

    // Usar cURL si está disponible (más confiable en hostings compartidos)
    if (function_exists('curl_init')) {
        $ch = curl_init($api_url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_HTTPHEADER     => [
                'apikey: '        . SUPABASE_KEY,
                'Authorization: Bearer ' . SUPABASE_KEY,
                'Accept: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $err  = curl_errno($ch);
        curl_close($ch);

        if ($err || $body === false) return null;
    } else {
        // Fallback: file_get_contents
        $context = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  =>
                    'apikey: '              . SUPABASE_KEY . "\r\n" .
                    'Authorization: Bearer '    . SUPABASE_KEY . "\r\n" .
                    'Accept: application/json'  . "\r\n",
                'timeout' => 5,
            ],
            'ssl' => ['verify_peer' => true],
        ]);
        $body = @file_get_contents($api_url, false, $context);
        if ($body === false) return null;
    }

    $data = json_decode($body, true);
    return (is_array($data) && !empty($data)) ? $data[0] : null;
}

function serve_og_html(
    string $title,
    string $description,
    string $image,
    string $page_url,
    string $product_name
): void {
    $t   = htmlspecialchars($title,        ENT_QUOTES, 'UTF-8');
    $d   = htmlspecialchars($description,  ENT_QUOTES, 'UTF-8');
    $img = htmlspecialchars($image,        ENT_QUOTES, 'UTF-8');
    $url = htmlspecialchars($page_url,     ENT_QUOTES, 'UTF-8');
    $pn  = htmlspecialchars($product_name, ENT_QUOTES, 'UTF-8');

    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=3600, stale-while-revalidate=86400');

    echo <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>{$t}</title>
  <meta name="description" content="{$d}" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="KG Store" />
  <meta property="og:type" content="product" />
  <meta property="og:title" content="{$t}" />
  <meta property="og:description" content="{$d}" />
  <meta property="og:url" content="{$url}" />
  <meta property="og:image" content="{$img}" />
  <meta property="og:image:alt" content="{$pn}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{$t}" />
  <meta name="twitter:description" content="{$d}" />
  <meta name="twitter:image" content="{$img}" />

  <link rel="canonical" href="{$url}" />
</head>
<body>
  <h1>{$pn}</h1>
  <p>{$d}</p>
  <a href="{$url}">Ver producto</a>
</body>
</html>
HTML;
}

function serve_spa(): void
{
    $html_path = __DIR__ . '/index.html';
    if (file_exists($html_path)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($html_path);
    }
}
