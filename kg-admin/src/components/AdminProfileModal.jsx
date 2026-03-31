import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Check, LogOut } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminProfileModal({ onClose }) {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setForm({ full_name: data.full_name || '', phone: data.phone || '' })
      })
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      user_email: user.email,
      full_name: form.full_name,
      phone: form.phone,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = (form.full_name || user?.email || '?')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-[#111111] rounded-3xl shadow-2xl fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Mi perfil</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent text-base">
              {initials}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{form.full_name || 'Administrador'}</p>
              <p className="text-white/40 text-xs">{user?.email}</p>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1.5">Nombre</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Tu nombre completo"
                className="w-full bg-dark-700 border border-white/8 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Email (solo lectura) */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-dark-600/50 border border-white/5 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white/30 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-bold block mb-1.5">Teléfono</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Ej: 987654321"
                className="w-full bg-dark-700 border border-white/8 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {saved && (
            <p className="text-green-400 text-xs text-center">¡Perfil actualizado!</p>
          )}

          {/* Guardar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-accent text-black font-bold text-sm py-3 rounded-2xl hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              : <><Check size={15} /> Guardar cambios</>}
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 font-semibold text-sm py-2.5 rounded-2xl transition-all"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
