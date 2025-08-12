import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Search, Heart, ChevronRight, Folder } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CardGrid from '@/components/cards/CardGrid'
import DraggableCardGrid from '@/components/cards/DraggableCardGrid'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CardForm from '@/components/cards/CardForm'
import { getSections, getFoldersBySection, getCardsInTree, reorderCards, deleteCard } from '@/lib/queries'
import { supabase } from '@/lib/supabaseClient'
import { buildFolderTree, debounce } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function FolderView({ favorites, recent }) {
  const { sectionId, folderId } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [cardsState, setCardsState] = useState([])
  const [deleteCardConfirm, setDeleteCardConfirm] = useState({ open: false, card: null })
  const [editCard, setEditCard] = useState({ open: false, card: null })

  // Fetch section details
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections
  })

  // Fetch folders for breadcrumb navigation
  const { data: folders = [], refetch: refetchFolders } = useQuery({
    queryKey: ['folders', sectionId],
    queryFn: () => getFoldersBySection(sectionId),
    enabled: !!sectionId
  })

  // Simple direct folder fetch for current folder
  const { data: currentFolder } = useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      if (!folderId) return null
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!folderId
  })

  // Fetch cards in this folder tree
  const { data: cards = [] } = useQuery({
    queryKey: ['cards-in-tree', folderId],
    queryFn: () => getCardsInTree(folderId),
    enabled: !!folderId
  })



  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: (data, cardId) => {
      // Remove from recent items in localStorage
      recent.removeFromRecent(cardId)
      
      // Invalidate all card-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['cards-in-tree', folderId] })
      queryClient.invalidateQueries({ queryKey: ['cards-without-folder', sectionId] })
      queryClient.invalidateQueries({ queryKey: ['cards', sectionId] })
      queryClient.invalidateQueries({ queryKey: ['search-cards'] }) // For search results
      queryClient.invalidateQueries({ queryKey: ['favorite-cards'] }) // For favorites
      toast.success('Card deleted successfully')
      setDeleteCardConfirm({ open: false, card: null })
    },
    onError: (error) => {
      toast.error('Failed to delete card: ' + error.message)
    }
  })

  const section = sections.find(s => s.id === sectionId)
  // Use direct folder fetch instead of searching through folders array
  const folder = currentFolder || folders.find(f => f.id === folderId)
  
  // Debug logging for folder data
  console.log('🔍 FolderView - Current folder data:', folder)
  console.log('🔍 FolderView - Direct folder data:', currentFolder)
  console.log('🔍 FolderView - Folder image_url:', folder?.image_url)
  
  // Track folder changes
  useEffect(() => {
    if (folder) {
      console.log('🔄 FolderView - Folder data changed:', {
        id: folder.id,
        name: folder.name,
        image_url: folder.image_url,
        hasImage: !!folder.image_url
      })
    }
  }, [folder, folder?.image_url, currentFolder])

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    if (!folder || !folders.length) return []
    
    const path = []
    let currentFolder = folder
    
    while (currentFolder) {
      path.unshift(currentFolder)
      currentFolder = folders.find(f => f.id === currentFolder.parent_id)
    }
    
    return path
  }

  const breadcrumbPath = getBreadcrumbPath()

  // Filter cards based on search and favorites
  let displayCards = cards

  if (searchQuery) {
    displayCards = cards.filter(card => 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  if (showFavoritesOnly) {
    displayCards = displayCards.filter(card => favorites.isFavorite(card.card_id || card.id))
  }

  const debouncedSearch = debounce((value) => {
    setSearchQuery(value)
  }, 300)

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  // Reset cards state when folder changes
  useEffect(() => {
    setCardsState([])
  }, [folderId])

  // Sync local state for DnD when we can reorder
  const canReorder = !searchQuery && !showFavoritesOnly
  useEffect(() => {
    if (canReorder) {
      setCardsState(cards)
    }
  }, [canReorder, cards])

  const handleReorder = async (newOrder) => {
    try {
      await reorderCards(newOrder)
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['cards-in-tree', folderId] })
    } catch (e) {
      console.error('Failed to reorder cards', e)
    }
  }

  const handleDeleteCard = (card) => {
    setDeleteCardConfirm({ open: true, card })
  }

  const handleEditCard = (card) => {
    setEditCard({ open: true, card })
  }

  const confirmDeleteCard = () => {
    if (deleteCardConfirm.card) {
      // Cards from getCardsInTree might use card_id instead of id
      const cardId = deleteCardConfirm.card.id || deleteCardConfirm.card.card_id
      deleteCardMutation.mutate(cardId)
    }
  }

  if (!section || !folder) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">❓</div>
          <p className="text-muted-foreground">Folder not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link to={`/s/${sectionId}`} className="hover:text-foreground">
            {section.name}
          </Link>
          {breadcrumbPath.map((pathFolder, index) => (
            <div key={pathFolder.id} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4" />
              <Link 
                to={`/s/${sectionId}/f/${pathFolder.id}`}
                className={`hover:text-foreground ${
                  index === breadcrumbPath.length - 1 ? 'text-foreground font-medium' : ''
                }`}
              >
                {pathFolder.name}
              </Link>
            </div>
          ))}
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Folder className="h-6 w-6 mr-3 text-blue-500" />
            <h1 className="text-3xl font-bold">{folder.name}</h1>
          </div>
          <p className="text-muted-foreground">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Resources in this folder and subfolders'}
          </p>
        </div>

        {/* Folder Image - SIMPLE APPROACH */}
        <div className="mb-8">
          <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
            <img
              key={`folder-image-${folderId}-${Date.now()}`}
              src={`https://krdrqfibrvndkfaenasb.supabase.co/storage/v1/object/public/dashboard-images/folders/${folderId}.webp?t=${Date.now()}`}
              alt={folder?.name || 'Folder'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards in this folder..."
                className="pl-10"
                onChange={handleSearchChange}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content with Statistics */}
        <div className="relative">
          {/* Statistics positioned in top right */}
          <div className="absolute top-0 right-0 z-10 space-y-3 w-48">
            {/* Total Cards */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">{displayCards.length}</div>
              <div className="text-xs text-muted-foreground">Total Cards</div>
            </div>

            {/* Favorites */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {displayCards.filter(card => favorites.isFavorite(card.card_id || card.id)).length}
              </div>
              <div className="text-xs text-muted-foreground">Favorites</div>
            </div>

            {/* Types */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {new Set(displayCards.map(card => card.type)).size}
              </div>
              <div className="text-xs text-muted-foreground">Types</div>
            </div>
          </div>

          {/* Cards Grid - Main Content */}
          <div className="pr-52">
            {canReorder ? (
              <DraggableCardGrid
                cards={cardsState}
                setCards={setCardsState}
                onReorder={handleReorder}
                favorites={favorites}
                recent={recent}
                onDeleteCard={handleDeleteCard}
                onEditCard={handleEditCard}
              />
            ) : (
              <CardGrid
                cards={displayCards}
                favorites={favorites}
                recent={recent}
                onDeleteCard={handleDeleteCard}
                onEditCard={handleEditCard}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteCardConfirm.open}
        onOpenChange={(open) => setDeleteCardConfirm({ open, card: null })}
        title="Delete Card"
        description={`Are you sure you want to delete "${deleteCardConfirm.card?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDeleteCard}
      />

      {/* Edit Card Modal */}
      <CardForm
        open={editCard.open}
        onOpenChange={(open) => setEditCard({ open, card: null })}
        sectionId={sectionId}
        folderId={folderId}
        card={editCard.card}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['cards-in-tree', folderId] })
          setEditCard({ open: false, card: null })
        }}
      />
    </div>
  )
}
