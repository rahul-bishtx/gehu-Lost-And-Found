import { useRef, useState, useEffect } from 'react'

export default function ImageUpload({ onFileSelect, preview, setPreview }) {
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  // Close lightbox on ESC key
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.')
      return
    }
    onFileSelect(file)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-outline-variant bg-surface-muted">
          {/* Clickable preview — opens lightbox */}
          <div className="relative cursor-zoom-in group" onClick={() => setLightbox(true)}>
            <img src={preview} alt="Preview" className="w-full h-56 object-contain bg-surface-muted" />
            {/* Zoom hint overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity duration-200">
                zoom_in
              </span>
            </div>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => { setPreview(null); onFileSelect(null) }}
            className="absolute top-3 right-3 bg-on-surface/80 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-on-surface transition-all shadow-md active:scale-95 z-10"
            title="Remove photo"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
            dragOver
              ? 'border-primary bg-surface-container-high'
              : 'border-outline-variant bg-surface-muted hover:border-primary/50'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-surface shadow-sm flex items-center justify-center mb-3 text-primary">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          
          <p className="font-body text-base font-semibold text-on-surface mb-1">
            Add a photo of the item
          </p>
          <p className="font-body text-xs text-on-secondary-container mb-5 max-w-xs">
            Drag &amp; drop here or choose an option below (max. 5MB)
          </p>

          {/* Action Buttons: Mobile Camera + Gallery */}
          <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex-1 min-w-[140px] bg-primary text-on-primary font-body text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              Take Photo
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 min-w-[140px] bg-surface border-2 border-primary text-primary font-body text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">photo_library</span>
              Choose File
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Picker (Gallery / Storage) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Hidden Camera Picker (Direct Mobile Camera) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 z-10"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          {/* Full image — stop propagation so clicking image doesn't close */}
          <img
            src={preview}
            alt="Full preview"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
