import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookmarkCheck, Clock, CheckCircle2,
  XCircle, PackageCheck, ChevronRight, ExternalLink, Copy, CheckCircle, Plus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import useSeo from '../hooks/useSeo'
import UserNewReservationModal from '../components/UserNewReservationModal'

// ── Status config ────────────────────────────────────────────
const STATUS = {
  pending: {
    label: 'En revisión',
    icon: Clock,
    pill: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    dot: 'bg-yellow-400',
    desc: 'Estamos revisando tu comprobante de pago.',
  },
  confirmed: {
    label: 'Confirmada',
    icon: CheckCircle2,
    pill: 'bg-green-500/15 text-green-400 border-green-500/20',
    dot: 'bg-green-400',
    desc: 'Tu reserva fue confirmada. Nos comunicaremos contigo pronto.',
  },
  completed: {
    label: 'Completada',
    icon: PackageCheck,
    pill: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    desc: 'Reserva completada. ¡Gracias por tu compra!',
  },
  cancelled: {
    label: 'Cancelada',
    icon: XCircle,
    pill: 'bg-red-500/15 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
    desc: 'Esta reserva fue cancelada.',
  },
  rejected: {
    label: 'Rechazada',
    icon: XCircle,
    pill: 'bg-red-500/15 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
    desc: 'Tu reserva fue rechazada. Contáctanos para más información.',
  },
}

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 font-mono text-sm font-bold text-accent tracking-widest hover:text-accent/80 transition-colors"
    >
      {code}
      {copied
        ? <CheckCircle size={13} className="text-green-400" />
        : <Copy size={13} className="text-accent/40" />}
    </button>
  )
}

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.pill}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

const PAYMENT_LABEL = {
  yape: 'Yape',
  transfer: 'Transferencia',
  cash: 'Efectivo',
  other: 'Otro',
}

