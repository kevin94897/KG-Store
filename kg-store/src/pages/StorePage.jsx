import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useCategories } from '../hooks/useProducts'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react'
import useSeo from '../hooks/useSeo'

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Data state ──
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Filter state ──
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') || 'todos')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || 'all')
  const [showFilters, setShowFilters] = useState(false)

  const categories = useCategories()

  // ── Sync state with URL params ──
  useEffect(() => {
    setActiveCategory(searchParams.get('cat') || 'todos')
    setSearch(searchParams.get('search') || '')
    setSortBy(searchParams.get('sort') || 'newest')
    setStockFilter(searchParams.get('stock') || 'all')
  }, [searchParams])

  // ── Fetch all published products once ──
  useEffect(() => {
    setLoading(true)
    supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAllProducts(data || [])
        setLoading(false)
      })
  }, [])

  // ── Derived filtered & sorted products ──
  const products = useMemo(() => {
    let result = [...allProducts]

    // 1. Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q))
    }

    // 2. Category
    if (activeCategory !== 'todos') {
      result = result.filter(p => p.categories?.slug === activeCategory)
    }

    // 3. Stock
    if (stockFilter === 'in_stock') {
      result = result.filter(p => p.in_stock === true)
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter(p => p.in_stock === false)
    } else if (stockFilter === 'on_sale') {
      result = result.filter(p => p.sale_price != null && p.sale_price < p.regular_price)
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)

      const priceA = a.sale_price || a.regular_price || 0
      const priceB = b.sale_price || b.regular_price || 0

      if (sortBy === 'price-asc') return priceA - priceB
      if (sortBy === 'price-desc') return priceB - priceA

      // newest (default fallback and specifically requested)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return result
  }, [allProducts, search, activeCategory, stockFilter, sortBy])

  // ── URL Updates Helpers ──
  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'todos' || value === 'all' || value === 'newest' || !value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    setSearchParams(params)
  }

  const setCat = (slug) => updateParams({ cat: slug })
  const clearSearch = () => updateParams({ search: '' })

  const activeCatSlugs = useMemo(
    () => new Set(allProducts.map(p => p.categories?.slug).filter(Boolean)),
    [allProducts]
  )

  const allCats = [
    { slug: 'todos', name: 'Todos' },
    ...categories.filter(c => loading || activeCatSlugs.has(c.slug)),
  ]

  useSeo({
    title: 'KG Store | Tienda - Figuras y coleccionables',
    description: 'Explora KG Store, la tienda de figuras, coleccionables y ediciones de juegos con envíos y cuotas.',
    url: 'https://colecciones.grupo-gomez.com/tienda',
    image: 'https://colecciones.grupo-gomez.com/og-image.jpg'
  })

  return (
    <div className="max-w-7xl mx-auto w-full min-h-dvh relative pt-14 pb-safe">
      {/* Category filter tabs */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 cat-scroll scrollbar-hide -mx-0">
          {allCats.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCat(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95
                ${activeCategory === cat.slug
                  ? 'bg-accent text-black'
                  : 'bg-dark-700 text-white/60 border border-white/5'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Active search filter indicator */}
          {search && (
            <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
              <span className="text-accent text-xs font-semibold">"{search}"</span>
              <button onClick={clearSearch} className="text-accent/60 active:text-accent">
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors
            ${showFilters ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/10 text-white/50 active:bg-white/5'}`}
        >
          <Filter size={14} /> Filtros
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="px-4 pb-4">
          <div className="bg-dark-700 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Ordenar por</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="w-full bg-dark-600 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none outline-none focus:border-accent/50"
                >
                  <option value="newest">Más recientes</option>
                  <option value="price-asc">Precio: de menor a mayor</option>
                  <option value="price-desc">Precio: de mayor a menor</option>
                  <option value="name-asc">Nombre: A - Z</option>
                  <option value="name-desc">Nombre: Z - A</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Stock / Sale */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Disponibilidad</label>
              <div className="relative">
                <select
                  value={stockFilter}
                  onChange={(e) => updateParams({ stock: e.target.value })}
                  className="w-full bg-dark-600 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none outline-none focus:border-accent/50"
                >
                  <option value="all">Todos los productos</option>
                  <option value="in_stock">Solo en stock</option>
                  <option value="out_of_stock">Agotados</option>
                  <option value="on_sale">Solo ofertas</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            {activeCategory === 'todos' ? 'Toda la tienda' : categories.find(c => c.slug === activeCategory)?.name || ''}
          </h1>
          {!loading && (
            <p className="text-white/40 text-xs mt-0.5">{products.length} productos</p>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-2 md:col-span-4 text-center py-20 bg-dark-800 rounded-3xl mt-4">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-white/40 font-semibold">Sin resultados</p>
                <p className="text-white/20 text-sm mt-1">Intenta ajustando los filtros</p>
              </div>
            )
            : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  )
}
