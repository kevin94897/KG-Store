import { useState, useEffect } from 'react'
import { thumbUrl, thumbFallback } from '../utils/thumbUrl'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useDemo } from '../context/DemoContext'
import { Plus } from 'lucide-react'
import {
  Package, Tag, TrendingUp,
  AlertTriangle, ChevronRight, Images, BookmarkCheck, MonitorPlay
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, accent, sublabel }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white font-semibold uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-accent/15' : 'bg-white/5'}`}>
          <Icon size={15} className={accent ? 'text-accent' : 'text-white/40'} />
        </div>
      </div>
      <p className={`text-3xl font-semibold ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
      {sublabel && <p className="text-xs text-white/25 mt-0.5">{sublabel}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { isDemo } = useDemo()
  const [stats, setStats] = useState({ products: 0, categories: 0, inStock: 0, outOfStock: 0 })
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [demoClicks, setDemoClicks] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, in_stock, status', { count: 'exact' }),
      supabase.from('categories').select('id', { count: 'exact' }),
      supabase.from('products').select('id, name, images, regular_price, status, in_stock, categories(name)')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('demo_clicks').select('clicked_at', { count: 'exact' }).order('clicked_at', { ascending: false }).limit(1),
    ]).then(([productsRes, catsRes, recentRes, clicksRes]) => {
      const prods = productsRes.data || []
      setStats({
        products: productsRes.count || prods.length,
        categories: catsRes.count || 0,
        inStock: prods.filter(p => p.in_stock).length,
        outOfStock: prods.filter(p => !p.in_stock).length,
      })
      setRecentProducts(recentRes.data || [])
      setDemoClicks({
        total: clicksRes.count || 0,
        last: clicksRes.data?.[0]?.clicked_at || null,
      })
      setLoading(false)
    })
  }, [])

  const STATUS_COLOR = { published: 'text-green-400', draft: 'text-yellow-400', archived: 'text-white/20' }
  const STATUS_LABEL = { published: 'Publicado', draft: 'Borrador', archived: 'Archivado' }

  return (
    <div className="min-h-dvh bg-dark pb-24 pt-5">

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Productos" value={stats.products} icon={Package} accent />
        <StatCard label="Categorías" value={stats.categories} icon={Tag} />
        <StatCard label="En stock" value={stats.inStock} icon={TrendingUp} accent />
        <StatCard label="Agotados" value={stats.outOfStock} icon={AlertTriangle} />
      </div>

      {/* Quick actions */}
      <div className="mb-5">
        <p className="label mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Link to="/productos/nuevo" className="card p-4 flex items-center gap-3 active:scale-[0.97] transition-all">
            <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center">
              <Plus size={18} className="text-accent" />
            </div>
            <span className="text-sm font-bold text-white">Nuevo producto</span>
          </Link>
          <Link to="/categorias" className="card p-4 flex items-center gap-3 active:scale-[0.97] transition-all">
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
              <Tag size={18} className="text-white/50" />
            </div>
            <span className="text-sm font-bold text-white">Categorías</span>
          </Link>
          <Link to="/reservas" className="card p-4 flex items-center gap-3 active:scale-[0.97] transition-all">
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
              <BookmarkCheck size={18} className="text-white/50" />
            </div>
            <span className="text-sm font-bold text-white">Reservas</span>
          </Link>
          <Link to="/medios" className="card p-4 flex items-center gap-3 active:scale-[0.97] transition-all">
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
              <Images size={18} className="text-white/50" />
            </div>
            <span className="text-sm font-bold text-white">Medios</span>
          </Link>
        </div>
      </div>

      {/* Demo clicks — solo visible al admin real */}
      {!isDemo && demoClicks !== null && (
        <div className="mb-5 card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
            <MonitorPlay size={17} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Accesos al demo</p>
            <p className="text-white font-bold text-sm">
              {demoClicks.total} {demoClicks.total === 1 ? 'vez' : 'veces'}
              {demoClicks.last && (
                <span className="text-white/30 font-normal ml-2 text-xs">
                  · último {new Date(demoClicks.last).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Recent products */}
      <div className="">
        <div className="flex items-center justify-between mb-3">
          <p className="label">Últimos productos</p>
          <Link to="/productos" className="text-accent text-xs font-bold">Ver todos</Link>
        </div>
        <div className="space-y-2">
          {loading
            ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="card flex items-center gap-3 p-3">
                <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))
            : recentProducts.map(p => (
              <Link
                key={p.id}
                to={`/productos/${p.id}`}
                className="card flex items-center gap-3 p-3 active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-600 shrink-0">
                  {p.images?.[0]
                    ? <img src={thumbUrl(p.images[0])} alt="" className="w-full h-full object-cover" loading="lazy" onError={thumbFallback(p.images[0])} />
                    : <div className="w-full h-full flex items-center justify-center text-white/10">
                      <Package size={20} />
                    </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold ${STATUS_COLOR[p.status] || 'text-white/20'}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    {p.regular_price && (
                      <span className="text-xs text-accent font-bold">
                        S/{parseFloat(p.regular_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={15} className="text-white/15 shrink-0" />
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  )
}
