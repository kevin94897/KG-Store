import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, Search, BookmarkCheck, Heart, ChevronRight, RefreshCw } from 'lucide-react'

function UserAvatar({ profile }) {
  const src = profile.avatar_url
  const name = profile.full_name || profile.user_email || '?'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (src) {
    return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center font-bold text-accent text-sm">
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const { user: adminUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const fetch = async () => {
    setLoading(true)

    // Fetch profiles with reservation and favorite counts
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!profiles) { setLoading(false); return }

    // Fetch reservation counts per user
    const { data: resCounts } = await supabase
      .from('reservations')
      .select('user_id')

    // Fetch favorite counts per user
    const { data: favCounts } = await supabase
      .from('favorites')
      .select('user_id')

    const resMap = (resCounts || []).reduce((acc, r) => {
      acc[r.user_id] = (acc[r.user_id] || 0) + 1
      return acc
    }, {})

    const favMap = (favCounts || []).reduce((acc, f) => {
      acc[f.user_id] = (acc[f.user_id] || 0) + 1
      return acc
    }, {})

    setUsers(profiles.filter(p => p.id !== adminUser?.id).map(p => ({
      ...p,
      reservation_count: resMap[p.id] || 0,
      favorite_count: favMap[p.id] || 0,
    })))
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.user_email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-accent" />
            Usuarios
          </h1>
          <p className="text-white/40 text-xs mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-dark-700 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{search ? 'Sin resultados' : 'No hay usuarios registrados'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <button
              key={user.id}
              onClick={() => navigate(`/usuarios/${user.id}`)}
              className="w-full flex items-center gap-3 p-3 bg-[#111111] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-[#161616] transition-all text-left"
            >
              <UserAvatar profile={user} />

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user.full_name || <span className="text-white/30 italic font-normal">Sin nombre</span>}
                </p>
                <p className="text-white/40 text-xs truncate">{user.user_email || '—'}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {user.reservation_count > 0 && (
                  <div className="flex items-center gap-1 text-yellow-400/70">
                    <BookmarkCheck size={13} />
                    <span className="text-xs font-semibold">{user.reservation_count}</span>
                  </div>
                )}
                {user.favorite_count > 0 && (
                  <div className="flex items-center gap-1 text-red-400/70">
                    <Heart size={13} />
                    <span className="text-xs font-semibold">{user.favorite_count}</span>
                  </div>
                )}
                <ChevronRight size={15} className="text-white/20" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
