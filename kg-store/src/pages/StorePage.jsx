import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useCategories } from '../hooks/useProducts'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { SlidersHorizontal, X } from 'lucide-react'

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(searchParams.get('cat') || 'todos')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const categories = useCategories()

  useEffect(() => {
    const cat = searchParams.get('cat') || 'todos'
    const q = searchParams.get('search') || ''
    setActiveCategory(cat)
    setSearch(q)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('name', `%${search}%`)

    query.then(({ data }) => {
      let results = data || []
      if (activeCategory !== 'todos') {
        results = results.filter(p => p.categories?.slug === activeCategory)
      }
      setProducts(results)
      setLoading(false)
    })
  }, [activeCategory, search])

  const setCat = (slug) => {
    const params = new URLSearchParams(searchParams)
    if (slug === 'todos') params.delete('cat')
    else params.set('cat', slug)
    setSearchParams(params)
  }

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('search')
    setSearchParams(params)
  }

  const allCats = [{ slug: 'todos', name: 'Todos' }, ...categories]

  return (
    <div className="pt-14 pb-safe min-h-dvh">
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

      {/* Active search filter */}
      {search && (
        <div className="px-4 pb-2">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5">
            <span className="text-accent text-xs font-semibold">"{search}"</span>
            <button onClick={clearSearch} className="text-accent/60 active:text-accent">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">
            {activeCategory === 'todos' ? 'Toda la tienda' : categories.find(c => c.slug === activeCategory)?.name || ''}
          </h1>
          {!loading && (
            <p className="text-white/30 text-xs mt-0.5">{products.length} productos</p>
          )}
        </div>
      </div>

      {/* Products grid */}
      <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-2 text-center py-20">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="text-white/40 font-semibold">Sin resultados</p>
                <p className="text-white/20 text-sm mt-1">Intenta con otra búsqueda</p>
              </div>
            )
            : products.map(p => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  )
}
