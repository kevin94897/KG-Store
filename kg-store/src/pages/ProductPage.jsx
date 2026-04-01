import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct, useProducts } from '../hooks/useProducts'
import ProductSlider from '../components/ProductSlider'
import { ArrowLeft, Truck, Share2, ChevronLeft, ChevronRight, X, ZoomIn, Heart, BookmarkPlus } from 'lucide-react'
import useSeo from '../hooks/useSeo'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import ReservationModal from '../components/ReservationModal'
import AuthModal from '../components/AuthModal'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

// ─── Fullscreen Modal con swipe táctil y zoom ───────────────────────
function FullscreenGallery({ images, initialIndex, onClose }) {
  const [current, setCurrent] = useState(initialIndex)
  const [panEnabled, setPanEnabled] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const isDragging = useRef(false)
  const scaleRef = useRef(1)

  const prev = () => setCurrent(p => (p - 1 + images.length) % images.length)
  const next = () => setCurrent(p => (p + 1) % images.length)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [current])

  const handleTouchStartCapture = (e) => {
    if (scaleRef.current > 1 || e.touches.length !== 1) { touchStartX.current = null; return }
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
  }
  const handleTouchMoveCapture = (e) => {
    if (!touchStartX.current) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) isDragging.current = 'h'
    else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) isDragging.current = 'v'
  }
  const handleTouchEndCapture = (e) => {
    if (!touchStartX.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (isDragging.current === 'h' && Math.abs(dx) > 50) { if (dx < 0) next(); else prev() }
    else if (isDragging.current === 'v' && dy > 80) onClose()
    touchStartX.current = null
    touchStartY.current = null
    setTimeout(() => { isDragging.current = false }, 50)
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      style={{ height: '100dvh' }}
      onTouchStartCapture={handleTouchStartCapture}
      onTouchMoveCapture={handleTouchMoveCapture}
      onTouchEndCapture={handleTouchEndCapture}
    >
      {/* Header flotante encima de la imagen */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-50 pointer-events-none"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <span className="text-white/80 text-sm font-semibold pointer-events-auto bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
          {current + 1} <span className="text-white/40">/</span> {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-all pointer-events-auto shadow-lg"
        >
          <X size={22} />
        </button>
      </div>

      {/* Área imagen con Zoom — ocupa todo el alto sin paddings */}
      <div className="flex-1 relative overflow-hidden bg-black w-full h-full">
        <TransformWrapper
          key={current}
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit
          wheel={{ step: 0.1 }}
          doubleClick={{ step: 0.5 }}
          pinch={{ step: 5 }}
          panning={{ disabled: !panEnabled }}
          onZoom={(ref) => { scaleRef.current = ref.state.scale; setPanEnabled(ref.state.scale > 1) }}
          onTransformed={(ref) => { scaleRef.current = ref.state.scale; setPanEnabled(ref.state.scale > 1) }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img
              src={images[current]}
              alt=""
              className="max-w-full max-h-full object-contain select-none fade-in"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Flechas desktop centradas verticalmente absolute */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full items-center justify-center text-white transition-all z-50 shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={next}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full items-center justify-center text-white transition-all z-50 shadow-lg"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      {/* Footer flotante encima de la imagen — dots + thumbnails */}
      {images.length > 1 && (
        <div
          className="absolute bottom-0 inset-x-0 z-50 pointer-events-none flex flex-col items-center"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <p className="md:hidden text-center text-white/40 text-xs font-medium pointer-events-none drop-shadow-md mb-2">
            Pellizcar para zoom · Deslizar para cambiar
          </p>
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md pt-3 pb-3 px-1 mx-4 rounded-2xl max-w-full overflow-hidden shadow-lg border border-white/5">
            <div className="flex justify-center gap-1.5 mb-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`transition-all rounded-full ${i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`}
                />
              ))}
            </div>
            <div className="flex gap-2 px-3 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 transition-all
                    ${i === current ? 'border-white opacity-100' : 'border-transparent opacity-40 active:opacity-70'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ─── Galería principal del producto ──────────────────────────
function ImageGallery({ images, onOpen }) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(null)

  if (!images?.length) return (
    <div className="aspect-square bg-[#1C1C1C] flex items-center justify-center">
      <span className="text-6xl opacity-20">📦</span>
    </div>
  )

  const prev = () => setCurrent(p => (p - 1 + images.length) % images.length)
  const next = () => setCurrent(p => (p + 1) % images.length)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
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
          className="aspect-square bg-[#1C1C1C] overflow-hidden cursor-zoom-in md:rounded-2xl"
          onClick={() => onOpen(current)}
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
                className={`transition-all rounded-full ${i === current ? 'w-4 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-white/40'
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
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all
                ${i === current ? 'border-accent opacity-100' : 'border-transparent opacity-45'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

    </>
  )
}

// ─── Productos Relacionados ───────────────────────────────────
function RelatedProducts({ categorySlug, currentProductId }) {
  const { products, loading } = useProducts({ category: categorySlug, limit: 12 })
  // Filtramos el producto actual
  const related = products.filter(p => p.id !== currentProductId)

  if (!loading && related.length === 0) return null

  return (
    <section className="mt-4 md:mt-8 border-t border-white/5 pt-8 mb-8 pb-4">
      <div className="px-4 mb-5">
        <h2 className="text-xl font-bold text-white mb-1">Productos similares</h2>
        <p className="text-white/40 text-sm">Más artículos que te podrían interesar</p>
      </div>
      <ProductSlider products={related} loading={loading} />
    </section>
  )
}

// ─── Página de producto ───────────────────────────────────────
export default function ProductPage() {
  const { slug } = useParams()
  const { product, loading } = useProduct(slug)
  const { user } = useAuth()
  const { isFav, toggle: toggleFav } = useFavorites(user?.id)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const handleFavorite = () => {
    if (!user) { setAuthOpen(true); return }
    toggleFav(product.id)
  }

  const handleReserve = () => {
    if (!user) { setAuthOpen(true); return }
    setReserveOpen(true)
  }

  const productImage = product?.images?.[0] || null
  const productDescription = product
    ? (product.short_description || `Compra ${product.name} en KG Store. Envío gratis a todo el Perú.`)
    : 'Detalle del producto en KG Store'

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: productDescription,
    image: product.images || [],
    url: `https://colecciones.grupo-gomez.com/producto/${slug}`,
    brand: { '@type': 'Brand', name: 'KG Store' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PEN',
      price: product.sale_price || product.regular_price,
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://colecciones.grupo-gomez.com/producto/${slug}`,
      seller: { '@type': 'Organization', name: 'KG Store' },
    },
    ...(product.categories && {
      category: product.categories.name,
    }),
  } : null

  useSeo({
    title: product ? `${product.name} | KG Store` : 'KG Store | Producto',
    description: productDescription,
    url: `/producto/${slug}`,
    image: productImage,
    imageWidth: 1200,
    imageHeight: 1200,
    type: 'product',
    jsonLd,
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
    <div className="max-w-7xl mx-auto w-full min-h-dvh relative pt-14">
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
    <div className="max-w-7xl mx-auto w-full min-h-dvh relative pt-14 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40">Producto no encontrado</p>
        <Link to="/tienda" className="text-accent text-sm mt-2 block">← Volver</Link>
      </div>
    </div>
  )

  const hasSale = product.sale_price && product.sale_price < product.regular_price
  const discount = hasSale
    ? Math.round((1 - product.sale_price / product.regular_price) * 100)
    : 0

  return (
    <>
      <div className="max-w-7xl mx-auto w-full min-h-dvh relative pt-14 pb-32 fade-up">
        {/* Botón volver solo móvil */}
        <div className="p-4 md:hidden">
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 text-white hover:underline text-sm font-semibold active:text-accent transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a la tienda
          </Link>
        </div>

        {/* Banner Promocional Arriba */}
        <div className="px-4 pt-4 md:pt-6 pb-2 md:block hidden">
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center justify-between text-accent">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-bold">¡Explora nuestras novedades!</p>
                <p className="text-xs text-accent/70 mt-0.5">Envíos seguros a todo el país</p>
              </div>
            </div>
            <Link to="/tienda" className="hidden sm:flex shrink-0 px-4 py-2 bg-accent text-black rounded-xl text-xs font-bold active:scale-95 transition-all">
              Ver tienda
            </Link>
          </div>
        </div>

        {/* Grid Content */}
        <div className="md:grid md:grid-cols-2 md:gap-10 md:px-4 md:pt-4">

          {/* Left Column: Image Gallery */}
          <div className="md:sticky md:top-24 md:mb-10">
            <ImageGallery images={product.images} onOpen={(i) => { setGalleryIndex(i); setGalleryOpen(true) }} />
          </div>

          {/* Right Column: Content */}
          <div className="px-4 pt-5 md:pt-0 pb-10">
            {/* Categoría + acciones */}
            <div className="flex items-center justify-between mb-2">
              {product.categories && (
                <span className="text-accent text-xs font-bold uppercase tracking-widest">
                  {product.categories.name}
                </span>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleFavorite}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-90"
                  aria-label={isFav(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Heart
                    size={20}
                    className={isFav(product.id) ? 'text-red-500 fill-red-500' : 'text-white/40 hover:text-white'}
                  />
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center rounded-full text-white/40 active:text-white transition-colors md:hover:bg-white/10">
                    <Share2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Nombre */}
            <h1 className="text-2xl font-semibold text-white leading-tight mb-3">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="flex items-center gap-3 mb-4">
              {hasSale ? (
                <>
                  <span className="text-3xl font-semibold text-accent">
                    S/{product.sale_price.toFixed(2)}
                  </span>
                  <div>
                    <span className="text-white text-sm line-through block">
                      S/{product.regular_price.toFixed(2)}
                    </span>
                    <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-md">
                      -{discount}% OFF
                    </span>
                  </div>
                </>
              ) : product.regular_price ? (
                <span className="text-3xl font-semibold text-white">
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
              className="block bg-[#1C1C1C] border border-white/5 rounded-2xl p-4 active:border-accent/30 transition-colors"
            >
              <p className="text-white font-bold text-sm mb-1">
                ¿No puedes pagar todo ahora? 💳
              </p>
              <p className="text-white/40 text-xs">
                Cuotas semanales o mensuales sin intereses → <span className="text-accent">Ver opciones</span>
              </p>
            </Link>

            {/* Desktop CTAs */}
            <div className="hidden md:flex flex-col gap-3 mt-8">
              {product.in_stock && (
                <button
                  onClick={handleReserve}
                  className="w-full btn-accent py-4 text-base"
                >
                  <BookmarkPlus size={20} />
                  Reservar ahora
                </button>
              )}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 border border-white/10 text-white font-semibold text-base py-4 rounded-full hover:bg-white/5 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Slider de Productos Relacionados */}
        {product.categories && (
          <RelatedProducts
            categorySlug={product.categories.slug}
            currentProductId={product.id}
          />
        )}

      </div>

      {/* CTA fijo mobile */}
      <div
        className={`fixed bottom-0 inset-x-0 px-4 py-3 pb-safe z-40 md:hidden ${galleryOpen ? 'hidden' : ''}`}
        style={{ background: 'linear-gradient(to top, #0E0E0E 70%, transparent)' }}
      >
        <div className="flex gap-2">
          {product.in_stock && (
            <button
              onClick={handleReserve}
              className="btn-accent flex-1 py-4 text-sm"
            >
              <BookmarkPlus size={18} />
              Reservar
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            className={`flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm py-4 rounded-full active:brightness-90 transition-all ${product.in_stock ? 'px-4' : 'flex-1'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {!product.in_stock && "Consultar por WhatsApp"}
          </button>
        </div>
      </div>

      {/* Modales */}
      {reserveOpen && <ReservationModal product={product} onClose={() => setReserveOpen(false)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {galleryOpen && <FullscreenGallery images={product.images} initialIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />}
    </>
  )
}