import { useState, useEffect, useRef } from 'react'
import { X, Package, DollarSign, AlertCircle, CheckCircle, Search, ChevronDown } from 'lucide-react'
import { supabase, supabaseAdmin } from '../utils/supabase'
import { useDemo } from '../context/DemoContext'

const METHOD_OPTIONS = [
  { id: 'yape', label: '📱 Yape' },
  { id: 'transfer', label: '🏦 Transferencia BCP' },
  { id: 'cash', label: '💵 Efectivo' },
  { id: 'other', label: '🔄 Otro' },
]

function generateCode() {
  return 'KG-' + Math.random().toString(36).toUpperCase().slice(2, 8)
}

function UserAvatar({ profile }) {
  const src = profile.avatar_url
  const name = profile.full_name || profile.user_email || '?'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (src) return <img src={src} alt={name} className="w-7 h-7 rounded-full object-cover" />
  return (
    <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center font-bold text-accent text-[10px]">
      {initials}
    </div>
  )
}

function UserDropdown({ users, selected, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (u.full_name?.toLowerCase().includes(q) || u.user_email?.toLowerCase().includes(q))
  })

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 bg-dark-700 border rounded-xl text-sm transition-colors text-left
          ${open ? 'border-accent/50' : 'border-white/8 hover:border-white/20'}
          ${!selected ? 'text-white/25' : 'text-white'}`}
      >
        {selected
          ? <><UserAvatar profile={selected} /><span className="flex-1 truncate">{selected.full_name || selected.user_email}</span></>
          : <><div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Search size={12} className="text-white/30" /></div><span className="flex-1">Seleccionar cliente *</span></>
        }
        <ChevronDown size={14} className={`text-white/25 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50 fade-in">
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-white/25 text-xs py-4">Sin resultados</p>
            ) : filtered.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => { onSelect(u); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <UserAvatar profile={u} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{u.full_name || <span className="text-white/30 italic">Sin nombre</span>}</p>
                  <p className="text-white/35 text-[10px] truncate">{u.user_email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewReservationModal({ onClose, onCreated }) {
  const { demoGuard } = useDemo()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState({
    product_name: '',
    product_price: '',
    payment_method: 'yape',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, user_email, avatar_url').order('full_name')
      .then(({ data }) => { setUsers(data || []); setLoadingUsers(false) })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (demoGuard(() => {}) === false) return
    if (!selectedUser) { setError('Debes seleccionar un cliente.'); return }
    if (!form.product_name.trim()) { setError('El nombre del producto es obligatorio.'); return }

    setSaving(true)
    setError('')

    try {
      const reservation_code = generateCode()
      const price = form.product_price ? parseFloat(form.product_price) : null

      const { error: insertError } = await supabaseAdmin.from('reservations').insert({
        reservation_code,
        user_id: selectedUser.id,
        user_name: selectedUser.full_name || selectedUser.user_email,
        user_email: selectedUser.user_email,
        product_name: form.product_name.trim(),
        product_price: price,
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
        status: 'confirmed',
        payment_proof_url: '',
        created_by_admin: true,
      })

      if (insertError) throw new Error('Error al crear la reserva.')

      if (selectedUser.user_email) {
        supabase.functions.invoke('notify-status-change', {
          body: {
            reservation_code,
            product_name: form.product_name.trim(),
            status: 'confirmed',
            user_email: selectedUser.user_email,
            user_name: selectedUser.full_name || selectedUser.user_email,
          },
        }).catch(console.error)
      }

      setDone(true)
      onCreated?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#111111] rounded-t-3xl md:rounded-3xl shadow-2xl fade-in max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-[#111111] flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5 z-10">
          <div>
            <h2 className="text-base font-bold text-white">Nueva reserva</h2>
            <p className="text-white/30 text-xs mt-0.5">Creada manualmente por el admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center px-6 py-10">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mb-4">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">¡Reserva creada!</h3>
            <p className="text-white/40 text-sm mb-5">Se notificó al cliente por correo con el estado confirmado.</p>
            <button onClick={onClose} className="w-full bg-accent text-black font-bold text-sm py-3 rounded-2xl">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">

            {/* Cliente */}
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Cliente</p>
            {loadingUsers ? (
              <div className="skeleton h-11 rounded-xl" />
            ) : (
              <UserDropdown users={users} selected={selectedUser} onSelect={setSelectedUser} />
            )}
            {/* {selectedUser && (
              <div className="flex items-center gap-2.5 bg-white/3 border border-white/6 rounded-xl px-3 py-2.5 fade-in">
                <UserAvatar profile={selectedUser} />
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{selectedUser.full_name || '—'}</p>
                  <p className="text-white/35 text-[10px] truncate">{selectedUser.user_email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="ml-auto text-white/20 hover:text-white/50 transition-colors shrink-0">
                  <X size={13} />
                </button>
              </div>
            )} */}

            <div className="border-t border-white/5 pt-1" />

            {/* Producto */}
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Producto</p>
            <div className="relative">
              <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder="Nombre del producto *"
                value={form.product_name}
                onChange={e => set('product_name', e.target.value)}
                className="w-full bg-dark-700 border border-white/8 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-sm">
                S/
              </span>
              <input
                type="number"
                placeholder="Precio (ej: 250)"
                value={form.product_price}
                onChange={e => set('product_price', e.target.value)}
                className="w-full bg-dark-700 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Método de pago */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Método de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {METHOD_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set('payment_method', m.id)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left
                      ${form.payment_method === m.id
                        ? 'bg-accent/10 border-accent/40 text-accent'
                        : 'bg-dark-700 border-white/8 text-white/50 hover:border-white/20'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Notas internas (opcional)</p>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Detalles adicionales del pedido..."
                rows={2}
                className="w-full bg-dark-700 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <div className="bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
              <p className="text-accent/70 text-xs">
                La reserva se creará con estado <span className="font-bold text-accent">Confirmada</span> y se enviará un email al cliente automáticamente.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || !selectedUser}
              className="w-full flex items-center justify-center gap-2 bg-accent text-black font-bold text-sm py-3.5 rounded-2xl hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                : 'Crear reserva y notificar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
