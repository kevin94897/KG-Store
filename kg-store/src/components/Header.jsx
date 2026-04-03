import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, X, ChevronDown, UserCircle, Heart, BookmarkCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
]

const CATEGORIES = [
  { to: '/tienda?cat=figuras', label: 'Figuras' },
  { to: '/tienda?cat=edicion-coleccionista', label: 'Ediciones Coleccionistas' },
  { to: '/tienda?cat=coleccionables', label: 'Coleccionables' },
]

function UserAvatar({ user, profile, size = 'sm' }) {
  const src = profile?.avatar_url || user?.user_metadata?.avatar_url
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || '?'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const cls = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'

  if (src) {
    return <img src={src} alt={name} className={`${cls} rounded-full object-cover ring-1 ring-accent/40`} />
  }
  return (
    <div className={`${cls} rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent`}>
      {initials}
    </div>
  )
}

export default function Header({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const { user, profile } = useAuth()

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to.split('?')[0]) || location.search.includes(to.split('?')[1] ?? '__')
  }

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname, location.search])

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
      <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="https://mlbdbkny4xg1.i.optimole.com/w:120/h:34/q:mauto/dpr:1.3/ig:avif/https://colecciones.grupo-gomez.com/wp-content/uploads/2024/12/kg-store-logo.png"
              alt="KG Store"
              className="h-8"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {NAV_LINKS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150
                  ${isActive(item.to)
                    ? 'text-accent'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                {item.label}
                {isActive(item.to) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            ))}

            {/* Categorías dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(p => !p)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150
                  ${dropdownOpen ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                Categorías
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-dark-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 fade-in">
                  {CATEGORIES.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link
                to="/cuotas"
                className={`
                  relative px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150
                  ${isActive('/cuotas')
                    ? 'text-accent'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                ¿Cuotas?
                {isActive('/cuotas') && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Search desktop */}
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2 fade-in">
                  <input
                    autoFocus
                    className="w-52 bg-dark-700 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/60 transition-all"
                    placeholder="Buscar figuras, ediciones..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onBlur={() => { if (!q) setSearchOpen(false) }}
                  />
                  <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-accent transition-colors">
                    <Search size={18} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Favorites button desktop — only when logged in */}
            {user && (
              <Link
                to="/favoritos"
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
                aria-label="Mis favoritos"
              >
                <Heart size={20} />
              </Link>
            )}

            {/* Account button desktop */}
            <div className="hidden md:flex items-center">
              {user ? (
                <Link
                  to="/perfil"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-colors"
                >
                  <UserAvatar user={user} profile={profile} />
                  <span className="text-sm text-white/70 font-medium max-w-[100px] truncate">
                    {profile?.full_name || user.user_metadata?.full_name || 'Mi cuenta'}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-sm font-semibold transition-all"
                >
                  <UserCircle size={16} />
                  Ingresar
                </button>
              )}
            </div>

            {/* Search mobile */}
            <button
              onClick={() => setSearchOpen(p => !p)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
            >
              <Search size={20} />
            </button>

            {/* Account button mobile */}
            <div className="md:hidden">
              {user ? (
                <Link to="/perfil" className="w-9 h-9 flex items-center justify-center">
                  <UserAvatar user={user} profile={profile} />
                </Link>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
                >
                  <UserCircle size={20} />
                </button>
              )}
            </div>

            {/* Favorites button mobile — only when logged in */}
            {user && (
              <Link
                to="/favoritos"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/50 active:text-red-400 active:bg-white/10"
                aria-label="Mis favoritos"
              >
                <Heart size={20} />
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/60 active:text-white active:bg-white/10"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 fade-in">
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

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-dark/98 backdrop-blur-xl flex flex-col justify-center px-8 pt-safe fade-in">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white"
            >
              <X size={22} />
            </button>
            <nav className="space-y-2">
              {[...NAV_LINKS, ...CATEGORIES].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block text-2xl font-semibold py-2 transition-colors ${isActive(item.to) ? 'text-accent' : 'text-white/80 active:text-accent'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/favoritos"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 text-2xl font-semibold py-2 transition-colors ${isActive('/favoritos') ? 'text-red-400' : 'text-white/80 active:text-red-400'
                    }`}
                >
                  <Heart size={22} className="shrink-0" />
                  Favoritos
                </Link>
              )}
              {user && (
                <Link
                  to="/mis-reservas"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 text-2xl font-semibold py-2 transition-colors ${isActive('/mis-reservas') ? 'text-accent' : 'text-white/80 active:text-accent'
                    }`}
                >
                  <BookmarkCheck size={22} className="shrink-0" />
                  Mis reservas
                </Link>
              )}
            </nav>
            <div className="mt-12 border-t border-white/10 pt-8 space-y-4">
              {user ? (
                <Link
                  to="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <UserAvatar user={user} profile={profile} size="md" />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {profile?.full_name || user.user_metadata?.full_name || 'Mi cuenta'}
                    </p>
                    <p className="text-white/30 text-xs">{user.email}</p>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); setAuthModalOpen(true) }}
                  className="flex items-center gap-2 text-accent font-semibold text-sm"
                >
                  <UserCircle size={18} />
                  Iniciar sesión
                </button>
              )}
              <p className="text-white/50 text-sm">
                Figuras, ediciones de PS4/PS5 y coleccionables para tu colección.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </>
  )
}
