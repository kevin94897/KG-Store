import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import {
  CreditCard, ChevronRight, ChevronDown, Phone,
  Mail, Package, RefreshCw, User, Trash2
} from 'lucide-react'

// ─── Constantes ───────────────────────────────────────────────
const STATUS_STYLE = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reviewing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approved:  'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  completed: 'bg-white/5 text-white/30 border-white/8',
}
const STATUS_LABEL = {
  pending:   'Pendiente',
  reviewing: 'En revisión',
  approved:  'Aprobado',
  rejected:  'Rechazado',
  completed: 'Completado',
}

// ─── Card individual ──────────────────────────────────────────
function RequestCard({ req, onUpdate, selected, onToggleSelect }) {
  const [open, setOpen]     = useState(false)
  const [status, setStatus] = useState(req.status)
  const [saving, setSaving] = useState(false)

  const date = new Date(req.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const updateStatus = async (s) => {
    setSaving(true)
    await supabase.from('installment_requests').update({ status: s }).eq('id', req.id)
    setStatus(s)
    onUpdate()
    setSaving(false)
  }

  const waMsg = encodeURIComponent(
    `Hola ${req.customer_name}, te contactamos de KG Store sobre tu solicitud de pago en cuotas para *${req.product_name}*.`
  )

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">

      {/* ── Fila principal ── */}
      <div className="flex items-center gap-3 p-4 bg-[#0B0B0B]">
        {/* Checkbox selección */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-white/20 bg-[#111] accent-[#CCFF00] shrink-0"
        />

        {/* Info resumida */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-bold text-white truncate">{req.customer_name}</p>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLE[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-xs text-white/40 truncate">{req.product_name}</p>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/20">
            <span>{date}</span>
            {req.product_price && (
              <span className="text-[#CCFF00] font-bold">
                S/{parseFloat(req.product_price).toFixed(2)}
              </span>
            )}
            {req.amount_per_installment && (
              <span>{req.installments}× S/{parseFloat(req.amount_per_installment).toFixed(2)} {req.frequency}</span>
            )}
          </div>
        </div>

        {/* Botón expandir */}
        <button
          onClick={() => setOpen(p => !p)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 active:text-white shrink-0"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* ── Detalle expandido ── */}
      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">

          {/* Contacto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-white/30 shrink-0" />
              <span className="text-white/60">{req.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-white/30 shrink-0" />
              <a
                href={`mailto:${req.customer_email}`}
                className="text-[#CCFF00] underline truncate"
              >
                {req.customer_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-white/30 shrink-0" />
              <a
                href={`https://wa.me/${req.customer_phone.replace(/\D/g, '')}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 font-semibold"
              >
                {req.customer_phone} — WhatsApp →
              </a>
            </div>
          </div>

          {/* Detalle del pedido */}
          <div className="bg-[#191919] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-white/30 mb-2">
              <Package size={12} /> Detalle del pedido
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Producto</span>
              <span className="text-white font-semibold text-right max-w-[60%] leading-tight">
                {req.product_name}
              </span>
            </div>
            {req.product_price && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Precio total</span>
                <span className="text-[#CCFF00] font-bold">
                  S/{parseFloat(req.product_price).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Plan</span>
              <span className="text-white font-semibold">
                {req.installments} cuotas {req.frequency}s
              </span>
            </div>
            {req.amount_per_installment && (
              <div className="flex justify-between text-sm border-t border-white/5 pt-2 mt-1">
                <span className="text-white/50">Por cuota</span>
                <span className="text-[#CCFF00] font-black text-base">
                  S/{parseFloat(req.amount_per_installment).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Notas del cliente */}
          {req.notes && (
            <div className="bg-[#191919] rounded-xl p-3">
              <p className="text-xs text-white/30 mb-1">Mensaje del cliente</p>
              <p className="text-sm text-white/60 leading-relaxed">{req.notes}</p>
            </div>
          )}

          {/* Cambiar estado */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/25 mb-2">
              Cambiar estado
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={e => updateStatus(e.target.value)}
                disabled={saving}
                className="w-full bg-[#191919] border border-white/8 rounded-xl px-4 py-3
                  text-sm text-white appearance-none outline-none
                  focus:border-[#CCFF00]/50 transition-colors pr-10 disabled:opacity-50"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
              />
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${req.customer_phone.replace(/\D/g, '')}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white
              font-bold py-3 rounded-xl text-sm active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar por WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function InstallmentRequestsPage() {
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]         = useState('all')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [busy, setBusy]             = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('installment_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setSelectedIds(new Set())
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`¿Eliminar ${selectedIds.size} solicitud(es)?`)) return
    setBusy(true)
    const { error } = await supabase
      .from('installment_requests')
      .delete()
      .in('id', Array.from(selectedIds))
    if (error) alert('Error eliminando: ' + error.message)
    else await load()
    setBusy(false)
  }

  const FILTERS = [
    { key: 'all',       label: 'Todas' },
    { key: 'pending',   label: 'Pendientes' },
    { key: 'reviewing', label: 'En revisión' },
    { key: 'approved',  label: 'Aprobadas' },
    { key: 'completed', label: 'Completadas' },
  ]

  const filtered      = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount  = requests.filter(r => r.status === 'pending').length

  return (
    <div
      className="min-h-dvh bg-[#0A0A0A] pb-24"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* ── Header sticky ── */}
      <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-xl z-10 px-4 pt-5 pb-3 border-b border-white/5">

        {/* Título + acciones */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Cuotas</h1>
              {pendingCount > 0 && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                  {pendingCount} nuevas
                </span>
              )}
            </div>
            <p className="text-xs text-white/25">{requests.length} solicitudes en total</p>
          </div>

          {/* Botones acción + refresh */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={deleteSelected}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl
                    bg-red-500/20 text-red-300 border border-red-500/30 active:scale-95
                    transition-all disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  {selectedIds.size}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={busy}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-white/8
                    text-white/50 border border-white/10 active:scale-95 transition-all disabled:opacity-40"
                >
                  Limpiar
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              className="w-9 h-9 bg-[#222] border border-white/5 rounded-xl flex items-center
                justify-center text-white/40 active:text-white"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                ${filter === f.key ? 'bg-[#CCFF00] text-black' : 'bg-[#191919] text-white/35'}`}
            >
              {f.label}
              {f.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1 text-yellow-400">({pendingCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/5 rounded-2xl p-4 space-y-2">
              <div className="h-4 rounded skeleton" />
              <div className="h-3 rounded skeleton w-3/4" />
              <div className="h-3 rounded skeleton w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={40} className="mx-auto mb-3 text-white/8" />
            <p className="text-sm font-semibold text-white/20">
              Sin solicitudes{filter !== 'all' ? ` "${STATUS_LABEL[filter]}"` : ''}
            </p>
          </div>
        ) : (
          filtered.map(r => (
            <RequestCard
              key={r.id}
              req={r}
              onUpdate={load}
              selected={selectedIds.has(r.id)}
              onToggleSelect={() => toggleSelect(r.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}