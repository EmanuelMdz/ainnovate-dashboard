import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import ImageUpload from '@/components/ui/ImageUpload'
import { createFolder, updateFolder, createFolderWithImage, updateFolderWithImage, deleteFolder, getFoldersBySection } from '@/lib/queries'
import { uploadImage, deleteImage } from '@/lib/imageUtils'
import { buildFolderTree } from '@/lib/utils'

export default function FolderForm({ folder, sectionId, open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient()
  const isEditing = !!folder

  const [formData, setFormData] = useState({
    name: folder?.name || '',
    parent_id: folder?.parent_id || null,
    image_url: folder?.image_url || '',
    order_index: folder?.order_index || 0
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(folder?.image_url || '')

  // Fetch folders for parent selection
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', sectionId],
    queryFn: () => getFoldersBySection(sectionId),
    enabled: !!sectionId && open
  })

  const folderTree = buildFolderTree(folders.filter(f => f.id !== folder?.id)) // Exclude current folder

  // Update form data when folder prop changes (for editing)
  useEffect(() => {
    if (folder && open) {
      setFormData({
        name: folder.name || '',
        parent_id: folder.parent_id || null,
        image_url: folder.image_url || '',
        order_index: folder.order_index || 0
      })
      setImagePreview(folder.image_url || '')
    } else if (!folder && open) {
      // Reset form for new folder creation
      resetForm()
    }
  }, [folder, open])

  const createMutation = useMutation({
    mutationFn: ({ folderData, imageFile }) => createFolderWithImage(folderData, imageFile),
    onSuccess: () => {
      // Invalidate all folder-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['folders'] }) // All folder queries
      queryClient.invalidateQueries({ queryKey: ['cards-in-tree'] }) // Folder view cards
      queryClient.invalidateQueries({ queryKey: ['search-cards'] }) // Search results that might include folder context
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates, imageFile }) => updateFolderWithImage(id, updates, imageFile),
    onSuccess: () => {
      // Invalidate all folder-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['folders'] }) // All folder queries
      queryClient.invalidateQueries({ queryKey: ['cards-in-tree'] }) // Folder view cards
      queryClient.invalidateQueries({ queryKey: ['search-cards'] }) // Search results that might include folder context
      onSuccess?.()
      onOpenChange(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      // Invalidate all folder-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ['folders'] }) // All folder queries
      queryClient.invalidateQueries({ queryKey: ['cards-in-tree'] }) // Folder view cards
      queryClient.invalidateQueries({ queryKey: ['search-cards'] }) // Search results that might include folder context
      onSuccess?.()
      onOpenChange(false)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      parent_id: null,
      image_url: '',
      order_index: 0
    })
    setImageFile(null)
    setImagePreview('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    let finalFormData = { ...formData, section_id: sectionId }

    if (isEditing) {
      updateMutation.mutate({ 
        id: folder.id, 
        updates: finalFormData, 
        imageFile: imageFile 
      })
    } else {
      createMutation.mutate({ 
        folderData: finalFormData, 
        imageFile: imageFile 
      })
    }
  }

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta carpeta? Esto también eliminará todas las subcarpetas.')) {
      deleteMutation.mutate(folder.id)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderFolderOptions = (folders, level = 0) => {
    const options = []
    folders.forEach(folder => {
      options.push(
        <option key={folder.id} value={folder.id}>
          {'  '.repeat(level) + folder.name}
        </option>
      )
      if (folder.children && folder.children.length > 0) {
        options.push(...renderFolderOptions(folder.children, level + 1))
      }
    })
    return options
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Carpeta' : 'Nueva Carpeta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nombre de la carpeta"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Carpeta padre</label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => handleChange('parent_id', e.target.value || null)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Sin carpeta padre (raíz)</option>
              {renderFolderOptions(folderTree)}
            </select>
          </div>

          <ImageUpload
            currentImage={folder?.image_url}
            onImageSelect={(file) => {
              setImageFile(file)
              setImagePreview(URL.createObjectURL(file))
            }}
            onImageRemove={() => {
              setImageFile(null)
              setImagePreview('')
            }}
            disabled={isLoading}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">Orden</label>
            <Input
              type="number"
              value={formData.order_index}
              onChange={(e) => handleChange('order_index', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

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
