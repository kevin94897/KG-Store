import useEmblaCarousel from 'embla-carousel-react'
import ProductCard, { ProductCardSkeleton } from './ProductCard'

export default function ProductSlider({ products, loading }) {
  const [emblaRef] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  })

  return (
    <div className="overflow-hidden px-4" ref={emblaRef}>
      <div className="flex gap-3">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex-[0_0_160px] md:flex-[0_0_calc(25%-9px)] shrink-0">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map(p => (
              <div key={p.id} className="flex-[0_0_160px] md:flex-[0_0_calc(25%-9px)] shrink-0">
                <ProductCard product={p} />
              </div>
            ))
        }
      </div>
    </div>
  )
}
