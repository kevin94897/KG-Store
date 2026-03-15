import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { ArrowRight, Package, ChevronRight, Star } from 'lucide-react'

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-dark-800 mx-4 mt-4 rounded-3xl p-6 pb-8">
      {/* Decorative accent circle */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
          <Star size={11} className="text-accent fill-accent" />
          <span className="text-accent text-xs font-bold uppercase tracking-widest">Nuevas ediciones</span>
        </div>
        <h1 className="text-3xl font-black text-white leading-[1.1] mb-3">
          Traemos a pedido<br />
          <span className="text-accent">tus ediciones</span>
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Figuras, ediciones de PS4/PS5 y coleccionables. Paga en cuotas sin intereses.
        </p>
        <div className="flex gap-3">
          <Link to="/tienda" className="btn-accent flex-1 text-sm py-3">
            Ver tienda <ArrowRight size={16} />
          </Link>
          <Link to="/pedido" className="btn-outline flex-none text-sm py-3 px-5">
            Mi pedido
          </Link>
        </div>
      </div>
    </section>
  )
}

function InstallmentBanner() {
  return (
    <section className="mx-4 my-4 bg-dark-700 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-2xl">💳</span>
      </div>
      <div className="flex-1">
        <p className="text-white font-bold text-sm">¿No puedes pagar todo?</p>
        <p className="text-white/40 text-xs mt-0.5">Cuotas semanales o mensuales sin intereses</p>
      </div>
      <Link to="/cuotas" className="text-accent shrink-0">
        <ChevronRight size={20} />
      </Link>
    </section>
  )
}

export default function HomePage() {
  const { products: featured, loading } = useProducts({ limit: 6 })
  const categories = useCategories()

  return (
    <div className="pt-14">
      <HeroSection />

      {/* Categories */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Categorías</h2>
          <Link to="/tienda" className="text-accent text-xs font-semibold">Ver todo</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 cat-scroll -mx-0 scrollbar-hide">
          {[
            { slug: 'figuras', label: 'Figuras', icon: '🗿' },
            { slug: 'edicion-coleccionista', label: 'Ediciones', icon: '🎮' },
            { slug: 'coleccionables', label: 'Coleccionables', icon: '✨' },
          ].map(cat => (
            <Link
              key={cat.slug}
              to={`/tienda?cat=${cat.slug}`}
              className="shrink-0 flex items-center gap-2 bg-dark-700 border border-white/5 px-4 py-2.5 rounded-2xl active:border-accent/40 active:bg-accent/5 transition-all"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-semibold text-white whitespace-nowrap">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent products */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-0.5">Llegados recientemente</p>
            <h2 className="text-xl font-black text-white">Nuevas en stock</h2>
          </div>
          <Link to="/tienda" className="flex items-center gap-1 text-accent text-xs font-bold">
            Ver más <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      <InstallmentBanner />

      {/* Footer */}
      <footer className="px-4 pt-6 pb-safe border-t border-white/5 mt-8 bg-black">
        <div className="flex items-center gap-2 mb-3">
          <img src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png" alt="KG Store" className="h-8" />
        </div>
        <p className="text-white/30 text-xs leading-relaxed mb-4">
          Figuras, ediciones de PS4/PS5 y coleccionables para aumentar tu hermosa colección.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white font-semibold mb-2">Tienda</p>
            <div className="space-y-1.5">
              <Link to="/tienda" className="block text-white/40 active:text-white">Todos los artículos</Link>
              <Link to="/tienda?cat=figuras" className="block text-white/40 active:text-white">Figuras</Link>
              <Link to="/tienda?cat=edicion-coleccionista" className="block text-white/40 active:text-white">Ediciones</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Suscríbete</p>
            <p className="text-white/30 text-xs">Entérate de nuevos coleccionables en stock</p>
          </div>
        </div>
        <p className="text-white/15 text-xs text-center mt-6">© 2024 KG Store. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
