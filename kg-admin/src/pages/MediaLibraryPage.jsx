import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useDemo } from '../context/DemoContext'
import { optimizeImages, generateAllVariantsFromUrl } from '../utils/imageOptimizer'
import { mediumUrl, mediumFallback } from '../utils/thumbUrl'
import {
  Images, Upload, Trash2, X, Check, Search, RefreshCw,
  Image as Img, CheckSquare, Square, AlertTriangle, Camera,
  Grid3X3, Grid2X2, ZoomIn, Wand2, CheckCircle2
} from 'lucide-react'

const BUCKET = 'product-images'

// Extrae el path relativo desde una URL pública de Supabase
function extractPath(publicUrl) {
  try {
    const url = new URL(publicUrl)
    // /storage/v1/object/public/product-images/products/xxxx.webp
    const marker = `/public/${BUCKET}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return url.pathname.slice(idx + marker.length)
  } catch {
    return null
  }
}

export default function MediaLibraryPage() {
  const { demoGuard } = useDemo()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { url, name }
  const [cols, setCols] = useState(3)     // 2 o 3 columnas
  const fileRef = useRef()
  const cameraRef = useRef()

  // ── Cargar archivos ───────────────────────────────────────────
  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.storage
        .from(BUCKET)
        .list('products', {
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' },
        })
      if (err) throw err
      // Solo archivos directos en products/ (excluir carpetas thumbs/ y medium/)
      const imageFiles = (data || []).filter(f => f.metadata?.size && !f.name.includes('/'))
      setFiles(imageFiles)
    } catch (e) {
      setError('Error cargando medios: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  // ── URL pública ───────────────────────────────────────────────
  const getPublicUrl = (name) => {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`products/${name}`)
    return data.publicUrl
  }

  // ── Upload ────────────────────────────────────────────────────
  const handleFiles = useCallback(async (fileList) => {
    const arr = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    if (demoGuard(() => {}) === false) return
    setUploading(true)
    setError('')
    try {
      const optimized = await optimizeImages(arr)
      for (let i = 0; i < optimized.length; i++) {
        setProgress(Math.round((i / optimized.length) * 100))
        const { webFile, thumbFile, mediumFile } = optimized[i]
        const ext = webFile.type?.split('/')?.[1]?.replace('jpeg', 'jpg') || 'webp'
        const basename = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const webPath = `products/${basename}.${ext}`

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(webPath, webFile, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr

        // Variantes siempre en .webp (URL consistente con thumbUrl/mediumUrl)
        const uploadVariant = (file, folder) => {
          if (!file) return
          supabase.storage.from(BUCKET)
            .upload(`products/${folder}/${basename}.webp`, file, {
              cacheControl: '86400',
              upsert: false,
              contentType: file.type || 'image/webp',
            })
            .then(({ error: e }) => { if (e) console.warn(`[MediaLibrary] ${folder} upload failed:`, e.message) })
        }
        uploadVariant(thumbFile, 'thumbs')
        uploadVariant(mediumFile, 'medium')

        setProgress(Math.round(((i + 1) / optimized.length) * 100))
      }
      await loadFiles()
    } catch (e) {
      setError('Error al subir: ' + e.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [loadFiles])

  // ── Eliminar seleccionados (web + thumb + medium) ─────────────
  const deleteSelected = async () => {
    if (!selected.size) return
    if (demoGuard(() => {}) === false) return
    setDeleting(true)
    setError('')
    try {
      const paths = []
      for (const name of selected) {
        const base = name.replace(/\.\w+$/, '')
        paths.push(`products/${name}`)               // web original
        paths.push(`products/thumbs/${base}.webp`)   // thumb
        paths.push(`products/medium/${base}.webp`)   // medium
      }
      // remove() ignora silenciosamente los paths que no existen
      const { error: delErr } = await supabase.storage.from(BUCKET).remove(paths)
      if (delErr) throw delErr
      setSelected(new Set())
      setSelectMode(false)
      setConfirmDelete(false)
      await loadFiles()
    } catch (e) {
      setError('Error al eliminar: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  // ── Toggle selección ──────────────────────────────────────────
  const toggleSelect = (name) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(f => f.name)))
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false)

  // ── Migración: generar variantes faltantes + re-optimizar pesadas ─
  const [migRunning, setMigRunning] = useState(false)
  const [migProgress, setMigProgress] = useState({ done: 0, total: 0, errors: 0, skipped: 0 })
  const [migDone, setMigDone] = useState(false)
  const [migPlan, setMigPlan] = useState(null) // null = no escaneado
  // migPlan = { missingThumb: [], missingMedium: [], heavyWeb: [] }

  const scanVariants = useCallback(async () => {
    setMigPlan(null)
    try {
      const [thumbRes, mediumRes] = await Promise.all([
        supabase.storage.from(BUCKET).list('products/thumbs', { limit: 1000 }),
        supabase.storage.from(BUCKET).list('products/medium', { limit: 1000 }),
      ])
      const existingThumbs = new Set((thumbRes.data || []).map(f => f.name.replace(/\.\w+$/, '')))
      const existingMediums = new Set((mediumRes.data || []).map(f => f.name.replace(/\.\w+$/, '')))

      const missingThumb = []
      const missingMedium = []
      const heavyWeb = []

      for (const f of files) {
        const base = f.name.replace(/\.\w+$/, '')
        if (!existingThumbs.has(base)) missingThumb.push(f)
        if (!existingMediums.has(base)) missingMedium.push(f)
        if ((f.metadata?.size || 0) > 300 * 1024) heavyWeb.push(f)
      }

      setMigPlan({ missingThumb, missingMedium, heavyWeb })
    } catch (e) {
      console.error('[Migration] Error escaneando:', e)
      setMigPlan({ missingThumb: [], missingMedium: [], heavyWeb: [] })
    }
  }, [files])

  const runMigration = useCallback(async () => {
    if (!migPlan) return
    // Unión de imágenes que necesitan alguna acción
    const needsWork = new Map()
    for (const f of migPlan.missingThumb) needsWork.set(f.name, { ...needsWork.get(f.name), thumb: true, f })
    for (const f of migPlan.missingMedium) needsWork.set(f.name, { ...needsWork.get(f.name), medium: true, f })
    for (const f of migPlan.heavyWeb) needsWork.set(f.name, { ...needsWork.get(f.name), web: true, f })

    const items = Array.from(needsWork.values())
    if (!items.length) return

    setMigRunning(true)
    setMigDone(false)
    setMigProgress({ done: 0, total: items.length, errors: 0, skipped: 0 })

    let errors = 0, skipped = 0
    for (let i = 0; i < items.length; i++) {
      const { f, thumb, medium, web } = items[i]
      const publicUrl = getPublicUrl(f.name)
      const base = f.name.replace(/\.\w+$/, '')
      try {
        const { webFile, thumbFile, mediumFile } = await generateAllVariantsFromUrl(publicUrl)

        // Variantes siempre en .webp (URL consistente con thumbUrl/mediumUrl)
        const upVariant = async (file, path) => {
          if (!file) return
          const { error: e } = await supabase.storage.from(BUCKET)
            .upload(`${path}.webp`, file, {
              cacheControl: '86400',
              upsert: true,
              contentType: file.type || 'image/webp',
            })
          if (e) throw e
        }
        // Web: siempre reusar la extensión original del archivo para no crear duplicados.
        // El contentType indica el formato real al browser (no la extensión).
        const upWeb = async (file, path) => {
          if (!file) return
          const origExt = f.name.split('.').pop() || 'webp'
          const { error: e } = await supabase.storage.from(BUCKET)
            .upload(`${path}.${origExt}`, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type || 'image/webp',
            })
          if (e) throw e
        }

        if (thumb && thumbFile) await upVariant(thumbFile, `products/thumbs/${base}`)
        if (medium && mediumFile) await upVariant(mediumFile, `products/medium/${base}`)
        if (web && webFile) {
          // Re-comprimir web solo si la nueva versión es efectivamente más pequeña
          const newSize = webFile.size
          const oldSize = f.metadata?.size || Infinity
          if (newSize < oldSize * 0.85) {
            await upWeb(webFile, `products/${base}`)
            console.log(`[Migration] ✓ web re-optimized: ${(oldSize / 1024).toFixed(0)} → ${(newSize / 1024).toFixed(0)} KB`)
          } else {
            skipped++
          }
        }
        console.log(`[Migration] ✓ ${f.name}`)
      } catch (e) {
        console.warn(`[Migration] ✗ ${f.name}:`, e.message)
        errors++
      }
      setMigProgress({ done: i + 1, total: items.length, errors, skipped })
    }

    setMigRunning(false)
    setMigDone(true)
    setMigPlan({ missingThumb: [], missingMedium: [], heavyWeb: [] })
    await loadFiles()
  }, [migPlan, loadFiles])
  // ── Limpieza temporal de duplicados .webp ─────────────────────
  const [cleanRunning, setCleanRunning] = useState(false)
  const [cleanResult, setCleanResult] = useState(null) // null | { deleted, kept }

  const cleanDuplicates = useCallback(async () => {
    setCleanRunning(true)
    setCleanResult(null)
    try {
      const { data } = await supabase.storage
        .from(BUCKET)
        .list('products', { limit: 1000 })

      const allFiles = (data || []).filter(f => f.metadata?.size && !f.name.includes('/'))

      // Agrupar por basename (sin extensión)
      const byBase = {}
      for (const f of allFiles) {
        const base = f.name.replace(/\.[^.]+$/, '')
        if (!byBase[base]) byBase[base] = []
        byBase[base].push(f.name)
      }

      // Duplicados: basenames con más de un archivo → borrar los .webp extra
      const toDelete = []
      for (const [, names] of Object.entries(byBase)) {
        if (names.length < 2) continue
        const nonWebp = names.filter(n => !n.endsWith('.webp'))
        const webp = names.filter(n => n.endsWith('.webp'))
        // Si hay versión no-webp, los .webp son duplicados
        if (nonWebp.length > 0 && webp.length > 0) {
          webp.forEach(n => toDelete.push(`products/${n}`))
        }
      }

      if (toDelete.length > 0) {
        await supabase.storage.from(BUCKET).remove(toDelete)
      }

      setCleanResult({ deleted: toDelete.length, kept: allFiles.length - toDelete.length })
      if (toDelete.length > 0) await loadFiles()
    } catch (e) {
      setCleanResult({ error: e.message })
    } finally {
      setCleanRunning(false)
    }
  }, [loadFiles])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // ── Filtro búsqueda ───────────────────────────────────────────
  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Formatear tamaño ──────────────────────────────────────────
  const fmtSize = (bytes) => {
    if (!bytes) return '?'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalSize = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0)

  return (
    <div className="min-h-dvh bg-dark pb-24 pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark/95 backdrop-blur-xl border-b border-white/5">
        <div className="pt-4 pb-3 space-y-3">
          <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                <Images size={20} className="text-accent" />
                Medios
              </h1>
              <p className="text-[11px] text-white mt-0.5">
                {files.length} archivos · {fmtSize(totalSize)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Limpieza de duplicados — botón temporal */}
              {!cleanRunning && !selectMode && (
                <button
                  onClick={cleanDuplicates}
                  title="Eliminar duplicados .webp"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90
                    ${cleanResult?.deleted > 0
                      ? 'bg-green-900/20 border-green-900/40 text-green-400'
                      : cleanResult?.deleted === 0
                        ? 'bg-dark-600 border-white/10 text-accent/60'
                        : 'bg-dark-600 border-white/10 text-white/40'
                    }`}
                >
                  <Trash2 size={15} />
                </button>
              )}
              {cleanRunning && (
                <div className="w-9 h-9 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
                </div>
              )}
              {/* Migración de variantes */}
              {!migRunning && !selectMode && (
                <button
                  onClick={scanVariants}
                  title="Optimizar imágenes (thumb, medium, web)"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90
                    ${migDone
                      ? 'bg-green-900/20 border-green-900/40 text-green-400'
                      : migPlan !== null && migPlan.missingThumb.length === 0 && migPlan.missingMedium.length === 0 && migPlan.heavyWeb.length === 0
                        ? 'bg-dark-600 border-white/10 text-accent/60'
                        : 'bg-dark-600 border-white/10 text-white/40'
                    }`}
                >
                  <Wand2 size={15} />
                </button>
              )}
              {/* Toggle columnas */}
              <button
                onClick={() => setCols(c => c === 3 ? 2 : 3)}
                className="w-9 h-9 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all"
              >
                {cols === 3 ? <Grid2X2 size={16} /> : <Grid3X3 size={16} />}
              </button>
              {/* Selección */}
              <button
                onClick={() => {
                  setSelectMode(m => !m)
                  setSelected(new Set())
                  setConfirmDelete(false)
                }}
                className={`px-3 h-9 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95
                  ${selectMode
                    ? 'bg-accent text-black border-accent'
                    : 'bg-dark-600 text-white/50 border-white/10'
                  }`}
              >
                {selectMode ? 'Cancelar' : 'Seleccionar'}
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="search"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-accent/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-white" />
              </button>
            )}
          </div>

          {/* Barra selección */}
          {selectMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-xs text-white/50 font-semibold px-3 py-2 rounded-xl bg-dark-600 border border-white/10 active:scale-95 transition-all"
              >
                {selected.size === filtered.length && filtered.length > 0
                  ? <CheckSquare size={14} className="text-accent" />
                  : <Square size={14} />
                }
                {selected.size === filtered.length && filtered.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 font-bold px-3 py-2 rounded-xl bg-red-900/20 border border-red-900/40 active:scale-95 transition-all ml-auto"
                >
                  <Trash2 size={14} />
                  Eliminar {selected.size}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zona drag & drop / upload */}
      <div className="pt-0 md:pt-4">
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-2xl py-4 flex items-center gap-4 px-4 transition-all cursor-pointer
            ${dragOver
              ? 'border-accent bg-accent/5 scale-[1.01]'
              : 'border-white/10 bg-dark-700/30'
            }
            ${uploading ? 'opacity-60 pointer-events-none' : ''}
          `}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center shrink-0">
            {uploading
              ? <div className="w-5 h-5 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
              : <Upload size={20} className="text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            {uploading ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-white/60">Subiendo... {progress}%</p>
                <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-white/60">
                  {dragOver ? '¡Suelta aquí!' : 'Subir imágenes'}
                </p>
                <p className="text-xs text-white/25 mt-0.5">
                  Arrastra o toca · Optimizado automáticamente a WebP
                </p>
              </>
            )}
          </div>
          {/* Botón cámara inline */}
          {!uploading && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); cameraRef.current?.click() }}
              className="w-10 h-10 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center text-white active:border-accent/60 active:text-accent transition-all shrink-0"
            >
              <Camera size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Banner limpieza de duplicados */}
      {cleanResult && (
        <div className="pt-3">
          <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 ${cleanResult.error ? 'bg-red-900/20 border border-red-900/40' : 'bg-dark-700 border border-white/10'}`}>
            <Trash2 size={15} className={cleanResult.error ? 'text-red-400 shrink-0' : 'text-white/40 shrink-0'} />
            <p className={`text-sm flex-1 ${cleanResult.error ? 'text-red-400' : 'text-white/60'}`}>
              {cleanResult.error
                ? `Error: ${cleanResult.error}`
                : cleanResult.deleted === 0
                  ? 'Sin duplicados encontrados'
                  : `${cleanResult.deleted} duplicado${cleanResult.deleted !== 1 ? 's' : ''} eliminado${cleanResult.deleted !== 1 ? 's' : ''}`
              }
            </p>
            <button onClick={() => setCleanResult(null)} className="text-white/20 active:text-white/50">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Banner de migración / optimización */}
      {(migPlan !== null || migRunning || migDone) && (
        <div className="pt-3">
          {migDone && !migRunning && (
            <div className="flex items-center gap-2.5 bg-green-900/20 border border-green-900/40 rounded-2xl px-4 py-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-green-400 text-sm font-bold">¡Optimización completada!</p>
                <p className="text-green-400/60 text-xs mt-0.5">
                  {migProgress.done - migProgress.errors} procesadas
                  {migProgress.skipped > 0 && ` · ${migProgress.skipped} sin cambios`}
                  {migProgress.errors > 0 && ` · ${migProgress.errors} errores`}
                </p>
              </div>
              <button onClick={() => { setMigDone(false); setMigPlan(null) }}
                className="text-white/20 active:text-white/50 transition-colors">
                <X size={15} />
              </button>
            </div>
          )}

          {migRunning && (
            <div className="bg-dark-700 border border-white/10 rounded-2xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 size={14} className="text-accent animate-pulse" />
                  <span className="text-sm font-bold text-white">Optimizando imágenes...</span>
                </div>
                <span className="text-xs font-mono text-white/40">
                  {migProgress.done}/{migProgress.total}
                </span>
              </div>
              <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${migProgress.total ? (migProgress.done / migProgress.total) * 100 : 0}%` }}
                />
              </div>
              {migProgress.errors > 0 && (
                <p className="text-xs text-red-400/70">{migProgress.errors} errores</p>
              )}
            </div>
          )}

          {!migRunning && !migDone && migPlan !== null && (() => {
            const totalThumb = migPlan.missingThumb.length
            const totalMedium = migPlan.missingMedium.length
            const totalHeavy = migPlan.heavyWeb.length
            const total = new Set([
              ...migPlan.missingThumb.map(f => f.name),
              ...migPlan.missingMedium.map(f => f.name),
              ...migPlan.heavyWeb.map(f => f.name),
            ]).size
            const allOk = total === 0
            return (
              <div className="bg-dark-700 border border-white/10 rounded-2xl px-4 py-3 space-y-2.5">
                <div className="flex items-start gap-3">
                  <Wand2 size={16} className={`shrink-0 mt-0.5 ${allOk ? 'text-accent/50' : 'text-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">
                      {allOk ? 'Todo al día' : `${total} imagen${total !== 1 ? 'es' : ''} para optimizar`}
                    </p>
                    {!allOk && (
                      <div className="mt-1.5 space-y-0.5">
                        {totalThumb > 0 && <p className="text-xs text-white/40">· {totalThumb} sin thumbnail (admin)</p>}
                        {totalMedium > 0 && <p className="text-xs text-white/40">· {totalMedium} sin medium (tienda)</p>}
                        {totalHeavy > 0 && <p className="text-xs text-white/40">· {totalHeavy} con peso {'>'} 300 KB</p>}
                      </div>
                    )}
                  </div>
                  {!allOk && (
                    <button
                      onClick={runMigration}
                      className="shrink-0 px-3 py-2 rounded-xl bg-accent text-black text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all"
                    >
                      Optimizar
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Grid de imágenes */}
      <div className="pt-4">
        {loading ? (
          <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-dark-600 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-white/20">
            <Img size={40} strokeWidth={1} />
            <p className="text-sm font-semibold">
              {search ? 'Sin resultados' : 'No hay imágenes aún'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-accent/70 underline">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">
              {filtered.length} {filtered.length === 1 ? 'imagen' : 'imágenes'}
              {search && ` encontradas`}
            </p>
            <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {filtered.map(file => {
                const url = getPublicUrl(file.name)
                const isSelected = selected.has(file.name)
                return (
                  <div
                    key={file.name}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-dark-600 cursor-pointer transition-all duration-150
                      ${isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-dark scale-[0.97]' : ''}
                    `}
                    onClick={() => {
                      if (selectMode) {
                        toggleSelect(file.name)
                      } else {
                        setLightbox({ url, name: file.name, size: file.metadata?.size })
                      }
                    }}
                  >
                    <img
                      src={mediumUrl(url)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={mediumFallback(url)}
                    />
                    {/* Overlay tamaño */}
                    {!selectMode && (
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white/70 text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                        {fmtSize(file.metadata?.size)}
                      </div>
                    )}
                    {/* Check selección */}
                    {selectMode && (
                      <div className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? 'bg-accent border-accent'
                          : 'bg-black/50 border-white/40'
                        }`}
                      >
                        {isSelected && <Check size={12} color="black" strokeWidth={3} />}
                      </div>
                    )}
                    {/* Lupa en hover/tap */}
                    {!selectMode && (
                      <div className="absolute inset-0 bg-black/0 active:bg-black/30 flex items-center justify-center transition-all">
                        <ZoomIn size={20} className="text-white opacity-0 active:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 flex items-start gap-2 bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-3">
          <X size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* Botón recarga */}
      {!loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadFiles}
            className="flex items-center gap-2 text-xs text-white/25 font-semibold px-4 py-2 rounded-xl bg-dark-700 border border-white/5 active:scale-95 transition-all"
          >
            <RefreshCw size={12} /> Recargar
          </button>
        </div>
      )}

      {/* Modal confirmación borrar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-dark-800 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 border border-red-900/50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white">
                  ¿Eliminar {selected.size} {selected.size === 1 ? 'imagen' : 'imágenes'}?
                </p>
                <p className="text-sm text-white/40 mt-1 leading-relaxed">
                  Esta acción es permanente y no se puede deshacer. Los productos que usen estas imágenes perderán sus fotos.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-dark-600 border border-white/10 text-white/60 font-semibold text-sm active:scale-95 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-900/40 border border-red-900/60 text-red-400 font-bold text-sm active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  : <Trash2 size={15} />
                }
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between px-4 pt-safe py-3 shrink-0">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{lightbox.name}</p>
              <p className="text-white/40 text-xs">{fmtSize(lightbox.size)}</p>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all shrink-0"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
