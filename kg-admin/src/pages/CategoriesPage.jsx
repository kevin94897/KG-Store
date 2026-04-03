import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { Plus, Pencil, Trash2, Check, X, Tag, FolderOpen, ArrowLeft } from 'lucide-react'

function Form({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [slug, setSlug] = useState(initial?.slug || '')
  const [desc, setDesc] = useState(initial?.description || '')

  const slugify = s => s.toLowerCase()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').trim()

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>
      <div>
        <label className="label">Nombre *</label>
        <input autoFocus className="input" placeholder="Ej: Figuras"
          value={name}
          onChange={e => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)) }} />
      </div>
      <div>
        <label className="label">Slug</label>
        <input className="input font-mono text-xs" placeholder="figuras"
          value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input resize-none" rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => name.trim() && onSave({ name, slug: slug || slugify(name), description: desc })}
          className="btn-accent flex-1">
          <Check size={16} /> Guardar
        </button>
        <button onClick={onCancel} className="btn-ghost"><X size={16} /></button>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = () => supabase.from('categories').select('*').order('name')
    .then(({ data }) => { setCats(data || []); setLoading(false) })

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    try {
      if (editing) {
        const { error: e } = await supabase.from('categories').update(data).eq('id', editing.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('categories').insert(data)
        if (e) throw e
      }
      setShowForm(false); setEditing(null); load()
    } catch (e) { setError(e.message) }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar "${cat.name}"?`)) return
    const { error: e } = await supabase.from('categories').delete().eq('id', cat.id)
    if (e) setError(e.message)
    else setCats(p => p.filter(c => c.id !== cat.id))
  }

  return (
    <div className="min-h-dvh bg-dark pb-24 pt-safe">
      <div className="sticky top-0 bg-dark/95 backdrop-blur-xl z-10 px-4 pt-5 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Categorías</h1>
            <p className="text-xs text-white/25">{cats.length} categorías</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 bg-dark-600 border border-white/5 rounded-xl flex items-center justify-center text-white/50 active:text-white shrink-0">
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(p => !p) }}
              className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
            >
              {showForm && !editing ? <X size={18} className="text-black" /> : <Plus size={18} className="text-black" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        {error && (
          <div className="bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}

        {showForm && (
          <Form
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        )}

        {loading
          ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="card flex items-center gap-3 p-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))
          : cats.length === 0 && !showForm
            ? (
              <div className="text-center py-16">
                <FolderOpen size={40} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Sin categorías todavía</p>
              </div>
            )
            : cats.map(cat => (
              <div key={cat.id} className="card flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-dark-600 rounded-xl flex items-center justify-center shrink-0">
                  <Tag size={16} className="text-white/25" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{cat.name}</p>
                  <p className="text-xs text-white/25 font-mono">{cat.slug}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setEditing(cat); setShowForm(true) }}
                    className="w-8 h-8 bg-dark-600 rounded-lg flex items-center justify-center text-white/40 active:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat)}
                    className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 active:bg-red-900/40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
