import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import {
  ChevronDown, CheckCircle, AlertCircle, ArrowLeft,
  User, Mail, Phone, Package, Calendar, MessageSquare,
  Loader2, CreditCard, Shield, Clock
} from 'lucide-react'

// ─── Utilidades ───────────────────────────────────────────────
const INSTALLMENT_OPTIONS = [2, 4, 8, 12]
const FREQUENCY_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
]

function calcPerInstallment(price, installments) {
  if (!price || !installments) return null
  return (parseFloat(price) / installments).toFixed(2)
}

// ─── Subcomponentes ───────────────────────────────────────────
function FieldGroup({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
        {Icon && <Icon size={11} />}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function SelectField({ value, onChange, children, error }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-[#191919] border rounded-xl px-4 py-3 text-sm text-white appearance-none
          outline-none transition-colors pr-10
          ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-[#CCFF00]/50'}`}
      >
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
    </div>
  )
}

function InputField({ type = 'text', placeholder, value, onChange, error, inputMode }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-[#191919] border rounded-xl px-4 py-3 text-sm text-white
        placeholder-white/25 outline-none transition-colors
        ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/8 focus:border-[#CCFF00]/50'}`}
    />
  )
}

function InfoBadge({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <Icon size={14} />
        {label}
      </div>
      <span className={`text-sm font-bold ${accent ? 'text-[#CCFF00]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
const EMPTY = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  product_id: '',
  installments: 4,
  frequency: 'mensual',
  notes: '',
}

const ERRORS_EMPTY = {}

export default function InstallmentsPage() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState(ERRORS_EMPTY)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Cargar productos publicados
  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, regular_price, sale_price, images')
      .eq('status', 'published')
      .order('name')
      .then(({ data }) => setProducts(data || []))
  }, [])

  // Actualizar producto seleccionado cuando cambia el select
  useEffect(() => {
    if (!form.product_id) { setSelectedProduct(null); return }
    const p = products.find(p => p.id === form.product_id)
    setSelectedProduct(p || null)
  }, [form.product_id, products])

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  // Precio efectivo (oferta si existe)
  const effectivePrice = selectedProduct
    ? (selectedProduct.sale_price || selectedProduct.regular_price)
    : null

  const perInstallment = calcPerInstallment(effectivePrice, form.installments)

  // Validación
  const validate = () => {
    const e = {}
    if (!form.customer_name.trim()) e.customer_name = 'Ingresa tu nombre completo'
    if (!form.customer_email.trim()) e.customer_email = 'Ingresa tu correo'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
      e.customer_email = 'Correo inválido'
    if (!form.customer_phone.trim()) e.customer_phone = 'Ingresa tu teléfono'
    else if (form.customer_phone.replace(/\D/g, '').length < 7)
      e.customer_phone = 'Teléfono inválido'
    if (!form.product_id) e.product_id = 'Selecciona un producto'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    setSubmitError('')

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim().toLowerCase(),
        customer_phone: form.customer_phone.trim(),
        product_id: form.product_id,
        product_name: selectedProduct?.name || '',
        product_price: effectivePrice ? parseFloat(effectivePrice) : null,
        installments: form.installments,
        frequency: form.frequency,
        amount_per_installment: perInstallment ? parseFloat(perInstallment) : null,
        notes: form.notes.trim() || null,
        status: 'pending',
      }

      const { error } = await supabase
        .from('installment_requests')
        .insert(payload)

      if (error) throw error

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setSubmitError('Ocurrió un error al enviar. Intenta nuevamente o contáctanos por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Vista de éxito ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-dvh bg-[#0E0E0E] flex flex-col items-center justify-center px-5 pt-14 pb-10">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-[#CCFF00]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#CCFF00]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">¡Solicitud enviada!</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Recibimos tu solicitud de pago en cuotas. Nos contactaremos contigo a la brevedad
            por <strong className="text-white">WhatsApp o correo</strong> para coordinar los detalles.
          </p>

          {/* Resumen */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-left mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Tu solicitud</p>
            <InfoBadge icon={Package} label="Producto" value={selectedProduct?.name || '—'} />
            {effectivePrice && (
              <InfoBadge icon={CreditCard} label="Precio total" value={`S/${parseFloat(effectivePrice).toFixed(2)}`} accent />
            )}
            <InfoBadge icon={Calendar} label="Cuotas" value={`${form.installments} cuotas ${form.frequency}s`} />
            {perInstallment && (
              <InfoBadge icon={CreditCard} label="Por cuota" value={`S/${perInstallment}`} accent />
            )}
          </div>

          <div className="space-y-3">
            <a
              href="https://wa.me/51947841355"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escribir por WhatsApp
            </a>
            <Link
              to="/tienda"
              className="flex items-center justify-center gap-2 w-full bg-[#191919] border border-white/8 text-white/70 font-semibold py-4 rounded-2xl active:scale-95 transition-all text-sm"
            >
              Seguir explorando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Formulario ──────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-[#0E0E0E] pt-14 pb-12">
      {/* Hero */}
      <div className="px-4 pt-6 pb-5 border-b border-white/5">
      <div>
<Link to="/" className="inline-flex items-center gap-1.5 text-white/30 text-sm mb-4 active:text-white transition-colors">
          <ArrowLeft size={15} /> Volver
        </Link>
      </div>  
        <div className="inline-flex items-center gap-2 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full px-3 py-1 mb-3">
          <CreditCard size={11} className="text-[#CCFF00]" />
          <span className="text-[#CCFF00] text-xs font-bold uppercase tracking-widest">Pago en cuotas</span>
        </div>
        <h1 className="text-2xl font-black text-white leading-tight mb-2">
          ¿No puedes pagar<br />todo de una vez?
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Solicita pagar en cuotas semanales o mensuales, sin intereses y con total seguridad.
        </p>

        {/* Garantías */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { icon: Shield, label: '100% seguro' },
            { icon: Clock, label: 'Sin intereses' },
            { icon: CheckCircle, label: 'Sin trámites' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-[#141414] border border-white/5 rounded-xl py-3 flex flex-col items-center gap-1.5">
              <Icon size={16} className="text-[#CCFF00]" />
              <span className="text-[10px] font-bold text-white/50 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pt-6 space-y-5">

        {/* Sección: Datos personales */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-white/20 mb-3">
            1 · Tus datos
          </p>
          <div className="space-y-3">
            <FieldGroup label="Nombre completo" icon={User} error={errors.customer_name}>
              <InputField
                placeholder="Juan Pérez García"
                value={form.customer_name}
                onChange={v => set('customer_name', v)}
                error={errors.customer_name}
              />
            </FieldGroup>

            <FieldGroup label="Correo electrónico" icon={Mail} error={errors.customer_email}>
              <InputField
                type="email"
                inputMode="email"
                placeholder="correo@ejemplo.com"
                value={form.customer_email}
                onChange={v => set('customer_email', v)}
                error={errors.customer_email}
              />
            </FieldGroup>

            <FieldGroup label="Teléfono / WhatsApp" icon={Phone} error={errors.customer_phone}>
              <InputField
                type="tel"
                inputMode="tel"
                placeholder="+51 999 999 999"
                value={form.customer_phone}
                onChange={v => set('customer_phone', v)}
                error={errors.customer_phone}
              />
            </FieldGroup>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Sección: Producto */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-white/20 mb-3">
            2 · Producto que deseas
          </p>

          <FieldGroup label="Selecciona el producto" icon={Package} error={errors.product_id}>
            <SelectField
              value={form.product_id}
              onChange={v => set('product_id', v)}
              error={errors.product_id}
            >
              <option value="">— Elige un producto —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {(p.sale_price || p.regular_price) ? ` — S/${parseFloat(p.sale_price || p.regular_price).toFixed(2)}` : ''}
                </option>
              ))}
            </SelectField>
          </FieldGroup>

          {/* Preview del producto seleccionado */}
          {selectedProduct && (
            <div className="mt-3 bg-[#141414] border border-[#CCFF00]/15 rounded-2xl p-3 flex items-center gap-3">
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#1C1C1C] shrink-0 flex items-center justify-center">
                  <Package size={20} className="text-white/15" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedProduct.name}</p>
                {effectivePrice && (
                  <p className="text-[#CCFF00] font-black text-base mt-0.5">
                    S/{parseFloat(effectivePrice).toFixed(2)}
                  </p>
                )}
                {selectedProduct.sale_price && selectedProduct.regular_price && (
                  <p className="text-white/25 text-xs line-through">
                    S/{parseFloat(selectedProduct.regular_price).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Sección: Cuotas */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-white/20 mb-3">
            3 · Elige tu plan de cuotas
          </p>

          {/* Frecuencia */}
          <FieldGroup label="Frecuencia de pago" icon={Calendar}>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('frequency', opt.value)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all active:scale-95
                    ${form.frequency === opt.value
                      ? 'bg-[#CCFF00]/10 border-[#CCFF00]/40 text-[#CCFF00]'
                      : 'bg-[#191919] border-white/8 text-white/50'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          {/* Número de cuotas */}
          <div className="mt-3">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2">
              <Calendar size={11} /> Número de cuotas
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INSTALLMENT_OPTIONS.map(n => {
                const perQ = calcPerInstallment(effectivePrice, n)
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set('installments', n)}
                    className={`flex flex-col items-center py-3 px-1 rounded-xl border transition-all active:scale-95
                      ${form.installments === n
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00]/40'
                        : 'bg-[#191919] border-white/8'
                      }`}
                  >
                    <span className={`text-lg font-black leading-none ${form.installments === n ? 'text-[#CCFF00]' : 'text-white'}`}>
                      {n}
                    </span>
                    <span className={`text-[12px] uppercase font-semibold mt-0.5 ${form.installments === n ? 'text-[#CCFF00]/70' : 'text-white/30'}`}>
                      cuotas
                    </span>
                    {perQ && (
                      <span className={`text-[9px] font-bold mt-1 ${form.installments === n ? 'text-[#CCFF00]' : 'text-white/20'}`}>
                        S/{perQ}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resumen de cuotas */}
          {selectedProduct && effectivePrice && (
            <div className="mt-4 bg-[#141414] border border-white/5 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/25 mb-3">
                Resumen de tu plan
              </p>
              <InfoBadge icon={CreditCard} label="Precio total" value={`S/${parseFloat(effectivePrice).toFixed(2)}`} />
              <InfoBadge
                icon={Calendar}
                label="Frecuencia"
                value={`${form.installments} cuotas ${form.frequency}s`}
              />
              {perInstallment && (
                <InfoBadge
                  icon={CreditCard}
                  label="Pagarías por cuota"
                  value={`S/${perInstallment}`}
                  accent
                />
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Notas opcionales */}
        <FieldGroup label="Mensaje adicional (opcional)" icon={MessageSquare}>
          <textarea
            className="w-full bg-[#191919] border border-white/8 rounded-xl px-4 py-3 text-sm
              text-white placeholder-white/25 outline-none focus:border-[#CCFF00]/50
              transition-colors resize-none"
            rows={3}
            placeholder="¿Alguna consulta o detalle adicional sobre tu pedido?"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FieldGroup>

        {/* Error general */}
        {submitError && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-white/20 text-xs leading-relaxed text-center px-4">
          Al enviar aceptas ser contactado por nuestro equipo para coordinar el plan de pagos.
          No se realizará ningún cobro sin tu confirmación previa.
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#CCFF00] text-black font-black py-4 rounded-2xl
            text-base active:scale-95 transition-all disabled:opacity-50
            flex items-center justify-center gap-2 shadow-lg shadow-[#CCFF00]/10"
        >
          {loading
            ? <><Loader2 size={20} className="animate-spin" /> Enviando solicitud...</>
            : <><CheckCircle size={20} /> Solicitar pago en cuotas</>
          }
        </button>

        {/* WhatsApp fallback */}
        <a
          href="https://wa.me/51947841355?text=Hola%2C%20quisiera%20consultar%20sobre%20pago%20en%20cuotas"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full text-white/40 text-sm py-2 active:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          O escríbenos directamente por WhatsApp
        </a>
      </div>
    </div>
  )
}
