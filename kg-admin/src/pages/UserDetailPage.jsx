import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useDemo, DEMO_CLIENT, DEMO_CLIENT_RESERVATIONS } from '../context/DemoContext'
import {
  ArrowLeft, User, Mail, Phone, Calendar, Heart,
  BookmarkCheck, ExternalLink, Package
} from 'lucide-react'

const STATUS_STYLE = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10  text-green-400  border-green-500/20',
  rejected:  'bg-red-500/10    text-red-400    border-red-500/20',
}
const STATUS_LABEL = { pending: 'Pendiente', confirmed: 'Confirmada', rejected: 'Rechazada' }
const METHOD_LABEL  = { yape: '📱 Yape', transfer: '🏦 Transferencia' }

function Avatar({ profile }) {
  const src = profile?.avatar_url
  const name = profile?.full_name || profile?.user_email || '?'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (src) {
    return <img src={src} alt={name} className="w-16 h-16 rounded-full object-cover ring-2 ring-accent/30" />
  }
  return (
    <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent text-xl">
      {initials}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-white/25 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-white/70 text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemo } = useDemo()
  const [profile, setProfile] = useState(null)
  const [reservations, setReservations] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('reservations')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      if (isDemo && id === DEMO_CLIENT.id) {
        setProfile(DEMO_CLIENT)
        setReservations(DEMO_CLIENT_RESERVATIONS)
        setFavorites([])
        setLoading(false)
        return
      }

      const [
        { data: prof },
        { data: res },
        { data: favs },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('reservations').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('favorites').select('*, products(id, name, slug, images, sale_price, regular_price, in_stock)').eq('user_id', id).order('created_at', { ascending: false }),
      ])
      setProfile(prof)
      setReservations(res || [])
      setFavorites(favs || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="pt-6 pb-24">
      <div className="skeleton h-8 w-32 rounded-xl mb-6" />
      <div className="flex gap-3 mb-6">
        <div className="skeleton w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-4 w-56 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
      </div>
    </div>
  )

  if (!profile) return (
    <div className="pt-6 pb-24 text-center">
      <p className="text-white/30">Usuario no encontrado</p>
      <button onClick={() => navigate('/usuarios')} className="text-accent text-sm mt-2">← Volver</button>
    </div>
  )

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="pt-6 pb-24">
      {/* Volver */}
      <button
        onClick={() => navigate('/usuarios')}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Usuarios
      </button>

      {/* Header de perfil */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar profile={profile} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">
            {profile.full_name || <span className="text-white/30 italic font-normal">Sin nombre</span>}
          </h1>
          <p className="text-white/40 text-sm truncate">{profile.user_email}</p>
        </div>
      </div>

      {/* Datos del perfil */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon={User}     label="Nombre"    value={profile.full_name} />
        <InfoRow icon={Mail}     label="Email"     value={profile.user_email} />
        <InfoRow icon={Phone}    label="Teléfono"  value={profile.phone} />
        <InfoRow icon={Calendar} label="Registrado" value={joinDate} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <BookmarkCheck size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{reservations.length}</p>
            <p className="text-white/30 text-xs">Reserva{reservations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Heart size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{favorites.length}</p>
            <p className="text-white/30 text-xs">Favorito{favorites.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'reservations', label: 'Reservas', count: reservations.length, icon: BookmarkCheck },
          { key: 'favorites',    label: 'Favoritos', count: favorites.length,   icon: Heart },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all
              ${tab === t.key
                ? 'bg-accent text-black border-accent'
                : 'bg-white/5 text-white/50 border-white/8 hover:border-white/20'}`}
          >
            <t.icon size={12} />
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${tab === t.key ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Reservas */}
      {tab === 'reservations' && (
        <div className="space-y-2">
          {reservations.length === 0 ? (
            <div className="text-center py-10">
              <BookmarkCheck size={28} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/25 text-sm">Sin reservas</p>
            </div>
          ) : reservations.map(res => (
            <div key={res.id} className="bg-[#111111] border border-white/5 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{res.product_name}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {new Date(res.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}{METHOD_LABEL[res.payment_method] || res.payment_method}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLE[res.status] || STATUS_STYLE.pending}`}>
                    {STATUS_LABEL[res.status] || res.status}
                  </span>
                  {res.product_price && (
                    <p className="text-accent text-sm font-bold mt-1">S/{Number(res.product_price).toFixed(2)}</p>
                  )}
                </div>
              </div>
              {res.payment_proof_url && (
                <a
                  href={res.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-accent transition-colors"
                >
                  <ExternalLink size={12} /> Ver comprobante
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Favoritos */}
      {tab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-10">
              <Heart size={28} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/25 text-sm">Sin favoritos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map(fav => {
                const p = fav.products
                if (!p) return null
                const price = p.sale_price || p.regular_price
                return (
                  <div key={fav.id} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
                    {p.images?.[0] && (
                      <div className="aspect-square bg-black overflow-hidden">
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-white text-xs font-semibold truncate leading-snug">{p.name}</p>
                      {price && (
                        <p className="text-accent text-xs font-bold mt-1">S/{Number(price).toFixed(2)}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full
                          ${p.in_stock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {p.in_stock ? 'En stock' : 'Agotado'}
                        </span>
                        {p.slug && (
                          <a
                            href={`/producto/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/20 hover:text-accent transition-colors"
                          >
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
