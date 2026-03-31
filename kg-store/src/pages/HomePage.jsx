import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, useCategories } from '../hooks/useProducts'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import ProductSlider from '../components/ProductSlider'
import { ArrowRight, Package, ChevronRight, Star, Shield, Truck, Award, CreditCard } from 'lucide-react'
import useSeo from '../hooks/useSeo'

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-dark-800 mx-4 mt-4 rounded-3xl p-6 pb-8 md:min-h-[500px] flex flex-col justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/kg_store_banner_home.webp')" }}
    >
      {/* Overlay gradient to ensure text remains readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30 z-0" />

      {/* Decorative accent circle */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-accent/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent/10 blur-2xl pointer-events-none z-0" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
          <Star size={11} className="text-accent fill-accent" />
          <span className="text-accent text-xs font-bold uppercase tracking-widest">Nuevas ediciones</span>
        </div>
        <h1 className="text-3xl font-semibold text-white leading-[1.1] mb-3">
          Traemos a pedido<br />
          <span className="text-accent">tus ediciones</span>
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Figuras, ediciones de PS4/PS5 y coleccionables. Paga en cuotas sin intereses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <Link to="/tienda" className="btn-accent flex-1 text-sm py-3 md:max-w-[300px]">
            Ver tienda <ArrowRight size={16} />
          </Link>
          <Link to="/cuotas" className="btn-outline flex-none text-sm py-3 px-5">
            ¿Pago en cuotas?
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

  useSeo({
    title: 'KG Store | Home — Figuras, ediciones y coleccionables',
    description: 'KG Store: compra figuras, ediciones de PS4/PS5 y coleccionables con envío rápido y cuotas.',
    url: 'https://colecciones.grupo-gomez.com/',
    image: 'https://colecciones.grupo-gomez.com/og-image.jpg'
  })

  return (
    <>
      <div className="max-w-7xl mx-auto w-full min-h-dvh relative pt-14">
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

        {/* Recent products (All/Featured) */}
        <section className="mt-6">
          <div className="px-4 flex items-center justify-between mb-4">
            <div>
              <p className="text-accent text-xs font-bold uppercase tracking-widest mb-0.5">Llegados recientemente</p>
              <h2 className="text-xl font-semibold text-white">Nuevas en stock</h2>
            </div>
            <Link to="/tienda" className="flex items-center gap-1 text-accent text-xs font-bold">
              Ver más <ArrowRight size={14} />
            </Link>
          </div>
          <ProductSlider products={featured} loading={loading} />
        </section>

        {/* Products by Category */}
        {categories && categories.length > 0 && categories.map(cat => (
          <CategorySection key={cat.id} category={cat} />
        ))}

        <BenefitsSection />

        <InstallmentBanner />

      </div>

      {/* Footer */}
      <footer className="px-4 pt-6 md:pt-12 pb-safe border-t border-white/5 mt-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <img src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png" alt="KG Store" className="h-8" />
          </div>
          <p className="text-white text-xs leading-relaxed mb-4">
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
            {/* <div>
              <p className="text-white font-semibold mb-2">Suscríbete</p>
              <p className="text-white text-xs">Entérate de nuevos coleccionables en stock</p>
            </div> */}
          </div>
          <p className="text-white/15 text-xs text-center mt-6 md:mt-12">© 2026 KG Store. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  )
}

function CategorySection({ category }) {
  const { products, loading } = useProducts({ category: category.slug, limit: 10 })

  if (!loading && products.length === 0) return null

  return (
    <section className="mt-6">
      <div className="px-4 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{category.name}</h2>
        </div>
        <Link to={`/tienda?cat=${category.slug}`} className="flex items-center gap-1 text-accent text-xs font-bold">
          Ver más <ArrowRight size={14} />
        </Link>
      </div>
      <ProductSlider products={products} loading={loading} />
    </section>
  )
}

function BenefitsSection() {
  const benefits = [
    { icon: Shield, title: 'Compras Seguras', desc: 'Tu dinero e información están protegidos en todo momento.' },
    { icon: Truck, title: 'Envíos a todo el Perú', desc: 'Embalaje reforzado para cuidar al máximo tu figura.' },
    { icon: Award, title: '100% Originales', desc: 'Garantía de autenticidad en cada producto que enviamos.' },
    { icon: CreditCard, title: 'Pago en Cuotas', desc: 'Lleva ahora y paga poco a poco, sin tarjeta de crédito.' }
  ]

  return (
    <section className="px-4 mt-8 md:mt-12 mb-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {benefits.map((b, i) => (
          <div key={i} className="bg-dark-700/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center text-center gap-2 hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1 pointer-events-none">
              <b.icon size={22} />
            </div>
            <h3 className="text-white text-sm font-bold leading-tight">{b.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