function ReservationCard({ reservation }) {
  const [imgOpen, setImgOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState(null)
  const cfg = STATUS[reservation.status] || STATUS.pending
  const date = new Date(reservation.created_at)
  const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

  const openImg = (src) => { setImgSrc(src); setImgOpen(true) }

  const thumb = reservation.reference_photo_url || reservation.product_image

  return (
    <div className="bg-dark-800 border border-white/5 rounded-3xl overflow-hidden">
      {/* Header card */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <CopyCode code={reservation.reservation_code || 'KG-??????'} />
          <p className="text-white/25 text-[11px] mt-0.5">{dateStr}</p>
        </div>
        <StatusPill status={reservation.status} />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/5" />

      {/* Product info */}
      <div className="px-4 py-3 flex items-center gap-3">
        {thumb ? (
          <button onClick={() => openImg(thumb)} className="shrink-0">
            <img
              src={thumb}
              alt={reservation.product_name}
              className="w-12 h-12 rounded-xl object-cover bg-dark-700 hover:opacity-80 transition-opacity"
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center shrink-0 text-white/10">
            📦
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold line-clamp-2 leading-snug">
            {reservation.product_name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {reservation.product_price && (
              <span className="text-accent text-xs font-bold">
                S/{parseFloat(reservation.product_price).toFixed(2)}
              </span>
            )}
            <span className="text-white/25 text-xs">
              {PAYMENT_LABEL[reservation.payment_method] || reservation.payment_method}
            </span>
          </div>
        </div>
      </div>

      {/* Cuotas e info financiera */}
      {(reservation.advance_payment || reservation.installments_count) && (
        <div className="mx-4 mb-3 flex items-center gap-3 flex-wrap">
          {reservation.advance_payment && (
            <div className="bg-white/4 border border-white/6 rounded-xl px-3 py-1.5 flex-1 min-w-0">
              <p className="text-white/30 text-[10px] uppercase tracking-wide font-bold mb-0.5">Adelanto</p>
              <p className="text-white text-sm font-bold">S/{parseFloat(reservation.advance_payment).toFixed(2)}</p>
            </div>
          )}
          {reservation.installments_count && (
            <div className="bg-white/4 border border-white/6 rounded-xl px-3 py-1.5 flex-1 min-w-0">
              <p className="text-white/30 text-[10px] uppercase tracking-wide font-bold mb-0.5">Cuotas</p>
              <p className="text-white text-sm font-bold">
                {reservation.installments_count}×{' '}
                <span className="text-white/50 font-normal text-xs">
                  {reservation.installment_frequency === 'weekly' ? 'semanales' : 'mensuales'}
                </span>
              </p>
            </div>
          )}
          {reservation.advance_payment && reservation.product_price && (
            <div className="bg-white/4 border border-white/6 rounded-xl px-3 py-1.5 flex-1 min-w-0">
              <p className="text-white/30 text-[10px] uppercase tracking-wide font-bold mb-0.5">Saldo</p>
              <p className="text-white text-sm font-bold">
                S/{Math.max(0, parseFloat(reservation.product_price) - parseFloat(reservation.advance_payment)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notas */}
      {reservation.notes && (
        <div className="mx-4 mb-3">
          <p className="text-white/30 text-xs italic line-clamp-2">"{reservation.notes}"</p>
        </div>
      )}

      {/* Status description */}
      <div className={`mx-4 mb-4 px-3 py-2 rounded-xl flex items-center gap-2 ${cfg.pill.split(' ').slice(0, 1).join(' ')}/10 border ${cfg.pill.split(' ').slice(2).join(' ')}`}>
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        <p className="text-xs" style={{ color: 'inherit' }}>{cfg.desc}</p>
      </div>

      {/* Actions */}
      <div className="mx-4 mb-4 flex items-center gap-3 flex-wrap">
        {reservation.payment_proof_url && (
          <button
            onClick={() => openImg(reservation.payment_proof_url)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <ExternalLink size={12} />
            Ver comprobante
          </button>
        )}
        {reservation.reference_photo_url && (
          <button
            onClick={() => openImg(reservation.reference_photo_url)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <ExternalLink size={12} />
            Foto referencial
          </button>
        )}
      </div>

      {/* Image lightbox */}
      {imgOpen && imgSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={() => setImgOpen(false)}
        >
          <img
            src={imgSrc}
            alt="Vista"
            className="max-w-full max-h-[85dvh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function ReservationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const navigate = useNavigate()

  useSeo({ title: 'Mis reservas | KG Store', url: '/mis-reservas' })

  useEffect(() => {
    if (!authLoading && !user) navigate('/')
  }, [user, authLoading, navigate])

  const fetchReservations = () => {
    if (!user) return
    supabase
      .from('reservations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReservations(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchReservations()
  }, [user])

  const isLoading = authLoading || loading

  return (
    <>
      <div className="max-w-5xl mx-auto w-full min-h-dvh pt-14 pb-16 fade-up">

        {/* Header */}
        <div className="px-4 pt-5 mb-6">
          <Link
            to="/perfil"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors mb-5"
          >
            <ArrowLeft size={15} />
            Mi cuenta
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">Mis reservas</h1>
              {!isLoading && (
                <p className="text-white/30 text-xs mt-0.5">
                  {reservations.length === 0
                    ? 'Aún no tienes reservas'
                    : `${reservations.length} reserva${reservations.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-accent text-black font-bold text-xs px-4 py-2.5 rounded-full hover:brightness-105 active:scale-95 transition-all shrink-0"
            >
              <Plus size={14} />
              Nueva reserva
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-dark-800 border border-white/5 rounded-3xl p-4 space-y-3">
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
                <div className="flex gap-3">
                  <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3.5 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : reservations.length > 0 ? (
            reservations.map(r => <ReservationCard key={r.id} reservation={r} />)
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                <BookmarkCheck size={32} className="text-white/10" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Sin reservas aún</h2>
              <p className="text-white/30 text-sm max-w-xs mb-8">
                Cuando reserves un producto, podrás ver el estado de tu pedido aquí.
              </p>
              <Link
                to="/tienda"
                className="inline-flex items-center gap-2 bg-accent text-black font-bold text-sm px-6 py-3 rounded-full hover:brightness-105 active:scale-95 transition-all"
              >
                Explorar tienda
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva reserva — fuera del contenedor principal */}
      {showNewModal && (
        <UserNewReservationModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setLoading(true); fetchReservations() }}
        />
      )}
    </>
  )
}
