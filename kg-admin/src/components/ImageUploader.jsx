import { useState, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { Camera, Image as Img, X, Upload, Check, GripVertical } from 'lucide-react'

export default function ImageUploader({ images = [], onChange }) {
  const fileRef = useRef()
  const cameraRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const uploadToSupabase = async (file) => {
    const ext = file.name.split('.').pop()
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)

    return urlData.publicUrl
  }

  const handleFiles = async (files) => {
    const arr = Array.from(files)
    if (!arr.length) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (let i = 0; i < arr.length; i++) {
        setProgress(Math.round(((i) / arr.length) * 100))
        // Try Supabase storage, fallback to direct URL (keep WC urls)
        try {
          const url = await uploadToSupabase(arr[i])
          urls.push(url)
        } catch {
          // Fallback: use object URL for preview (won't persist)
          urls.push(URL.createObjectURL(arr[i]))
        }
        setProgress(Math.round(((i + 1) / arr.length) * 100))
      }
      onChange([...images, ...urls])
    } catch (e) {
      setError('Error al subir. Verifica el bucket "product-images" en Supabase Storage.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))
  const moveFirst = (idx) => {
    const arr = [...images]
    const [item] = arr.splice(idx, 1)
    arr.unshift(item)
    onChange(arr)
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
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
                  <button
                    type="button"
                    onClick={() => moveFirst(i)}
                    className="bg-accent text-black rounded-full p-1.5"
                    title="Principal"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="bg-red-600 text-white rounded-full p-1.5"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-xl py-4 flex flex-col items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-wider active:border-accent/40 active:text-accent transition-all disabled:opacity-40"
        >
          <Camera size={22} />
          Cámara
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="border-2 border-dashed border-white/10 rounded-xl py-4 flex flex-col items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-wider active:border-accent/40 active:text-accent transition-all disabled:opacity-40"
        >
          <Img size={22} />
          Galería
        </button>
      </div>

      {/* Progress */}
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

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}
