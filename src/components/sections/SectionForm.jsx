import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ImageUpload from '@/components/ui/ImageUpload'
import { createSection, updateSection, deleteSection, createSectionWithImage, updateSectionWithImage } from '@/lib/queries'
import { generateRandomColor } from '@/lib/utils'
// import { useToast } from '@/contexts/ToastContext'

export default function SectionForm({ section, open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient()
  // const { toast } = useToast()
  const isEditing = !!section

  const [formData, setFormData] = useState({
    name: section?.name || '',
    icon: section?.icon || '',
    color: section?.color || generateRandomColor(),
    order_index: section?.order_index || 0
  })
  
  const [selectedImage, setSelectedImage] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)

  // Update form data when section prop changes (for editing)
  useEffect(() => {
    if (section && open) {
      setFormData({
        name: section.name || '',
        icon: section.icon || '',
        color: section.color || generateRandomColor(),
        order_index: section.order_index || 0
      })
      setSelectedImage(null)
      setRemoveImage(false)
    } else if (!section && open) {
      // Reset form for new section creation
      resetForm()
    }
  }, [section, open])

  const createMutation = useMutation({
    mutationFn: ({ sectionData, imageFile }) => {
      if (imageFile) {
        return createSectionWithImage(sectionData, imageFile)
      }
      return createSection(sectionData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sections'])
      console.log('Sección creada exitosamente')
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Error al crear sección:', error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data, imageFile, shouldRemoveImage }) => {
      if (imageFile || shouldRemoveImage) {
        const updates = { ...data }
        if (shouldRemoveImage) {
          updates.image_url = null
        }
        return updateSectionWithImage(id, updates, imageFile)
      }
      return updateSection(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sections'])
      console.log('Sección actualizada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error al actualizar sección:', error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries(['sections'])
      console.log('Sección eliminada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error al eliminar sección:', error)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      color: generateRandomColor(),
      order_index: 0
    })
    setSelectedImage(null)
    setRemoveImage(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isEditing) {
      updateMutation.mutate({ 
        id: section.id, 
        data: formData, 
        imageFile: selectedImage,
        shouldRemoveImage: removeImage
      })
    } else {
      createMutation.mutate({ 
        sectionData: formData, 
        imageFile: selectedImage 
      })
    }
  }

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta sección? Esto eliminará todas las carpetas y cards asociadas.')) {
      deleteMutation.mutate(section.id)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Sección' : 'Nueva Sección'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre de la sección"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Icono (emoji)</label>
            <Input
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="🚀"
              maxLength={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-12 h-10 rounded border"
              />
              <Input
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChange('color', generateRandomColor())}
              >
                Aleatorio
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Orden</label>
            <Input
              type="number"
              value={formData.order_index}
              onChange={(e) => handleChange('order_index', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <ImageUpload
            currentImage={section?.image_url}
            onImageSelect={setSelectedImage}
            onImageRemove={() => {
              setSelectedImage(null)
              setRemoveImage(true)
            }}
            disabled={isLoading}
          />

          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Eliminar
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
