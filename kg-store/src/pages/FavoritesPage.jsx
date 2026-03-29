import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { supabase } from '../utils/supabase'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import useSeo from '../hooks/useSeo'

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const { favorites, loading: favsLoading } = useFavorites(user?.id)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const navigate = useNavigate()

  useSeo({ title: 'Mis favoritos | KG Store', url: '/favoritos' })

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/')
  }, [user, authLoading, navigate])

  // Fetch product details for all favorited IDs
  useEffect(() => {
    if (!user || favsLoading) return
    if (favorites.size === 0) { setProducts([]); return }

    setLoadingProducts(true)
    const ids = [...favorites]
    supabase
      .from('products')
      .select('id, name, slug, images, regular_price, sale_price, in_stock, categories(name, slug)')
      .in('id', ids)
      .then(({ data }) => {
        setProducts(data || [])
        setLoadingProducts(false)
      })
  }, [favorites, favsLoading, user])

  const isLoading = authLoading || favsLoading || loadingProducts

  return (
    <div className="max-w-7xl mx-auto w-full min-h-dvh pt-14 pb-16 fade-up">

      {/* Header */}
      <div className="px-4 pt-5 mb-6">
        <Link
          to="/perfil"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-5"
        >
          <ArrowLeft size={15} />
          Mi cuenta
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <Heart size={18} className="text-red-400 fill-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mis favoritos</h1>
            {!isLoading && (
              <p className="text-white/30 text-xs mt-0.5">
                {products.length === 0
                  ? 'Aún no tienes favoritos'
                  : `${products.length} producto${products.length !== 1 ? 's' : ''} guardado${products.length !== 1 ? 's' : ''}`
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <Heart size={32} className="text-white/10" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-2">Sin favoritos aún</h2>
            <p className="text-white/30 text-sm max-w-xs mb-8">
              Guarda los productos que más te gustan tocando el ❤️ en la página de cada producto.
            </p>
            <Link
              to="/tienda"
              className="inline-flex items-center gap-2 bg-accent text-black font-bold text-sm px-6 py-3 rounded-full hover:brightness-105 active:scale-95 transition-all"
            >
              <ShoppingBag size={16} />
              Explorar tienda
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
