import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { mediumUrl, mediumFallback } from '../utils/thumbUrl'

function PriceBadge({ regular, sale }) {
  const discount = sale && regular ? Math.round((1 - sale / regular) * 100) : 0
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {sale ? (
        <>
          <span className="text-accent font-bold text-base">S/{sale.toFixed(2)}</span>
          <span className="text-white text-sm line-through">S/{regular.toFixed(2)}</span>
        </>
      ) : (
        <span className="text-white font-bold text-base">
          {regular ? `S/${regular.toFixed(2)}` : 'Consultar'}
        </span>
      )}
    </div>
  )
}

export default function ProductCard({ product }) {
  const [imgLoading, setImgLoading] = useState(true)
  const mainImage = product.images?.[0]
  const isSoldOut = !product.in_stock
  const hasSale = product.sale_price && product.sale_price < product.regular_price
  const discount = hasSale ? Math.round((1 - product.sale_price / product.regular_price) * 100) : 0

  return (
    <Link to={`/producto/${product.slug}`} className="product-card block group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-dark-700">
        {imgLoading && (
          <div className="absolute inset-0 skeleton z-10" />
        )}
        
        {mainImage ? (
          <img
            src={mediumUrl(mainImage)}
            alt={product.name}
            className={`w-full h-full object-cover group-active:scale-105 transition-all duration-500 ${imgLoading ? 'opacity-0 scale-110 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
            loading="lazy"
            onLoad={() => setImgLoading(false)}
            onError={(e) => {
              setImgLoading(false)
              mediumFallback(mainImage)(e)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        {isSoldOut && (
          <div className="badge-sold">Agotado</div>
        )}
        {!isSoldOut && hasSale && (
          <div className="badge-sale">-{discount}%</div>
        )}

        {/* Envío gratis badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-dark/80 backdrop-blur-sm text-accent text-[10px] font-bold px-2 py-1 rounded-lg border border-accent/20">
          <Truck size={11} />
          Envío gratis
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-2 mb-2">
          {product.name}
        </p>
        <PriceBadge regular={product.regular_price} sale={product.sale_price} />
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-dark-800 rounded-2xl overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  )
}
