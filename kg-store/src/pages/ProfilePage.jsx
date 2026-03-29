import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Phone, Mail, Edit2, Check, LogOut, ArrowLeft, ShoppingBag, Heart, BookmarkCheck } from 'lucide-react'
import useSeo from '../hooks/useSeo'

function Avatar({ user, profile, size = 'lg' }) {
  const src = profile?.avatar_url || user?.user_metadata?.avatar_url
  const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || '?'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const sizeClass = size === 'lg'
    ? 'w-20 h-20 text-2xl'
    : 'w-8 h-8 text-sm'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-accent/30`}
      />
    )
  }
  return (
    <div className={`${sizeClass} rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent`}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, loading, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })

  useSeo({ title: 'Mi cuenta | KG Store', url: '/perfil' })

  useEffect(() => {
    if (!loading && !user) navigate('/')
  }, [user, loading, navigate])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      })
    } else if (user) {
      setForm(f => ({
        ...f,
        full_name: user.user_metadata?.full_name || '',
      }))
    }
  }, [profile, user])

  const handleSave = async () => {
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto pt-14 min-h-dvh flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Usuario'
  const isGoogleUser = user.app_metadata?.provider === 'google'

  return (
    <div className="max-w-lg mx-auto w-full min-h-dvh pt-14 pb-16 px-4 fade-up">

      {/* Volver */}
      <div className="pt-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Inicio
        </Link>
      </div>

      {/* Avatar + nombre */}
      <div className="flex flex-col items-center text-center mb-8">
        <Avatar user={user} profile={profile} size="lg" />
        <h1 className="text-xl font-bold text-white mt-4">{displayName}</h1>
        <p className="text-white/40 text-sm mt-1">{user.email}</p>
        {isGoogleUser && (
          <span className="mt-2 inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white/50">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Cuenta Google
          </span>
        )}
      </div>

      {/* Datos del perfil */}
      <div className="bg-dark-800 border border-white/5 rounded-3xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Información personal</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-accent text-xs font-semibold hover:underline"
            >
              <Edit2 size={12} /> Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-accent text-xs font-semibold hover:underline disabled:opacity-50"
            >
              {saving
                ? <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" />
                : <Check size={12} />}
              Guardar
            </button>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {/* Nombre */}
          <div className="flex items-center gap-3 px-5 py-4">
            <User size={15} className="text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Nombre</p>
              {editing ? (
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
                  placeholder="Tu nombre completo"
                />
              ) : (
                <p className="text-sm text-white truncate">
                  {form.full_name || <span className="text-white/30 italic">Sin nombre</span>}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail size={15} className="text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Email</p>
              <p className="text-sm text-white/60 truncate">{user.email}</p>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Phone size={15} className="text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Teléfono</p>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white outline-none focus:border-accent/60 transition-colors"
                  placeholder="Ej: 987654321"
                />
              ) : (
                <p className="text-sm text-white truncate">
                  {form.phone || <span className="text-white/30 italic">Sin teléfono</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback guardado */}
      {saved && (
        <p className="text-center text-green-400 text-xs mb-4 fade-in">
          ¡Perfil actualizado correctamente!
        </p>
      )}

      {/* Acceso rápido */}
      <div className="bg-dark-800 border border-white/5 rounded-3xl overflow-hidden mb-4">
        <Link
          to="/tienda"
          className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <ShoppingBag size={15} className="text-white/30" />
          <span className="text-sm text-white/70">Ver tienda</span>
          <ArrowLeft size={14} className="text-white/20 ml-auto rotate-180" />
        </Link>
        <Link
          to="/favoritos"
          className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <Heart size={15} className="text-red-400/60" />
          <span className="text-sm text-white/70">Mis favoritos</span>
          <ArrowLeft size={14} className="text-white/20 ml-auto rotate-180" />
        </Link>
        <Link
          to="/mis-reservas"
          className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <BookmarkCheck size={15} className="text-accent/60" />
          <span className="text-sm text-white/70">Mis reservas</span>
          <ArrowLeft size={14} className="text-white/20 ml-auto rotate-180" />
        </Link>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 font-semibold text-sm py-3 px-4 rounded-2xl transition-all active:scale-95"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  )
}
