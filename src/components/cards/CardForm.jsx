import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { 
  createCard, 
  updateCard, 
  deleteCard, 
  getFoldersBySection, 
  getCardFolders,
  updateCardFolders,
  uploadImage, 
  deleteImage 
} from '@/lib/queries'
import { buildFolderTree, isValidUrl } from '@/lib/utils'

export default function CardForm({ card, sectionId, open, onOpenChange, onSuccess }) {
  const queryClient = useQueryClient()
  const isEditing = !!card

  const [formData, setFormData] = useState({
    title: card?.title || '',
    description: card?.description || '',
    url: card?.url || '',
    image_url: card?.image_url || '',
    type: card?.type || 'link',
    tags: card?.tags || [],
    is_favorite: card?.is_favorite || false,
    order_index: card?.order_index || 0
  })

  const [selectedFolders, setSelectedFolders] = useState([])
  const [newTag, setNewTag] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(card?.image_url || '')

  // Fetch folders for selection
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', sectionId],
    queryFn: () => getFoldersBySection(sectionId),
    enabled: !!sectionId && open
  })

  // Fetch current card folders if editing
  const { data: cardFolders = [] } = useQuery({
    queryKey: ['card-folders', card?.id],
    queryFn: () => getCardFolders(card.id),
    enabled: !!card?.id && open
  })

  useEffect(() => {
    if (cardFolders.length > 0) {
      setSelectedFolders(cardFolders.map(cf => cf.folder_id))
    }
  }, [cardFolders])

  const folderTree = buildFolderTree(folders)

  const createMutation = useMutation({
    mutationFn: createCard,
    onSuccess: async (newCard) => {
      // Update card folders
      if (selectedFolders.length > 0) {
        await updateCardFolders(newCard.id, selectedFolders)
      }
      
      queryClient.invalidateQueries(['cards-without-folder', sectionId])
      queryClient.invalidateQueries(['cards', sectionId])
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => updateCard(id, data),
    onSuccess: async () => {
      // Update card folders
      await updateCardFolders(card.id, selectedFolders)
      
      queryClient.invalidateQueries(['cards-without-folder', sectionId])
      queryClient.invalidateQueries(['cards', sectionId])
      queryClient.invalidateQueries(['card-folders', card.id])
      onSuccess?.()
      onOpenChange(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries(['cards-without-folder', sectionId])
      queryClient.invalidateQueries(['cards', sectionId])
      onSuccess?.()
      onOpenChange(false)
    }
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      image_url: '',
      type: 'link',
      tags: [],
      is_favorite: false,
      order_index: 0
    })
    setSelectedFolders([])
    setNewTag('')
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

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleFolderToggle = (folderId) => {
    setSelectedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isValidUrl(formData.url)) {
      alert('Por favor ingresa una URL válida')
      return
    }

    let finalFormData = { ...formData, section_id: sectionId }

    // Upload image if selected
    if (imageFile) {
      try {
        const { url } = await uploadImage(imageFile, 'cards')
        finalFormData.image_url = url
        
        // Delete old image if updating
        if (isEditing && card.image_url) {
          const oldPath = card.image_url.split('/').pop()
          await deleteImage(`cards/${oldPath}`)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        // Continue without image
      }
    }

    if (isEditing) {
      updateMutation.mutate({ id: card.id, ...finalFormData })
    } else {
      createMutation.mutate(finalFormData)
    }
  }

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta card?')) {
      deleteMutation.mutate(card.id)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderFolderCheckboxes = (folders, level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} className="space-y-1">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedFolders.includes(folder.id)}
            onChange={() => handleFolderToggle(folder.id)}
            className="rounded"
          />
          <span style={{ paddingLeft: `${level * 16}px` }} className="text-sm">
            {folder.name}
          </span>
        </label>
        {folder.children && renderFolderCheckboxes(folder.children, level + 1)}
      </div>
    ))
  }

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Card' : 'Nueva Card'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Título de la card"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="link">Link</option>
                <option value="gpt">GPT</option>
                <option value="app">App</option>
                <option value="doc">Documento</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">URL *</label>
            <Input
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://ejemplo.com"
              type="url"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción de la card"
              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Carpetas</label>
            <div className="max-h-32 overflow-y-auto border border-input rounded-md p-3 space-y-1">
              {folderTree.length > 0 ? (
                renderFolderCheckboxes(folderTree)
              ) : (
                <p className="text-sm text-muted-foreground">No hay carpetas disponibles</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_favorite}
                  onChange={(e) => handleChange('is_favorite', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Favorito</span>
              </label>
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
