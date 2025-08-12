import { useState, useRef } from 'react'
import { Button } from './button'
import { validateImageFile } from '@/lib/imageUtils'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageUpload({ 
  currentImage, 
  onImageSelect, 
  onImageRemove, 
  disabled = false,
  className = "" 
}) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(currentImage)
  const fileInputRef = useRef(null)

  const handleFileSelect = (file) => {
    try {
      validateImageFile(file)
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      
      // Notify parent
      onImageSelect(file)
    } catch (error) {
      alert(error.message)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleRemove = () => {
    setPreview(null)
    onImageRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium block">Imagen de portada</label>
      
      {preview ? (
        <div className="relative group">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={openFileDialog}
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <X className="w-4 h-4 mr-1" />
                  Quitar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`
            w-full h-32 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors duration-200
            ${dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center">
            <span className="font-medium">Haz clic para subir</span> o arrastra una imagen
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WebP hasta 5MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
