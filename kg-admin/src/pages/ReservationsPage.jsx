import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import {
  BookmarkCheck, ChevronDown, ChevronRight, ExternalLink,
  RefreshCw, User, Mail, Package, CreditCard, Phone
} from 'lucide-react'

const STATUS_STYLE = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-green-500/10  text-green-400  border-green-500/20',
  rejected:  'bg-red-500/10    text-red-400    border-red-500/20',
}
const STATUS_LABEL = {
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  rejected:  'Rechazada',
}
const METHOD_LABEL = { yape: '📱 Yape', transfer: '🏦 Transferencia' }

function ReservationCard({ res, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(res.status)
  const [saving, setSaving] = useState(false)

  const date = new Date(res.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const updateStatus = async (s) => {
    setSaving(true)
    await supabase.from('reservations').update({ status: s, updated_at: new Date().toISOString() }).eq('id', res.id)
    setStatus(s)
    onUpdate()
    setSaving(false)
  }

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">

      {/* Fila principal */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {/* Estado */}
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
          {STATUS_LABEL[status] || status}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{res.product_name}</p>
          <p className="text-white/40 text-xs truncate">{res.user_name} · {res.user_email}</p>
        </div>

        {/* Precio + método */}
        <div className="text-right shrink-0 hidden sm:block">
          {res.product_price && (
            <p className="text-accent text-sm font-bold">S/{Number(res.product_price).toFixed(2)}</p>
          )}
          <p className="text-white/30 text-xs">{METHOD_LABEL[res.payment_method] || res.payment_method}</p>
        </div>

        <span className="text-white/20 shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {/* Detalle expandido */}
      {open && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Datos cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Cliente" value={res.user_name || '—'} />
            <InfoRow icon={Mail} label="Email" value={res.user_email || '—'} />
            <InfoRow icon={Package} label="Producto" value={res.product_name} />
            <InfoRow icon={CreditCard} label="Método" value={METHOD_LABEL[res.payment_method] || res.payment_method} />
            {res.product_price && (
              <InfoRow icon={CreditCard} label="Monto" value={`S/${Number(res.product_price).toFixed(2)}`} />
            )}
            <InfoRow icon={Phone} label="Fecha" value={date} />
          </div>

          {/* Comprobante */}
          {res.payment_proof_url && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Comprobante</p>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-w-xs">
                <img
                  src={res.payment_proof_url}
                  alt="Comprobante"
                  className="w-full max-h-56 object-contain"
                />
                <a
                  href={res.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-accent hover:text-black transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {/* Cambiar estado */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Actualizar estado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  disabled={saving || status === key}
                  onClick={() => updateStatus(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40
                    ${status === key
                      ? `${STATUS_STYLE[key]} opacity-100`
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                >
                  {saving && status !== key ? (
                    <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin inline-block" />
                  ) : label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-white/25 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-white/70 text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetch = async () => {
    setLoading(true)
    const query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    const { data } = await query
    setReservations(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

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
          <p className="text-white/40 text-xs mt-0.5">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button
          onClick={fetch}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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
                : 'bg-white/5 text-white/50 border-white/8 hover:border-white/20'}`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${filter === f.key ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'}`}>
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
          <BookmarkCheck size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No hay reservas {filter !== 'all' ? 'con este estado' : 'aún'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(res => (
            <ReservationCard key={res.id} res={res} onUpdate={fetch} />
          ))}
        </div>
      )}
    </div>
  )
}
