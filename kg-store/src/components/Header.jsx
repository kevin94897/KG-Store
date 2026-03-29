import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Menu, X, ShoppingBag } from 'lucide-react'

export default function Header({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (q.trim()) {
      navigate(`/tienda?search=${encodeURIComponent(q.trim())}`)
      setSearchOpen(false)
      setQ('')
    }
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-black backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14 bg-black">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png" alt="KG Store" className="h-8" />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(p => !p)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
            >
              <Search size={20} />
            </button>
            {/* <Link
              to="/carrito"
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-black text-[9px] font-semibold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link> */}
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="px-4 pb-3 fade-in">
            <input
              autoFocus
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/60"
              placeholder="Buscar figuras, ediciones..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </form>
        )}
      </header>

      {/* Fullscreen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-dark/98 backdrop-blur-xl flex flex-col justify-center px-8 pt-safe fade-in">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white"
            >
              <X size={22} />
            </button>
            <nav className="space-y-2">
              {[
                { to: '/', label: 'Inicio' },
                { to: '/tienda', label: 'Toda la tienda' },
                { to: '/tienda?cat=figuras', label: 'Figuras' },
                { to: '/tienda?cat=edicion-coleccionista', label: 'Ediciones Coleccionistas' },
                { to: '/tienda?cat=coleccionables', label: 'Coleccionables' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="block text-2xl md:text-4xl font-semibold text-white/80 active:text-accent py-2 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="text-white text-sm">
                Figuras, ediciones de PS4/PS5 y coleccionables para tu colección.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
