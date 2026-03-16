import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { Camera, Image as Img, X, Upload, Check, Clipboard } from 'lucide-react'

export default function ImageUploader({ images = [], onChange }) {
  const fileRef   = useRef()
  const cameraRef = useRef()
  const [uploading, setUploading]           = useState(false)
  const [progress, setProgress]             = useState(0)
  const [error, setError]                   = useState('')
  const [pasteSupported, setPasteSupported] = useState(false)
  const [pasteFlash, setPasteFlash]         = useState(false)
  const [urlInput, setUrlInput]             = useState('')
  const [showUrlInput, setShowUrlInput]     = useState(false)

  // Detectar si Clipboard API está disponible
  // Android Chrome: sí. Safari iOS: no (navigator.clipboard.read no existe)
  useEffect(() => {
    setPasteSupported(
      typeof navigator !== 'undefined' &&
      !!navigator.clipboard?.read
    )
  }, [])

  // Upload a Supabase Storage
  const uploadToSupabase = async (file) => {
    const ext = file.type?.split('/')?.[1] || 'jpg'
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)
    return urlData.publicUrl
  }

  // Procesar archivos
  const handleFiles = useCallback(async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (let i = 0; i < arr.length; i++) {
        setProgress(Math.round((i / arr.length) * 100))
        try {
          const url = await uploadToSupabase(arr[i])
          urls.push(url)
        } catch {
          urls.push(URL.createObjectURL(arr[i]))
        }
        setProgress(Math.round(((i + 1) / arr.length) * 100))
      }
      onChange([...images, ...urls])
    } catch {
      setError('Error al subir. Verifica el bucket "product-images" en Supabase Storage.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [images, onChange])

  // Botón pegar — Android Chrome via Clipboard API
  const handlePasteButton = async () => {
    setError('')
    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageFiles = []
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File(
            [blob],
            `paste-${Date.now()}.${imageType.split('/')[1] || 'png'}`,
            { type: imageType }
          )
          imageFiles.push(file)
        }
      }
      if (imageFiles.length === 0) {
        setError('No hay imagen copiada. Mantén presionada una imagen → "Copiar imagen" y vuelve aquí.')
        return
      }
      setPasteFlash(true)
      setTimeout(() => setPasteFlash(false), 1200)
      await handleFiles(imageFiles)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permite el acceso al portapapeles cuando el navegador lo solicite.')
      } else {
        setError('No se pudo leer el portapapeles. Usa Galería para subir la imagen.')
      }
    }
  }

  // Pegar URL de imagen (fallback iOS)
  const handleUrlAdd = () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('Ingresa una URL válida que empiece con https://')
      return
    }
    onChange([...images, url])
    setUrlInput('')
    setShowUrlInput(false)
    setError('')
  }

  // Ctrl+V / Cmd+V en desktop
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      const imageFiles = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault()
        setPasteFlash(true)
        setTimeout(() => setPasteFlash(false), 1200)
        handleFiles(imageFiles)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handleFiles])

  const remove    = (idx) => onChange(images.filter((_, i) => i !== idx))
  const moveFirst = (idx) => {
    const arr = [...images]
    const [item] = arr.splice(idx, 1)
    arr.unshift(item)
    onChange(arr)
  }

  return (
    <div className="space-y-3">

      {/* Grid de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={url + i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-600 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-accent text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                  Principal
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-active:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                {i !== 0 && (
                  <button type="button" onClick={() => moveFirst(i)} className="bg-accent text-black rounded-full p-1.5">
                    <Check size={13} />
                  </button>
                )}
                <button type="button" onClick={() => remove(i)} className="bg-red-600 text-white rounded-full p-1.5">
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cámara + Galería */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-xl py-4 flex flex-col items-center gap-2
            text-white/30 text-xs font-bold uppercase tracking-wider active:border-accent/40 active:text-accent
            transition-all disabled:opacity-40">
          <Camera size={22} />
          Cámara
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-xl py-4 flex flex-col items-center gap-2
            text-white/30 text-xs font-bold uppercase tracking-wider active:border-accent/40 active:text-accent
            transition-all disabled:opacity-40">
          <Img size={22} />
          Galería
        </button>
      </div>

      {/* Sección pegar */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/20">
          Pegar imagen copiada
        </p>

        {/* Android Chrome: botón Clipboard API */}
        {pasteSupported && (
          <button type="button" onClick={handlePasteButton} disabled={uploading}
            className={`w-full border-2 border-dashed rounded-xl py-3.5 flex items-center justify-center
              gap-2 text-sm font-bold transition-all disabled:opacity-40
              ${pasteFlash
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-white/10 text-white/40 active:border-accent/40 active:text-accent'}`}>
            <Clipboard size={18} />
            {pasteFlash ? '¡Imagen pegada!' : 'Pegar imagen copiada'}
          </button>
        )}

        {/* iOS Safari: botón para mostrar input de URL */}
        {!pasteSupported && !showUrlInput && (
          <button type="button" onClick={() => setShowUrlInput(true)}
            className="w-full border-2 border-dashed border-white/10 rounded-xl py-3.5 flex items-center
              justify-center gap-2 text-sm font-bold text-white/40 active:border-accent/40 active:text-accent transition-all">
            <Clipboard size={18} />
            Pegar URL de imagen
          </button>
        )}

        {/* Input URL */}
        {showUrlInput && (
          <div className="flex gap-2">
            <input
              autoFocus
              type="url"
              inputMode="url"
              placeholder="Pega aquí la URL de la imagen..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
              className="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5
                text-sm text-white placeholder-white/20 outline-none focus:border-accent/50"
            />
            <button type="button" onClick={handleUrlAdd}
              className="bg-accent text-black font-bold px-4 rounded-xl text-sm active:scale-95 transition-all">
              <Check size={16} />
            </button>
            <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput('') }}
              className="bg-dark-600 text-white/40 px-3 rounded-xl active:scale-95 transition-all">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Instrucciones según dispositivo */}
        <p className="text-[11px] text-white/15 leading-relaxed">
          {pasteSupported
            ? 'En tu celular: mantén presionada la imagen → "Copiar imagen" → vuelve y toca "Pegar imagen copiada".'
            : 'En iPhone: mantén presionada la imagen → "Copiar" → abre el campo de URL y pega con mantener presionado → "Pegar".'
          }
        </p>
      </div>

      {/* Progreso */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/30">
            <span className="flex items-center gap-1.5"><Upload size={11} className="animate-bounce" /> Subiendo...</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs flex items-start gap-1.5">
          <X size={12} className="shrink-0 mt-0.5" />{error}
        </p>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}