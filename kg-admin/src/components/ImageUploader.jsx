import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { Camera, Image as Img, X, Upload, Check, Clipboard, Star } from 'lucide-react'
import { optimizeImages } from '../utils/imageOptimizer'

const GOOGLE_API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY || ''
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL || 'https://jkwndsbhrycyqwweungi.supabase.co'
const GOOGLE_SCOPE     = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/photoslibrary.readonly'

export default function ImageUploader({ images = [], onChange }) {
  const fileRef   = useRef()
  const cameraRef = useRef()

  const [uploading, setUploading]           = useState(false)
  const [progress, setProgress]             = useState(0)
  const [error, setError]                   = useState('')
  const [selectedIdx, setSelectedIdx]       = useState(null)
  const [pasteSupported, setPasteSupported] = useState(false)
  const [pasteFlash, setPasteFlash]         = useState(false)
  const [urlInput, setUrlInput]             = useState('')
  const [showUrlInput, setShowUrlInput]     = useState(false)

  const googleEnabled                     = !!(GOOGLE_API_KEY && GOOGLE_CLIENT_ID)
  const [gapiReady, setGapiReady]         = useState(false)
  const [gisReady, setGisReady]           = useState(false)
  const [tokenClient, setTokenClient]     = useState(null)
  const [accessToken, setAccessToken]     = useState(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    setPasteSupported(typeof navigator !== 'undefined' && !!navigator.clipboard?.read)
  }, [])

  // Cargar Google APIs
  useEffect(() => {
    if (!googleEnabled) return
    const gapiScript = document.createElement('script')
    gapiScript.src = 'https://apis.google.com/js/api.js'
    gapiScript.onload = () => {
      window.gapi.load('client:picker', async () => {
        await window.gapi.client.init({ apiKey: GOOGLE_API_KEY })
        setGapiReady(true)
      })
    }
    document.body.appendChild(gapiScript)

    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        callback: () => {},
      })
      setTokenClient(client)
      setGisReady(true)
    }
    document.body.appendChild(gisScript)

    return () => {
      if (document.body.contains(gapiScript)) document.body.removeChild(gapiScript)
      if (document.body.contains(gisScript)) document.body.removeChild(gisScript)
    }
  }, [googleEnabled])

  // Upload directo a Supabase (para cámara/galería)
  const uploadToSupabase = async (file) => {
    const ext = file.type?.split('/')?.[1]?.replace('jpeg', 'jpg') || 'jpg'
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('product-images').getPublicUrl(filename)
    return data.publicUrl
  }

  // ── Descargar foto via Edge Function proxy ──────────────
  // La Edge Function corre en el servidor de Supabase (no en el browser)
  // así que Google no bloquea el request con CORS
  const downloadViaProxy = async (item, token) => {
    const { data: { session } } = await supabase.auth.getSession()
    const authHeader = session?.access_token
      ? `Bearer ${session.access_token}`
      : ''

    // Obtener el mejor thumbnail disponible
    const thumbnails = item.thumbnails || []
    const bestThumb  = thumbnails.length > 0
      ? thumbnails.reduce((a, b) => (a.width || 0) > (b.width || 0) ? a : b)
      : null

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/google-photos-proxy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          fileId:       item.id,        // ← era 'mediaItemId', debe ser 'fileId'
          mimeType:     item.mimeType || 'image/jpeg',
          accessToken:  token,
          thumbnailUrl: bestThumb?.url || null,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error ${res.status}`)
    }

    const { publicUrl } = await res.json()
    if (!publicUrl) throw new Error('No se recibió URL pública')
    return publicUrl
  }

  // Procesar archivos locales
  const handleFiles = useCallback(async (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')
    setSelectedIdx(null)
    try {
      // Optimizar primero antes de subir
      const optimized = await optimizeImages(arr)
      const urls = []
      for (let i = 0; i < optimized.length; i++) {
        setProgress(Math.round((i / optimized.length) * 100))
        try { urls.push(await uploadToSupabase(optimized[i])) }
        catch { urls.push(URL.createObjectURL(optimized[i])) }
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

  // Google Picker
  const openGooglePicker = useCallback(() => {
    if (!gapiReady || !gisReady) return

    const showPicker = (token) => {
      setGoogleLoading(false)

      console.log('[ImageUploader] Opening Google Picker with token:', token.substring(0, 20) + '...')

      try {
        const photosView = new window.google.picker.PhotosView()
        const driveView  = new window.google.picker.DocsView(
          window.google.picker.ViewId.DOCS_IMAGES
        ).setIncludeFolders(true)

        // Origen explícito — evita el bug donde parent apunta a /favicon.ico
        const origin = window.location.protocol + '//' + window.location.host

        const picker = new window.google.picker.PickerBuilder()
          .setTitle('Selecciona fotos')
          .addView(photosView)
          .addView(driveView)
          .setOAuthToken(token)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setOrigin(origin)
          .setAppId(GOOGLE_CLIENT_ID.split('-')[0])
          .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
          .setCallback(async (data) => {
            console.log('[ImageUploader] Picker callback triggered:', { action: data.action })
            
            if (data.action === window.google.picker.Action.CANCEL) {
              console.log('[ImageUploader] User cancelled picker')
              return
            }

            if (data.action === window.google.picker.Action.ERROR) {
              const errMsg = data.error?.[0] || 'Unknown error'
              console.error('[ImageUploader] Picker error:', errMsg)
              setError(`Google error: ${errMsg}`)
              return
            }

            if (data.action !== window.google.picker.Action.PICKED) return
            
            const picked = data[window.google.picker.Response.DOCUMENTS] || []
            console.log('[ImageUploader] Picked items:', picked.length)
            
            if (!picked.length) return

            setUploading(true)
            setError('')
            const urls = []

            for (let i = 0; i < picked.length; i++) {
              setProgress(Math.round((i / picked.length) * 100))
              try {
                console.log('[ImageUploader] Processing item', i + 1, '/', picked.length)
                // Usar Edge Function proxy — evita el bloqueo CORS de Google
                const publicUrl = await downloadViaProxy(picked[i], token)
                urls.push(publicUrl)
              } catch (e) {
                console.error('[ImageUploader] Error descargando foto:', e)
                setError(`Error: ${e.message}`)
              }
              setProgress(Math.round(((i + 1) / picked.length) * 100))
            }

            if (urls.length) onChange([...images, ...urls])
            setUploading(false)
            setProgress(0)
          })
          .build()

        console.log('[ImageUploader] Picker built successfully, showing...')
        picker.setVisible(true)
      } catch (e) {
        console.error('[ImageUploader] Error building picker:', e.message)
        setError(`Error al abrir Google Picker: ${e.message}`)
        setGoogleLoading(false)
      }
    }

    if (accessToken) { 
      console.log('[ImageUploader] Using existing access token')
      setGoogleLoading(true)
      showPicker(accessToken)
      return 
    }

    console.log('[ImageUploader] Requesting new access token...')
    setGoogleLoading(true)
    tokenClient.callback = (response) => {
      if (response.access_token) {
        console.log('[ImageUploader] Got access token, opening picker')
        setAccessToken(response.access_token)
        showPicker(response.access_token)
      } else {
        console.error('[ImageUploader] Failed to get access token:', response)
        setGoogleLoading(false)
        setError('No se pudo autenticar con Google.')
      }
    }
    tokenClient.requestAccessToken({ prompt: '' })
  }, [gapiReady, gisReady, tokenClient, accessToken, images, onChange])

  // Pegar portapapeles
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

  // Ctrl+V desktop
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

  // Deseleccionar al tocar fuera
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

  return (
    <div className="space-y-4">
      {/* Grid imágenes */}
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
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-accent text-black text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
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

      {/* Botones carga */}
      <div className={`grid gap-3 ${googleEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
          <Camera size={26} /><span>Cámara</span>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
          <Img size={26} /><span>Galería</span>
        </button>
        {googleEnabled && (
          <button type="button" onClick={openGooglePicker}
            disabled={uploading || googleLoading || !gapiReady || !gisReady}
            className="border-2 border-dashed border-white/10 rounded-2xl py-5 flex flex-col items-center gap-2.5 text-white/40 text-xs font-bold uppercase tracking-wider active:border-accent/60 active:text-accent active:bg-accent/5 transition-all disabled:opacity-40">
            {googleLoading
              ? <div className="w-6 h-6 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
              : (
                <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
                  <path d="M24 9.5C28.14 9.5 31.84 11.07 34.57 13.65L40.25 7.97C36.32 4.36 31.13 2 24 2C14.72 2 6.8 7.37 3 15.08L9.69 20.26C11.37 14.11 17.19 9.5 24 9.5Z" fill="#EA4335"/>
                  <path d="M46.1 24.55C46.1 22.84 45.96 21.18 45.7 19.56H24V28.99H36.42C35.85 31.99 34.17 34.53 31.68 36.24L38.19 41.32C42.07 37.73 44.45 32.71 44.45 26.63C44.45 25.93 46.1 25.24 46.1 24.55Z" fill="#4285F4"/>
                  <path d="M9.69 27.74C9.24 26.43 8.98 25.04 8.98 23.6C8.98 22.16 9.24 20.77 9.69 19.46L3 14.28C1.63 17.07 0.9 20.24 0.9 23.6C0.9 26.96 1.63 30.13 3 32.92L9.69 27.74Z" fill="#FBBC05"/>
                  <path d="M24 46.2C31.13 46.2 37.1 43.88 41.33 39.83L34.82 34.75C32.87 36.08 30.43 36.87 27.07 36.87C20.26 36.87 14.37 32.26 12.69 26.11L6 31.29C9.8 39 17.72 46.2 24 46.2Z" fill="#34A853"/>
                </svg>
              )
            }
            <span>{googleLoading ? 'Abriendo...' : 'G. Photos'}</span>
          </button>
        )}
      </div>

      {/* Pegar */}
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

      {/* Progreso */}
      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/30">
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
    </div>
  )
}