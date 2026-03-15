import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import ImageUploader from '../components/ImageUploader'
import {
  ArrowLeft, Save, Trash2, Check, AlertCircle,
  ChevronDown, ToggleLeft, ToggleRight
} from 'lucide-react'

const EMPTY = {
  name: '', slug: '', sku: '', type: 'simple', status: 'published',
  short_description: '', description: '', regular_price: '', sale_price: '',
  in_stock: true, featured: false, images: [], tags: '', category_id: '',
}

const slugify = s => s.toLowerCase()
  .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
  .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
  .replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').trim()

function Toggle({ label, sub, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 rounded-xl border border-white/5">
      <div>
        <p className="text-sm text-white font-semibold">{label}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
      {value
        ? <ToggleRight size={26} className="text-accent shrink-0" />
        : <ToggleLeft size={26} className="text-white/15 shrink-0" />
      }
    </button>
  )
}

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'nuevo'
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [section, setSection] = useState('general')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('id, name, slug').order('name')
      .then(({ data }) => setCategories(data || []))

    if (isEdit) {
      supabase.from('products').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) setForm({
            ...data,
            regular_price: data.regular_price?.toString() || '',
            sale_price: data.sale_price?.toString() || '',
            tags: (data.tags || []).join(', '),
            category_id: data.category_id || '',
          })
          setLoading(false)
        })
    }
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const autoSlug = (name) => {
    set('name', name)
    if (!isEdit) set('slug', slugify(name))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        sku: form.sku || null,
        type: form.type,
        status: form.status,
        short_description: form.short_description || null,
        description: form.description || null,
        regular_price: form.regular_price ? parseFloat(form.regular_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        in_stock: form.in_stock,
        featured: form.featured,
        images: form.images,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        category_id: form.category_id || null,
      }

      if (isEdit) {
        const { error: e } = await supabase.from('products').update(payload).eq('id', id)
        if (e) throw e
      } else {
        const { data, error: e } = await supabase.from('products').insert(payload).select().single()
        if (e) throw e
        navigate(`/productos/${data.id}`, { replace: true })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este producto?')) return
    setDeleting(true)
    await supabase.from('products').delete().eq('id', id)
    navigate('/productos', { replace: true })
  }

  const TABS = ['general', 'precio', 'stock', 'imágenes', 'categoría']

  if (loading) return (
    <div className="min-h-dvh bg-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-dvh bg-dark pb-36 pt-safe">
      {/* Header */}
      <div className="sticky top-0 bg-dark/95 backdrop-blur-xl z-10 px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 bg-dark-600 border border-white/5 rounded-xl flex items-center justify-center text-white/50 active:text-white shrink-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="flex-1 text-lg font-black text-white truncate">
            {isEdit ? (form.name || 'Editar') : 'Nuevo producto'}
          </h1>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting}
              className="w-9 h-9 bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 active:bg-red-900/40 disabled:opacity-40 shrink-0">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button key={t} onClick={() => setSection(t)}
              className={`shrink-0 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all capitalize
                ${section === t ? 'bg-accent text-black' : 'bg-dark-600 text-white/35'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-900/40 rounded-xl px-4 py-3 text-green-400 text-sm">
            <Check size={15} /> Guardado correctamente
          </div>
        )}

        {/* ── GENERAL ── */}
        {section === 'general' && (
          <div className="space-y-4 fade-up">
            <div>
              <label className="label">Nombre *</label>
              <input className="input text-base" placeholder="Ej: Metal Gear Solid V Edición Coleccionista"
                value={form.name} onChange={e => autoSlug(e.target.value)} />
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input className="input font-mono text-xs" placeholder="metal-gear-solid-v"
                value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g,'-'))} />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input font-mono" placeholder="REF-001"
                value={form.sku} onChange={e => set('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Descripción corta</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Descripción breve visible en la tienda..."
                value={form.short_description} onChange={e => set('short_description', e.target.value)} />
            </div>
            <div>
              <label className="label">Descripción completa</label>
              <textarea className="input resize-none" rows={6}
                placeholder="Descripción detallada..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="label">Tags (separados por coma)</label>
              <input className="input" placeholder="ps4, figura, coleccionable"
                value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div>
              <label className="label">Estado</label>
              <div className="relative">
                <select className="input appearance-none pr-10" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="published">✅ Publicado</option>
                  <option value="draft">📝 Borrador</option>
                  <option value="archived">📦 Archivado</option>
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              </div>
            </div>
            <Toggle label="Destacado" sub="Aparece en sección destacados" value={form.featured} onChange={v => set('featured', v)} />
          </div>
        )}

        {/* ── PRECIO ── */}
        {section === 'precio' && (
          <div className="space-y-4 fade-up">
            <div>
              <label className="label">Precio regular</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm font-mono">S/</span>
                <input className="input pl-9 font-mono" type="number" inputMode="decimal" placeholder="0.00"
                  value={form.regular_price} onChange={e => set('regular_price', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Precio de oferta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm font-mono">S/</span>
                <input className="input pl-9 font-mono" type="number" inputMode="decimal" placeholder="0.00 (opcional)"
                  value={form.sale_price} onChange={e => set('sale_price', e.target.value)} />
              </div>
              <p className="text-xs text-white/20 mt-1 pl-1">Deja vacío si no hay oferta</p>
            </div>
            {form.regular_price && form.sale_price && parseFloat(form.sale_price) < parseFloat(form.regular_price) && (
              <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-accent text-sm font-bold font-mono">
                -{Math.round((1 - parseFloat(form.sale_price) / parseFloat(form.regular_price)) * 100)}% descuento
              </div>
            )}
          </div>
        )}

        {/* ── STOCK ── */}
        {section === 'stock' && (
          <div className="space-y-4 fade-up">
            <Toggle label="En stock" sub="El producto está disponible para comprar"
              value={form.in_stock} onChange={v => set('in_stock', v)} />
            <div>
              <label className="label">Tipo de producto</label>
              <div className="relative">
                <select className="input appearance-none pr-10" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="simple">Simple</option>
                  <option value="variable">Variable</option>
                  <option value="grouped">Agrupado</option>
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── IMÁGENES ── */}
        {section === 'imágenes' && (
          <div className="fade-up">
            <p className="text-xs text-white/25 mb-3">La primera imagen será la principal. Toca la imagen para opciones.</p>
            <ImageUploader images={form.images} onChange={imgs => set('images', imgs)} />
          </div>
        )}

        {/* ── CATEGORÍA ── */}
        {section === 'categoría' && (
          <div className="space-y-2 fade-up">
            {categories.map(cat => {
              const selected = form.category_id === cat.id
              return (
                <button key={cat.id} type="button" onClick={() => set('category_id', selected ? '' : cat.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.98]
                    ${selected ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-dark-700 border-white/5 text-white/60'}`}>
                  <span className="font-semibold text-sm">{cat.name}</span>
                  {selected && <Check size={16} />}
                </button>
              )
            })}
            {categories.length === 0 && (
              <p className="text-center text-white/25 py-8 text-sm">
                Sin categorías. <a onClick={() => navigate('/categorias')} className="text-accent underline cursor-pointer">Crear una</a>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save bar fixed */}
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-gradient-to-t from-dark to-transparent z-40">
        <button className="btn-accent w-full py-4 text-base" onClick={handleSave} disabled={saving}>
          {saving
            ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            : <Save size={18} />
          }
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </div>
  )
}
