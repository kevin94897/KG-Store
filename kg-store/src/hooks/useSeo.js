import { useEffect } from 'react'

function updateMeta(name, content, attr = 'name') {
  if (!content) return
  let selector = attr === 'name' ? `meta[name="${name}"]` : `meta[property="${name}"]`
  let element = document.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export default function useSeo({ title, description, url, image, type = 'website' }) {
  useEffect(() => {
    if (title) document.title = title

    updateMeta('description', description)
    updateMeta('keywords', 'figuras, coleccionables, ps4, ps5, cuotas, tienda')

    // Open Graph
    updateMeta('og:title', title, 'property')
    updateMeta('og:description', description, 'property')
    updateMeta('og:type', type, 'property')
    updateMeta('og:url', url ? url.replace('https://tu-dominio.com', 'https://colecciones.grupo-gomez.com') : '', 'property')
    updateMeta('og:image', image ? image.replace('https://tu-dominio.com', 'https://colecciones.grupo-gomez.com') : '', 'property')

    // Twitter
    updateMeta('twitter:card', 'summary_large_image')
    updateMeta('twitter:title', title)
    updateMeta('twitter:description', description)
    updateMeta('twitter:image', image)

    if (url) {
      let canonical = document.querySelector("link[rel='canonical']")
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', url)
    }
  }, [title, description, url, image, type])
}
