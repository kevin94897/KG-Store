import { useEffect } from 'react'

const SITE_NAME = 'KG Store'
const SITE_URL = 'https://colecciones.grupo-gomez.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`

function setMeta(selector, attr, attrValue, content) {
  if (!content) return
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setProperty(property, content) {
  setMeta(`meta[property="${property}"]`, 'property', property, content)
}

function setNameMeta(name, content) {
  setMeta(`meta[name="${name}"]`, 'name', name, content)
}

function setJsonLd(data) {
  let el = document.querySelector('script[data-seo="json-ld"]')
  if (!el) {
    el = document.createElement('script')
    el.setAttribute('type', 'application/ld+json')
    el.setAttribute('data-seo', 'json-ld')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd() {
  const el = document.querySelector('script[data-seo="json-ld"]')
  if (el) el.remove()
}

/**
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.url          - path or full URL
 * @param {string} params.image        - absolute image URL
 * @param {number} [params.imageWidth]
 * @param {number} [params.imageHeight]
 * @param {'website'|'product'} [params.type]
 * @param {object} [params.jsonLd]     - structured data object
 */
export default function useSeo({
  title,
  description,
  url,
  image,
  imageWidth,
  imageHeight,
  type = 'website',
  jsonLd,
}) {
  useEffect(() => {
    const fullUrl = url
      ? url.startsWith('http') ? url : `${SITE_URL}${url}`
      : SITE_URL
    const fullImage = image || DEFAULT_IMAGE

    if (title) document.title = title

    // Basic
    setNameMeta('description', description)
    setNameMeta('keywords', 'figuras, coleccionables, ps4, ps5, cuotas, tienda, KG Store, Perú')

    // Open Graph
    setProperty('og:site_name', SITE_NAME)
    setProperty('og:title', title)
    setProperty('og:description', description)
    setProperty('og:type', type)
    setProperty('og:url', fullUrl)
    setProperty('og:image', fullImage)
    setProperty('og:image:secure_url', fullImage)
    if (imageWidth) setProperty('og:image:width', String(imageWidth))
    if (imageHeight) setProperty('og:image:height', String(imageHeight))
    setProperty('og:image:type', 'image/jpeg')
    setProperty('og:locale', 'es_PE')

    // Twitter
    setNameMeta('twitter:card', 'summary_large_image')
    setNameMeta('twitter:title', title)
    setNameMeta('twitter:description', description)
    setNameMeta('twitter:image', fullImage)
    setNameMeta('twitter:image:alt', title)

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']")
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    // JSON-LD
    if (jsonLd) {
      setJsonLd(jsonLd)
    } else {
      removeJsonLd()
    }

    return () => {
      removeJsonLd()
    }
  }, [title, description, url, image, imageWidth, imageHeight, type, jsonLd])
}
