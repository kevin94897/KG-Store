import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { Camera, Image as Img, X, Upload, Check, Clipboard, Star, Images } from 'lucide-react'
import { optimizeImages } from '../utils/imageOptimizer'
import { mediumUrl, mediumFallback } from '../utils/thumbUrl'
import MediaPickerModal from './MediaPickerModal'

export default function ImageUploader({ images = [], onChange }) {
  const fileRef = useRef()
  const cameraRef = useRef()

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [pasteSupported, setPasteSupported] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  useEffect(() => {
    setPasteSupported(typeof navigator !== 'undefined' && !!navigator.clipboard?.read)
  }, [])

  // Sube el web file con su extensión real (guardada en BD)
  const uploadWebFile = async (file, path) => {
    const ext = file.type?.split('/')?.[1]?.replace('jpeg', 'jpg') || 'webp'
    const filename = `${path}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw upErr
    return filename
  }

  // Variantes (thumb/medium) siempre se guardan como .webp para URL consistente
  const uploadVariant = (file, path) => {
    if (!file) return
    supabase.storage.from('product-images')
      .upload(`${path}.webp`, file, {
        cacheControl: '86400',
        upsert: false,
        contentType: file.type || 'image/webp',
      })
      .catch(() => { })
  }

  const handleFiles = useCallback(async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    setSelectedIdx(null)
    try {
      const optimized = await optimizeImages(arr)
      const urls = []
      for (let i = 0; i < optimized.length; i++) {
        setProgress(Math.round((i / optimized.length) * 100))
        const { webFile, thumbFile, mediumFile } = optimized[i]
        const basename = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        try {
          const webPath = await uploadWebFile(webFile, `products/${basename}`)
          const { data } = supabase.storage.from('product-images').getPublicUrl(webPath)
          urls.push(data.publicUrl)
          uploadVariant(thumbFile, `products/thumbs/${basename}`)
          uploadVariant(mediumFile, `products/medium/${basename}`)
        } catch {
          urls.push(URL.createObjectURL(webFile))
        }
        setProgress(Math.round(((i + 1) / optimized.length) * 100))
      }
      onChange([...images, ...urls])
    } catch {
      setError('Error al subir. Verifica el bucket "product-images" en Supabase Storage.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [images, onChange])

  const handlePasteButton = async () => {
    setError('')
    try {
      const items = await navigator.clipboard.read()
      const imageFiles = []
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          imageFiles.push(new File([blob], `paste-${Date.now()}.${imageType.split('/')[1] || 'png'}`, { type: imageType }))
        }
      }
      if (!imageFiles.length) { setError('No hay imagen copiada.'); return }
      setPasteFlash(true)
      setTimeout(() => setPasteFlash(false), 1200)
      await handleFiles(imageFiles)
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Permite acceso al portapapeles.' : 'Usa Galería para subir.')
    }
  }

  const handleUrlAdd = () => {
    const url = urlInput.trim()
    if (!url || !/^https?:\/\/.+/i.test(url)) { setError('URL inválida'); return }
    onChange([...images, url])
    setUrlInput(''); setShowUrlInput(false); setError('')
  }

  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length) { e.preventDefault(); handleFiles(files) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFiles])

  useEffect(() => {
    const onOut = (e) => {
      if (!e.target.closest('[data-image-grid]')) setSelectedIdx(null)
    }
    document.addEventListener('touchstart', onOut)
    document.addEventListener('mousedown', onOut)
    return () => {
      document.removeEventListener('touchstart', onOut)
      document.removeEventListener('mousedown', onOut)
    }
  }, [])

  const remove = (idx) => { onChange(images.filter((_, i) => i !== idx)); setSelectedIdx(null) }
  const moveFirst = (idx) => {
    const arr = [...images]
    const [item] = arr.splice(idx, 1)
    arr.unshift(item)
    onChange(arr)
    setSelectedIdx(0)
  }

  const handleMediaSelect = (urls) => {
    const newUrls = urls.filter(url => !images.includes(url))
    onChange([...images, ...newUrls])
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div data-image-grid className="grid grid-cols-3 gap-2">
          {images.map((url, i) => {
            const isSelected = selectedIdx === i
            return (
              <div key={url + i}
                className={`relative aspect-square rounded-xl overflow-hidden bg-dark-600 cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark scale-[0.97]' : ''}`}
                onClick={() => setSelectedIdx(prev => prev === i ? null : i)}
              >
                <img src={mediumUrl(url)} alt="" className="w-full h-full object-cover" onError={mediumFallback(url)} />
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-accent text-black text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Star size={8} fill="black" /> Principal
                  </div>
                )}
                {!isSelected && i !== 0 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {i + 1}
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2">
                    {i !== 0 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveFirst(i) }}
                        className="w-full flex items-center justify-center gap-2 bg-accent text-black font-bold text-xs py-2.5 rounded-xl active:scale-95 transition-all">
                        <Star size={13} fill="black" /> Hacer principal
                      </button>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(i) }}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-xs py-2.5 rounded-xl active:scale-95 transition-all">
                      <X size={13} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {images.length > 0 && selectedIdx === null && (
        <p className="text-center text-white/20 text-xs">Toca una imagen para ver opciones</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
          <Camera size={26} /><span>Cámara</span>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
          <Img size={26} /><span>Galería</span>
        </button>
        <button type="button" onClick={() => setShowMediaPicker(true)} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
          <Images size={26} /><span>Medios</span>
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/20">Pegar imagen</p>
        {pasteSupported && (
          <button type="button" onClick={handlePasteButton} disabled={uploading}
            className={`w-full border-2 border-dashed rounded-2xl py-4 flex items-center justify-center gap-2.5 text-sm font-bold transition-all disabled:opacity-40
              ${pasteFlash ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 text-white/40 active:border-accent/60 active:text-accent active:bg-accent/5'}`}>
            <Clipboard size={20} />{pasteFlash ? '¡Pegado!' : 'Pegar imagen copiada'}
          </button>
        )}
        {!pasteSupported && !showUrlInput && (
          <button type="button" onClick={() => setShowUrlInput(true)}
            className="w-full border-2 border-dashed border-white/10 rounded-2xl py-4 flex items-center justify-center gap-2.5 text-sm font-bold text-white/40 active:border-accent/60 active:text-accent active:bg-accent/5 transition-all">
            <Clipboard size={20} />Pegar URL de imagen
          </button>
        )}
        {showUrlInput && (
          <div className="flex gap-2">
            <input autoFocus type="url" inputMode="url" placeholder="https://..."
              value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50" />
            <button type="button" onClick={handleUrlAdd} className="bg-accent text-black font-bold px-4 rounded-xl active:scale-95 transition-all"><Check size={18} /></button>
            <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput('') }} className="bg-dark-600 text-white/40 px-3 rounded-xl active:scale-95 transition-all"><X size={18} /></button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white">
            <span className="flex items-center gap-1.5"><Upload size={11} className="animate-bounce" /> Subiendo...</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-2.5">
          <X size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      {showMediaPicker && (
        <MediaPickerModal
          multiple
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  )
}
