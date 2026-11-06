import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../utils/supabase'
import { useDemo } from '../context/DemoContext'
import {
  BookmarkCheck, ChevronDown, ChevronRight, ExternalLink,
  RefreshCw, User, Mail, Package, CreditCard, Calendar, Trash2, Plus,
  Pencil, Check, X, Hash, AlertCircle
} from 'lucide-react'
import NewReservationModal from '../components/NewReservationModal'

const STATUS_STYLE = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10  text-green-400  border-green-500/20',
  rejected:  'bg-red-500/10    text-red-400    border-red-500/20',
  completed: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  cancelled: 'bg-white/5       text-ink-2   border-line-2',
}
const STATUS_LABEL = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  rejected:  'Rechazada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}
const METHOD_LABEL = {
  yape: '📱 Yape',
  transfer: '🏦 Transferencia',
  cash: '💵 Efectivo',
  other: '🔄 Otro',
}
const METHOD_OPTIONS = ['yape', 'transfer', 'cash', 'other']

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-ink-3 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-ink-3 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-ink text-sm">{value}</p>
      </div>
    </div>
  )
}

function ImagePreview({ url, label }) {
  if (!url) return null
  return (
    <div>
      <p className="text-[10px] text-ink-3 uppercase tracking-widest font-bold mb-2">{label}</p>
      <div className="relative rounded-xl overflow-hidden border border-line-2 bg-black max-w-xs">
        <img src={url} alt={label} className="w-full max-h-56 object-contain" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-accent hover:text-black transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}

const formFromRes = (res) => ({
  product_name: res.product_name || '',
  product_price: res.product_price ?? '',
  advance_payment: res.advance_payment ?? '',
  installments_count: res.installments_count ?? '',
  installment_frequency: res.installment_frequency || 'monthly',
  payment_method: res.payment_method || 'yape',
  notes: res.notes || '',
})

function ReservationCard({ res, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(res.status)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(() => formFromRes(res))
  const [editSaving, setEditSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const { demoGuard } = useDemo()

  // Sincronizar con datos frescos tras recargar la lista
  useEffect(() => { setStatus(res.status) }, [res.status])
  useEffect(() => {
    if (!editing) setEditForm(formFromRes(res))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res, editing])

  const setField = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  const handleDelete = async () => {
    if (demoGuard(() => {}) === false) return
    setDeleting(true)
    setActionError(null)
    const { error } = await supabaseAdmin.from('reservations').delete().eq('id', res.id)
    if (error) {
      setActionError(`No se pudo eliminar: ${error.message}`)
      setDeleting(false)
      setConfirmDelete(false)
      return
    }
    onDelete(res.id)
  }

  const date = new Date(res.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const updateStatus = async (s) => {
    if (demoGuard(() => {}) === false) return
    setSaving(true)
    setActionError(null)
    const { error } = await supabaseAdmin.from('reservations').update({ status: s, updated_at: new Date().toISOString() }).eq('id', res.id)
    if (error) {
      setActionError(`No se pudo cambiar el estado: ${error.message}`)
      setSaving(false)
      return
    }
    setStatus(s)
    onUpdate()

    if (s === 'confirmed' || s === 'rejected') {
      supabase.functions.invoke('notify-status-change', {
        body: {
          reservation_code: res.reservation_code,
          product_name: res.product_name,
          status: s,
          user_email: res.user_email,
          user_name: res.user_name,
        },
      }).catch(console.error)
    }
    setSaving(false)
  }

  const handleEditSave = async () => {
    if (demoGuard(() => {}) === false) return
    setActionError(null)

    const price = editForm.product_price !== '' ? parseFloat(editForm.product_price) : null
    const advance = editForm.advance_payment !== '' ? parseFloat(editForm.advance_payment) : null
    const installments = editForm.installments_count !== '' ? parseInt(editForm.installments_count, 10) : null

    if (!editForm.product_name.trim()) return setActionError('El nombre del producto es obligatorio.')
    if (price != null && (isNaN(price) || price < 0)) return setActionError('El precio no es válido.')
    if (advance != null && (isNaN(advance) || advance < 0)) return setActionError('El adelanto no es válido.')
    if (price != null && advance != null && advance > price) return setActionError('El adelanto no puede ser mayor que el precio total.')
    if (installments != null && (isNaN(installments) || installments < 1)) return setActionError('El número de cuotas debe ser 1 o más.')

    setEditSaving(true)
    const { error } = await supabaseAdmin.from('reservations').update({
      product_name: editForm.product_name.trim(),
      product_price: price,
      advance_payment: advance,
      installments_count: installments,
      installment_frequency: editForm.installment_frequency || null,
      payment_method: editForm.payment_method,
      notes: editForm.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', res.id)
    setEditSaving(false)
    if (error) {
      setActionError(`No se pudo guardar: ${error.message}`)
      return
    }
    setEditing(false)
    onUpdate()
  }

  const handleEditCancel = () => {
    setEditing(false)
    setActionError(null)
    setEditForm(formFromRes(res))
  }

  const saldo = editForm.product_price && editForm.advance_payment
    ? Math.max(0, parseFloat(editForm.product_price) - parseFloat(editForm.advance_payment))
    : res.product_price && res.advance_payment
      ? Math.max(0, parseFloat(res.product_price) - parseFloat(res.advance_payment))
      : null

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">

      {/* Fila principal */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
          {STATUS_LABEL[status] || status}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{res.product_name}</p>
          <p className="text-ink-2 text-xs truncate">{res.user_name} · {res.user_email}</p>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          {res.product_price && (
            <p className="text-accent text-sm font-bold">S/{Number(res.product_price).toFixed(2)}</p>
          )}
          <p className="text-ink-3 text-xs">{METHOD_LABEL[res.payment_method] || res.payment_method}</p>
        </div>
        <span className="text-ink-3 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {/* Detalle expandido */}
      {open && (
        <div className="border-t border-line p-4 space-y-4">

          {actionError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-xs text-red-400">{actionError}</p>
              <button onClick={() => setActionError(null)} className="text-red-400/60 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          )}

          {/* — Cabecera + acciones (editar / eliminar) — */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-ink-3 uppercase tracking-widest font-bold">
              {editing ? 'Editando reserva' : 'Datos de la reserva'}
            </p>
            {!editing && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-400 font-semibold">¿Eliminar reserva?</p>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-surface-2 border border-line-2 text-ink-2 text-xs font-bold rounded-xl hover:bg-surface-3 hover:text-ink active:scale-95 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {deleting
                      ? <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" />
                      : <><Trash2 size={13} /> Sí, eliminar</>}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActionError(null); setEditing(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/40 text-accent text-xs font-bold rounded-xl hover:bg-accent/20 active:scale-95 transition-all"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )
            )}
          </div>

          {editing ? (
            /* ── Modo edición ── */
            <div className="space-y-3">
              {/* Producto */}
              <div>
                <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={editForm.product_name}
                  onChange={e => setField('product_name', e.target.value)}
                  className="w-full bg-white/5 border border-line-2 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Precio + Adelanto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Precio total</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">S/</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={editForm.product_price}
                      onChange={e => setField('product_price', e.target.value)}
                      className="w-full bg-white/5 border border-line-2 rounded-xl pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Adelanto</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">S/</span>
                    <input
                      type="number" min="0" step="0.01"
                      value={editForm.advance_payment}
                      onChange={e => setField('advance_payment', e.target.value)}
                      className="w-full bg-white/5 border border-line-2 rounded-xl pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Cuotas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Nº cuotas</label>
                  <input
                    type="number" min="1"
                    value={editForm.installments_count}
                    onChange={e => setField('installments_count', e.target.value)}
                    className="w-full bg-white/5 border border-line-2 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Frecuencia</label>
                  <div className="flex gap-2">
                    {[{ id: 'weekly', label: 'Semanal' }, { id: 'monthly', label: 'Mensual' }].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setField('installment_frequency', f.id)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all
                          ${editForm.installment_frequency === f.id
                            ? 'bg-accent/10 border-accent/40 text-accent'
                            : 'bg-white/5 border-line-2 text-ink-2 hover:border-white/20'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Método de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHOD_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => setField('payment_method', m)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition-all text-left px-3
                        ${editForm.payment_method === m
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-white/5 border-line-2 text-ink-2 hover:border-white/20'}`}
                    >
                      {METHOD_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-[10px] text-ink-3 uppercase tracking-widest font-bold block mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={e => setField('notes', e.target.value)}
                  className="w-full bg-white/5 border border-line-2 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors resize-none"
                />
              </div>

              {/* Acciones edición */}
              <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
                <button
                  onClick={handleEditCancel}
                  disabled={editSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-line-2 text-ink text-xs font-bold rounded-xl hover:bg-white/10 hover:text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  <X size={13} /> Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent border border-accent text-black text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {editSaving
                    ? <span className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                    : <><Check size={13} /> Guardar</>}
                </button>
              </div>
            </div>
          ) : (
            /* ── Modo visualización ── */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow icon={User}       label="Cliente"   value={res.user_name || '—'} />
                <InfoRow icon={Mail}       label="Email"     value={res.user_email || '—'} />
                <InfoRow icon={Package}    label="Producto"  value={res.product_name} />
                <InfoRow icon={CreditCard} label="Método"    value={METHOD_LABEL[res.payment_method] || res.payment_method} />
                {res.product_price != null && (
                  <InfoRow icon={CreditCard} label="Precio total" value={`S/${Number(res.product_price).toFixed(2)}`} />
                )}
                {res.advance_payment != null && (
                  <InfoRow icon={CreditCard} label="Adelanto pagado" value={`S/${Number(res.advance_payment).toFixed(2)}`} />
                )}
                {saldo != null && (
                  <InfoRow icon={CreditCard} label="Saldo restante" value={`S/${saldo.toFixed(2)}`} />
                )}
                {res.installments_count != null && (
                  <InfoRow
                    icon={Hash}
                    label="Cuotas"
                    value={`${res.installments_count} ${res.installment_frequency === 'weekly' ? 'semanales' : 'mensuales'}`}
                  />
                )}
                <InfoRow icon={Calendar} label="Fecha" value={date} />
              </div>
              {res.notes && (
                <div className="bg-white/3 border border-line rounded-xl px-3 py-2">
                  <p className="text-[10px] text-ink-3 uppercase tracking-widest font-bold mb-1">Notas</p>
                  <p className="text-ink text-sm">{res.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Imágenes */}
          <div className="space-y-3">
            <ImagePreview url={res.reference_photo_url} label="Foto referencial del producto" />
            <ImagePreview url={res.payment_proof_url} label="Comprobante de pago" />
          </div>

          {/* Cambiar estado */}
          <div>
            <p className="text-[10px] text-ink-3 uppercase tracking-widest font-bold mb-2">Actualizar estado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  disabled={saving || status === key}
                  onClick={() => updateStatus(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40
                    ${status === key
                      ? `${STATUS_STYLE[key]} opacity-100`
                      : 'bg-white/5 border-line-2 text-ink-2 hover:bg-white/10'}`}
                >
                  {saving && status !== key
                    ? <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin inline-block" />
                    : label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const { demoGuard } = useDemo()

  const loadReservations = async () => {
    setLoading(true)
    const query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    const { data } = await query
    setReservations(data || [])
    setLoading(false)
  }

  useEffect(() => { loadReservations() }, [])

  const counts = reservations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)

  return (
    <div className="pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookmarkCheck size={20} className="text-accent" />
            Reservas
          </h1>
          <p className="text-ink-2 text-xs mt-0.5">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReservations}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-ink-2 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { if (demoGuard(() => {}) === false) return; setNewModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={14} /> Nueva reserva
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {[
          { key: 'all', label: 'Todas', count: reservations.length },
          { key: 'pending', label: 'Pendientes', count: counts.pending || 0 },
          { key: 'confirmed', label: 'Confirmadas', count: counts.confirmed || 0 },
          { key: 'rejected', label: 'Rechazadas', count: counts.rejected || 0 },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${filter === f.key
                ? 'bg-accent text-black border-accent'
                : 'bg-white/5 text-ink-2 border-line hover:border-white/20'}`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${filter === f.key ? 'bg-black/20 text-black' : 'bg-white/10 text-ink-2'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookmarkCheck size={32} className="text-ink-4 mx-auto mb-3" />
          <p className="text-ink-3 text-sm">No hay reservas {filter !== 'all' ? 'con este estado' : 'aún'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(res => (
            <ReservationCard
              key={res.id}
              res={res}
              onUpdate={loadReservations}
              onDelete={(id) => setReservations(prev => prev.filter(r => r.id !== id))}
            />
          ))}
        </div>
      )}

      {newModalOpen && (
        <NewReservationModal
          onClose={() => setNewModalOpen(false)}
          onCreated={() => { loadReservations(); setNewModalOpen(false) }}
        />
      )}
    </div>
  )
}
