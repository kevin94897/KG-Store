import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts'
import { ArrowLeft, Truck, Share2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import useSeo from '../hooks/useSeo'

// ─── Fullscreen Modal con swipe táctil ───────────────────────
function FullscreenGallery({ images, initialIndex, onClose }) {
  const [current, setCurrent]   = useState(initialIndex)
  const touchStartX             = useRef(null)
  const touchStartY             = useRef(null)
  const isDragging              = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const prev = () => {
    if (isAnimating) return
    setCurrent(p => (p - 1 + images.length) % images.length)
  }
  const next = () => {
    if (isAnimating) return
    setCurrent(p => (p + 1) % images.length)
  }

  // Teclado desktop
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
    }
    window.addEventListener('keydown', onKey)
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isAnimating])

  // ── Touch / Swipe handlers ──────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current  = false
  }

  const onTouchMove = (e) => {
    if (!touchStartX.current) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Solo swipe horizontal
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDragging.current = true
      e.preventDefault()
      setDragOffset(dx)
    }
  }

  const onTouchEnd = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    setDragOffset(0)

    if (isDragging.current && Math.abs(dx) > 50) {
      if (dx < 0) next()
      else prev()
    }

    touchStartX.current = null
    touchStartY.current = null
    isDragging.current  = false
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/50 text-sm font-semibold">
          {current + 1} <span className="text-white/20">/</span> {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white active:bg-white/20 transition-all"
        >
          <X size={22} />
        </button>
      </div>

      {/* Área imagen — ocupa todo el espacio restante, centrada */}
      <div
        className="flex-1 relative overflow-hidden cursor-pointer min-h-0"
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Imagen centrada absoluta */}
        <div className="absolute inset-0 flex items-center justify-center px-4 py-2">
          <img
            key={current}
            src={images[current]}
            alt=""
            className="max-w-full max-h-full object-contain select-none fade-in"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: dragOffset === 0 ? 'transform 0.2s ease' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Flechas desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-all z-10"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center text-white transition-all z-10"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      {/* Footer — dots + thumbnails */}
      {images.length > 1 && (
        <div className="shrink-0 pb-3">
          <div className="flex justify-center gap-1.5 mb-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${
                  i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all
                  ${i === current ? 'border-white opacity-100' : 'border-transparent opacity-40 active:opacity-70'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      {images.length > 1 && (
        <p className="md:hidden text-center text-white/20 text-xs pb-3 shrink-0">
          Desliza para navegar · Toca fuera para cerrar
        </p>
      )}
    </div>
  )
}

// ─── Galería principal del producto ──────────────────────────
function ImageGallery({ images }) {
  const [current, setCurrent]       = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStartX                 = useRef(null)

  if (!images?.length) return (
    <div className="aspect-square bg-[#1C1C1C] flex items-center justify-center">
      <span className="text-6xl opacity-20">📦</span>
    </div>
  )

  const prev = () => setCurrent(p => (p - 1 + images.length) % images.length)
  const next = () => setCurrent(p => (p + 1) % images.length)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) next()
    else if (dx > 50) prev()
    touchStartX.current = null
  }

  return (
    <>
      <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Imagen principal */}
        <div
          className="aspect-square bg-[#1C1C1C] overflow-hidden cursor-zoom-in"
          onClick={() => setFullscreen(true)}
        >
          <img
            key={current}
            src={images[current]}
            alt=""
            className="w-full h-full object-cover fade-in"
          />
          {/* Icono zoom — solo desktop */}
          <div className="hidden md:flex absolute inset-0 items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
            <ZoomIn size={32} className="text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>

        {/* Flechas — solo si hay más de 1 imagen */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
              style={{ background: 'rgba(14,14,14,0.70)' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
              style={{ background: 'rgba(14,14,14,0.70)' }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full ${
                  i === current ? 'w-4 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Contador */}
        {images.length > 1 && (
          <div
            className="absolute top-3 right-3 text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            {current + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all
                ${i === current ? 'border-accent opacity-100' : 'border-transparent opacity-45'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreen && (
        <FullscreenGallery
          images={images}
          initialIndex={current}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  )
}

// ─── Página de producto ───────────────────────────────────────
export default function ProductPage() {
  const { slug }            = useParams()
  const { product, loading } = useProduct(slug)

  useSeo({
    title:       product ? `${product.name} | KG Store` : 'KG Store | Producto',
    description: product
      ? (product.short_description || `Compra ${product.name} en cuotas`)
      : 'Detalle del producto en KG Store',
    url:   `https://tu-dominio.com/producto/${slug}`,
    image: product?.images?.[0] || 'https://tu-dominio.com/og-image.jpg',
  })

  const handleWhatsApp = () => {
    const msg = `Hola, me interesa: *${product.name}* — S/${product.regular_price}\n${window.location.href}`
    window.open(`https://wa.me/51947841355?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href })
    }
  }

  if (loading) return (
    <div className="pt-14 min-h-dvh">
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-6 w-3/4 rounded" />
        <div className="skeleton h-5 w-1/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
      </div>
    </div>
  )

  if (!product) return (
    <div className="pt-14 flex items-center justify-center min-h-dvh">
      <div className="text-center">
        <p className="text-white/40">Producto no encontrado</p>
        <Link to="/tienda" className="text-accent text-sm mt-2 block">← Volver</Link>
      </div>
    </div>
  )

  const hasSale  = product.sale_price && product.sale_price < product.regular_price
  const discount = hasSale
    ? Math.round((1 - product.sale_price / product.regular_price) * 100)
    : 0

  return (
    <div className="pt-14 pb-32 min-h-dvh fade-up">
      {/* Botón volver */}
      <div className="absolute top-[56px] left-0 z-10 p-3">
        <Link
          to="/tienda"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white border border-white/10"
          style={{ background: 'rgba(14,14,14,0.80)' }}
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Galería */}
      <ImageGallery images={product.images} />

      {/* Contenido */}
      <div className="px-4 pt-5">
        {/* Categoría + compartir */}
        <div className="flex items-center justify-between mb-2">
          {product.categories && (
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              {product.categories.name}
            </span>
          )}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={handleShare} className="text-white/40 active:text-white transition-colors p-1">
              <Share2 size={18} />
            </button>
          )}
        </div>

        {/* Nombre */}
        <h1 className="text-2xl font-black text-white leading-tight mb-3">
          {product.name}
        </h1>

        {/* Precio */}
        <div className="flex items-center gap-3 mb-4">
          {hasSale ? (
            <>
              <span className="text-3xl font-black text-accent">
                S/{product.sale_price.toFixed(2)}
              </span>
              <div>
                <span className="text-white/30 text-sm line-through block">
                  S/{product.regular_price.toFixed(2)}
                </span>
                <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-md">
                  -{discount}% OFF
                </span>
              </div>
            </>
          ) : product.regular_price ? (
            <span className="text-3xl font-black text-white">
              S/{product.regular_price.toFixed(2)}
            </span>
          ) : (
            <span className="text-xl font-bold text-white/50">Consultar precio</span>
          )}
        </div>

        {/* Stock */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border
          ${product.in_stock
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
          <div className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-green-400' : 'bg-red-400'}`} />
          {product.in_stock ? 'En stock' : 'Agotado'}
        </div>

        {/* Envío gratis */}
        <div className="flex items-center gap-2 text-accent text-sm font-semibold mb-5">
          <Truck size={16} />
          Envío gratis a todo el país
        </div>

        {/* Descripción */}
        {product.short_description && (
          <div className="bg-[#1C1C1C] rounded-2xl p-4 mb-4">
            <p className="text-white/70 text-sm leading-relaxed">
              {product.short_description}
            </p>
          </div>
        )}

        {/* Tags */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags.map(tag => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        )}

        {/* Banner cuotas */}
        <Link
          to="/cuotas"
          className="block bg-[#1C1C1C] border border-white/5 rounded-2xl p-4 mb-6 active:border-accent/30 transition-colors"
        >
          <p className="text-white font-bold text-sm mb-1">
            ¿No puedes pagar todo ahora? 💳
          </p>
          <p className="text-white/40 text-xs">
            Cuotas semanales o mensuales sin intereses → <span className="text-accent">Ver opciones</span>
          </p>
        </Link>
      </div>

      {/* CTA fijo en la parte inferior */}
      <div
        className="fixed bottom-0 inset-x-0 px-4 py-3 pb-safe z-40"
        style={{ background: 'linear-gradient(to top, #0E0E0E 60%, transparent)' }}
      >
        <button
          onClick={handleWhatsApp}
          className="btn-accent bg-[#25D366] text-white text-base py-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Consultar por WhatsApp
        </button>
      </div>
    </div>
  )
}