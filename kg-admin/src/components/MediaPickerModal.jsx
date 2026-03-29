import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { X, Search, Check, Images, ChevronRight } from 'lucide-react'
import { thumbUrl, thumbFallback } from '../utils/thumbUrl'

const BUCKET = 'product-images'

export default function MediaPickerModal({ onSelect, onClose, multiple = true }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data, error: err } = await supabase.storage
          .from(BUCKET)
          .list('products', {
            limit: 500,
            sortBy: { column: 'created_at', order: 'desc' },
          })
        if (err) throw err
        setFiles((data || []).filter(f => f.metadata?.size))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getPublicUrl = (name) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`products/${name}`)
    return data.publicUrl
  }

  const toggle = (name) => {
    if (!multiple) {
      setSelected(new Set([name]))
      return
    }
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const confirm = () => {
    const urls = Array.from(selected).map(name => getPublicUrl(name))
    onSelect(urls)
    onClose()
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark">
      {/* Header */}
      <div className="bg-dark-800 border-b border-white/5 px-4 pt-safe pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Images size={17} className="text-accent" />
              Biblioteca de Medios
            </h2>
            {selected.size > 0 && (
              <p className="text-xs text-accent font-semibold mt-0.5">
                {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={17} className="text-white/60" />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="search"
            placeholder="Buscar imagen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-dark-600 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-white/20">
            <Images size={36} strokeWidth={1} />
            <p className="text-sm font-semibold">
              {search ? 'Sin resultados' : 'Biblioteca vacía'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-accent/70">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-1">
              {filtered.length} imágenes
            </p>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map(file => {
                const url = getPublicUrl(file.name)
                const isSelected = selected.has(file.name)
                return (
                  <div
                    key={file.name}
                    onClick={() => toggle(file.name)}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-dark-600 cursor-pointer transition-all duration-150 active:scale-95
                      ${isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-dark scale-[0.97]' : ''}
                    `}
                  >
                    <img
                      src={thumbUrl(url)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={thumbFallback(url)}
                    />
                    {/* Check */}
                    <div className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSelected
                        ? 'bg-accent border-accent scale-110'
                        : 'bg-black/50 border-white/30'
                      }`}
                    >
                      {isSelected && <Check size={11} color="black" strokeWidth={3} />}
                    </div>
                    {/* Overlay seleccionado */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        {error && (
          <p className="text-red-400 text-xs text-center mt-4">{error}</p>
        )}
      </div>

      {/* Botón confirmar */}
      <div className="px-4 pb-safe pt-3 bg-dark-800 border-t border-white/5 shrink-0">
        <button
          onClick={confirm}
          disabled={selected.size === 0}
          className="w-full py-4 rounded-2xl bg-accent text-black font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Check size={16} strokeWidth={3} />
          {selected.size === 0
            ? 'Selecciona una imagen'
            : `Agregar ${selected.size} imagen${selected.size !== 1 ? 'es' : ''}`
          }
        </button>
      </div>
    </div>
  )
}
