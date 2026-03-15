import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useProducts'
import { ArrowLeft, Truck, MessageCircle, Share2, ChevronLeft, ChevronRight, Star } from 'lucide-react'

function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0)
  if (!images?.length) return (
    <div className="aspect-square bg-dark-700 flex items-center justify-center text-white/10">
      <span className="text-6xl">📦</span>
    </div>
  )

  const prev = () => setCurrent(p => (p - 1 + images.length) % images.length)
  const next = () => setCurrent(p => (p + 1) % images.length)

  return (
    <div className="relative">
      {/* Main image */}
      <div className="aspect-square bg-dark-700 overflow-hidden">
        <img
          key={current}
          src={images[current]}
          alt=""
          className="w-full h-full object-cover fade-in"
        />
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-dark/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
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
              className={`gallery-dot ${i === current ? 'active' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all
                ${i === current ? 'border-accent' : 'border-transparent opacity-50'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const { product, loading } = useProduct(slug)

  const handleWhatsApp = () => {
    const msg = `Hola, me interesa: *${product.name}* — S/${product.regular_price}\n${window.location.href}`
    window.open(`https://wa.me/51947841355?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
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

  const hasSale = product.sale_price && product.sale_price < product.regular_price
  const discount = hasSale ? Math.round((1 - product.sale_price / product.regular_price) * 100) : 0

  return (
    <div className="pt-32 pb-32 min-h-dvh fade-up px-5">
      {/* Back button overlay */}
      <div className="absolute top-[56px] left-0 z-10 p-3">
        <Link
          to="/tienda"
          className="w-9 h-9 bg-dark/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Gallery */}
      <ImageGallery images={product.images} />

      {/* Content */}
      <div className="px-4 pt-5">
        {/* Category + share */}
        <div className="flex items-center justify-between mb-2">
          {product.categories && (
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              {product.categories.name}
            </span>
          )}
          {navigator.share && (
            <button onClick={handleShare} className="text-white/40 active:text-white">
              <Share2 size={18} />
            </button>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-black text-white leading-tight mb-3">{product.name}</h1>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          {hasSale ? (
            <>
              <span className="text-3xl font-black text-accent">S/{product.sale_price.toFixed(2)}</span>
              <div>
                <span className="text-white/30 text-sm line-through block">S/{product.regular_price.toFixed(2)}</span>
                <span className="bg-accent/20 text-accent text-xs font-bold px-2 py-0.5 rounded-md">-{discount}% OFF</span>
              </div>
            </>
          ) : product.regular_price ? (
            <span className="text-3xl font-black text-white">S/{product.regular_price.toFixed(2)}</span>
          ) : (
            <span className="text-xl font-bold text-white/50">Consultar precio</span>
          )}
        </div>

        {/* Stock badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4
          ${product.in_stock ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          <div className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-green-400' : 'bg-red-400'}`} />
          {product.in_stock ? 'En stock' : 'Agotado'}
        </div>

        {/* Free shipping */}
        <div className="flex items-center gap-2 text-accent text-sm font-semibold mb-5">
          <Truck size={16} />
          Envío gratis a todo el país
        </div>

        {/* Description */}
        {product.short_description && (
          <div className="bg-dark-700 rounded-2xl p-4 mb-4">
            <p className="text-white/70 text-sm leading-relaxed">{product.short_description}</p>
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

        {/* Installment info */}
        <div className="bg-dark-700 border border-white/5 rounded-2xl p-4 mb-6">
          <p className="text-white font-bold text-sm mb-1">¿No puedes pagar todo ahora?</p>
          <p className="text-white/40 text-xs">Pagos en cuotas semanales o mensuales sin intereses. 100% seguro.</p>
        </div>
      </div>

      {/* CTA — fixed bottom */}
<div class="fixed bottom-0 max-md:inset-x-0 md:left-1/2 md:-translate-x-1/2 px-4 py-3 pb-safe bg-gradient-to-t from-dark to-transparent text-center">        <button
          onClick={handleWhatsApp}
          className="btn-accent bg-[#25D366] text-white text-base py-4 w-auto"
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
