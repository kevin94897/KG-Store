import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { Search, Plus, RefreshCw, Package, ChevronRight, Tag } from 'lucide-react'

import { thumbUrl, thumbFallback } from '../utils/thumbUrl'
const STATUS_STYLE = {
  published: 'bg-green-500/10 text-green-400 border-green-500/20',
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-white/5 text-white/20 border-white/5',
}
const STATUS_LABEL = { published: 'Pub', draft: 'Draft', archived: 'Arc' }

function ProductRow({ product }) {
  return (
    <Link
      to={`/productos/${product.id}`}
      className="card flex items-center gap-3 p-3 active:scale-[0.98] transition-all"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-600 shrink-0">
        {product.images?.[0]
          ? <img src={thumbUrl(product.images[0])} alt="" className="w-full h-full object-cover" loading="lazy" onError={thumbFallback(product.images[0])} />
          : <div className="w-full h-full flex items-center justify-center"><Package size={22} className="text-white/10" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight mb-1">{product.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLE[product.status] || STATUS_STYLE.archived}`}>
            {STATUS_LABEL[product.status] || product.status}
          </span>
          {product.regular_price && (
            <span className="text-xs text-accent font-bold font-mono">
              S/{parseFloat(product.regular_price).toFixed(2)}
            </span>
          )}
          {!product.in_stock && (
            <span className="text-[10px] text-red-400 font-semibold">Agotado</span>
          )}
        </div>
      </div>
      <ChevronRight size={15} className="text-white/15 shrink-0" />
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="skeleton w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetch = useCallback(async (q = '', f = 'all') => {
    let query = supabase
      .from('products')
      .select('id, name, images, regular_price, status, in_stock, categories(name)')
      .order('created_at', { ascending: false })

    if (q) query = query.ilike('name', `%${q}%`)
    if (f === 'published') query = query.eq('status', 'published')
    if (f === 'draft') query = query.eq('status', 'draft')
    if (f === 'outofstock') query = query.eq('in_stock', false)

    const { data } = await query
    setProducts(data || [])
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch().finally(() => setLoading(false))
  }, [])

  const handleSearch = (v) => {
    setSearch(v)
    fetch(v, filter)
  }

  const handleFilter = (f) => {
    setFilter(f)
    fetch(search, f)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetch(search, filter)
    setRefreshing(false)
  }

  const FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'published', label: 'Publicados' },
    { key: 'draft', label: 'Borradores' },
    { key: 'outofstock', label: 'Agotados' },
  ]

  return (
    <div className="min-h-dvh bg-dark pb-24 pt-safe">
      {/* Header */}
      <div className="sticky top-0 bg-dark/95 backdrop-blur-xl z-10 px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Productos</h1>
            <p className="text-xs text-white/25">{products.length} resultados</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 bg-dark-600 border border-white/5 rounded-xl flex items-center justify-center text-white/40 active:text-white"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Link
              to="/categorias"
              className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
            >
              <Tag size={18} className="text-black" />
            </Link>
            <Link
              to="/productos/nuevo"
              className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
            >
              <Plus size={18} className="text-black" />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            className="input pl-9"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => handleFilter(f.key)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                ${filter === f.key ? 'bg-accent text-black' : 'bg-dark-600 text-white/40'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading
          ? Array(6).fill(0).map((_, i) => <Skeleton key={i} />)
          : products.length === 0
            ? (
              <div className="text-center py-20">
                <Package size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white font-semibold">Sin productos</p>
              </div>
            )
            : products.map(p => <ProductRow key={p.id} product={p} />)
        }
      </div>
    </div>
  )
}
