import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useDemo } from '../context/DemoContext'
import { Plus, ChevronRight, ShoppingCart, X, Check, ChevronDown } from 'lucide-react'

const STATUS_STYLE = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}
const STATUS_LABEL = {
  pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
}

function OrderCard({ order, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)
  const { demoGuard } = useDemo()

  const updateStatus = async (s) => {
    if (demoGuard(() => {}) === false) return
    setSaving(true)
    await supabase.from('orders').update({ status: s }).eq('id', order.id)
    setStatus(s)
    onUpdate()
    setSaving(false)
  }

  const date = new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(p => !p)} className="w-full flex items-center gap-3 p-4 active:bg-white/2">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-white truncate">{order.customer_name}</p>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLE[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white">
            <span>{date}</span>
            {order.total && <span className="text-accent font-bold">S/{parseFloat(order.total).toFixed(2)}</span>}
          </div>
        </div>
        <ChevronRight size={16} className={`text-white/15 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3 fade-in">
          {order.customer_email && <p className="text-xs text-white/40">{order.customer_email}</p>}
          {order.customer_phone && (
            <a href={`https://wa.me/${order.customer_phone}`} className="text-xs text-green-400 flex items-center gap-1">
              📱 {order.customer_phone}
            </a>
          )}
          {order.notes && <p className="text-xs text-white/50 bg-dark-600 rounded-xl p-3">{order.notes}</p>}

          {/* Status change */}
          <div>
            <label className="label">Cambiar estado</label>
            <div className="relative">
              <select
                className="input text-xs appearance-none pr-10"
                value={status}
                onChange={e => updateStatus(e.target.value)}
                disabled={saving}
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewOrderForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', notes: '', total: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Nuevo pedido</h3>
      <div><label className="label">Nombre cliente *</label>
        <input className="input" placeholder="Juan Pérez" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} /></div>
      <div><label className="label">WhatsApp</label>
        <input className="input" type="tel" inputMode="tel" placeholder="+51 999 999 999" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} /></div>
      <div><label className="label">Email</label>
        <input className="input" type="email" inputMode="email" placeholder="correo@gmail.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} /></div>
      <div><label className="label">Total (S/)</label>
        <input className="input font-mono" type="number" inputMode="decimal" placeholder="0.00" value={form.total} onChange={e => set('total', e.target.value)} /></div>
      <div><label className="label">Notas del pedido</label>
        <textarea className="input resize-none" rows={3} placeholder="Producto, detalles, etc." value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      <div className="flex gap-2">
        <button onClick={() => form.customer_name && onSave(form)} className="btn-accent flex-1"><Check size={16} /> Crear pedido</button>
        <button onClick={onCancel} className="btn-ghost"><X size={16} /></button>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const { demoGuard } = useDemo()

  const load = () => supabase.from('orders').select('*').order('created_at', { ascending: false })
    .then(({ data }) => { setOrders(data || []); setLoading(false) })

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => {
    if (demoGuard(() => {}) === false) return
    await supabase.from('orders').insert({
      ...data,
      total: data.total ? parseFloat(data.total) : null,
      status: 'pending',
    })
    setShowForm(false)
    load()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'shipped', label: 'Enviados' },
  ]

  return (
    <div className="min-h-dvh bg-dark pb-24 pt-safe">
      <div className="sticky top-0 bg-dark/95 backdrop-blur-xl z-10 px-4 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Pedidos</h1>
            <p className="text-xs text-white/25">{orders.length} en total</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
          >
            {showForm ? <X size={18} className="text-black" /> : <Plus size={18} className="text-black" />}
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                ${filter === f.key ? 'bg-accent text-black' : 'bg-dark-600 text-white/35'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 space-y-3">
        {showForm && <NewOrderForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}

        {loading
          ? Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-1/4" />
            </div>
          ))
          : filtered.length === 0
            ? (
              <div className="text-center py-16">
                <ShoppingCart size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Sin pedidos</p>
              </div>
            )
            : filtered.map(o => <OrderCard key={o.id} order={o} onUpdate={load} />)
        }
      </div>
    </div>
  )
}
