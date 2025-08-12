import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Search, Filter, Heart, Folder, FolderOpen, ArrowRight, Trash2, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CardGrid from '@/components/cards/CardGrid'
import DraggableCardGrid from '@/components/cards/DraggableCardGrid'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { getSections, getCardsWithoutFolder, searchCards, reorderCards, getFoldersBySection, deleteFolder, deleteCard } from '@/lib/queries'
import { debounce, buildFolderTree } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function SectionView({ favorites, recent }) {
  const { sectionId } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showWithoutFolderOnly, setShowWithoutFolderOnly] = useState(false)
  const [cardsState, setCardsState] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, folder: null })
  const [deleteCardConfirm, setDeleteCardConfirm] = useState({ open: false, card: null })

  // Fetch section details
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections
  })

  const section = sections.find(s => s.id === sectionId)

  // Fetch folders for this section
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', sectionId],
    queryFn: () => getFoldersBySection(sectionId),
    enabled: !!sectionId
  })

  const folderTree = buildFolderTree(folders)

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', sectionId] })
      toast.success('Folder deleted successfully')
      setDeleteConfirm({ open: false, folder: null })
    },
    onError: (error) => {
      toast.error('Failed to delete folder: ' + error.message)
    }
  })

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards-without-folder', sectionId] })
      toast.success('Card deleted successfully')
      setDeleteCardConfirm({ open: false, card: null })
    },
    onError: (error) => {
      toast.error('Failed to delete card: ' + error.message)
    }
  })

  // Fetch cards without folder for this section
  const { data: cardsWithoutFolder = [] } = useQuery({
    queryKey: ['cards-without-folder', sectionId],
    queryFn: () => getCardsWithoutFolder(sectionId),
    enabled: !!sectionId
  })

  // Search cards if there's a query
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-cards', searchQuery, sectionId],
    queryFn: () => searchCards(searchQuery, sectionId),
    enabled: !!searchQuery && searchQuery.length > 2
  })

  // Determine which cards to show
  let displayCards = searchQuery ? searchResults : cardsWithoutFolder

  // Apply filters
  if (showFavoritesOnly) {
    displayCards = displayCards.filter(card => favorites.isFavorite(card.id))
  }

  if (showWithoutFolderOnly && !searchQuery) {
    // Already showing cards without folder
  }

  const debouncedSearch = debounce((value) => {
    setSearchQuery(value)
  }, 300)

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  // Sync local state for DnD when we can reorder
  const canReorder = !searchQuery && !showFavoritesOnly
  useEffect(() => {
    if (canReorder) {
      setCardsState(displayCards)
    }
  }, [canReorder, displayCards])

  const handleReorder = async (newOrder) => {
    try {
      await reorderCards(newOrder)
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['cards-without-folder', sectionId] })
    } catch (e) {
      console.error('Failed to reorder cards', e)
    }
  }

  const handleDeleteFolder = (folder) => {
    setDeleteConfirm({ open: true, folder })
  }

  const confirmDeleteFolder = () => {
    if (deleteConfirm.folder) {
      deleteFolderMutation.mutate(deleteConfirm.folder.id)
    }
  }

  const handleDeleteCard = (card) => {
    setDeleteCardConfirm({ open: true, card })
  }

  const confirmDeleteCard = () => {
    if (deleteCardConfirm.card) {
      deleteCardMutation.mutate(deleteCardConfirm.card.id)
    }
  }

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">❓</div>
          <p className="text-muted-foreground">Section not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            {section.icon && (
              <span className="text-2xl mr-3">{section.icon}</span>
            )}
            <h1 className="text-3xl font-bold">{section.name}</h1>
            {section.color && (
              <div 
                className="ml-3 w-4 h-4 rounded-full"
                style={{ backgroundColor: section.color }}
              />
            )}
          </div>
          <p className="text-muted-foreground">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Resources not in any folder'}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
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
              
              <Button
                variant={showWithoutFolderOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowWithoutFolderOnly(!showWithoutFolderOnly)}
              >
                <Folder className="h-4 w-4 mr-2" />
                No Folder
              </Button>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        {folderTree.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Explore Folders</h2>
              <span className="text-sm text-muted-foreground">
                {folderTree.length} folder{folderTree.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folderTree.map((folder) => (
                <Card key={folder.id} className="group transition-all duration-200 hover:shadow-lg hover:scale-[1.02] h-full relative">
                  <CardContent className="p-6">
                    {/* Folder Image */}
                    {folder.image_url && (
                      <div className="aspect-video w-full mb-4 overflow-hidden rounded-md bg-muted">
                        <img
                          src={folder.image_url}
                          alt={folder.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <Link to={`/s/${sectionId}/f/${folder.id}`} className="flex items-center space-x-3 flex-1">
                        <FolderOpen className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-lg">{folder.name}</h3>
                        </div>
                      </Link>
                      
                      <div className="flex items-center space-x-2">
                        <Link to={`/s/${sectionId}/f/${folder.id}`}>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(folder)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {folder.children && folder.children.length > 0 
                        ? `${folder.children.length} subfolder${folder.children.length !== 1 ? 's' : ''}`
                        : 'Explore resources in this folder'
                      }
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cards Without Folder */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Folder className="h-5 w-5 mr-2 text-orange-500" />
              <h2 className="text-2xl font-semibold">
                {searchQuery ? `Search Results` : 'Cards Without Folder'}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {displayCards.length} card{displayCards.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {displayCards.length > 0 ? (
            canReorder ? (
              <DraggableCardGrid
                cards={cardsState}
                setCards={setCardsState}
                onReorder={handleReorder}
                favorites={favorites}
                recent={recent}
                onDeleteCard={handleDeleteCard}
              />
            ) : (
              <CardGrid
                cards={displayCards}
                favorites={favorites}
                recent={recent}
                onDeleteCard={handleDeleteCard}
              />
            )
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No cards found' : 'No cards without folder'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'All cards are organized in folders, or create new cards here'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, folder: null })}
        title="Delete Folder"
        description={`Are you sure you want to delete "${deleteConfirm.folder?.name}"? This action cannot be undone and will also delete all subfolders and cards within this folder.`}
        confirmText="Delete"
        onConfirm={confirmDeleteFolder}
      />

      <ConfirmDialog
        open={deleteCardConfirm.open}
        onOpenChange={(open) => setDeleteCardConfirm({ open, card: null })}
        title="Delete Card"
        description={`Are you sure you want to delete "${deleteCardConfirm.card?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDeleteCard}
      />
    </div>
  )
}
