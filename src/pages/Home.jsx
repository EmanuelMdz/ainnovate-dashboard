import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSections, deleteSection, deleteCard, getCard } from '../lib/queries'
import { useFavorites } from '../hooks/useFavorites'
import { useRecent } from '../hooks/useRecent'
import { useToast } from '../hooks/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionForm from '../components/sections/SectionForm'
import CardForm from '../components/cards/CardForm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import CardGrid from '../components/cards/CardGrid'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Heart, Clock, Folder, ArrowRight, Trash2, MoreVertical, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home({ favorites, recent }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // State for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, section: null })
  const [deleteCardConfirm, setDeleteCardConfirm] = useState({ open: false, card: null })
  
  // State for edit modals
  const [editSection, setEditSection] = useState({ open: false, section: null })
  const [editCard, setEditCard] = useState({ open: false, card: null })

  // Fetch sections
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections
  })

  // Cleanup orphaned recent items on component mount
  useEffect(() => {
    if (recent.recent.length > 0) {
      recent.cleanupOrphanedItems(getCard)
    }
  }, []) // Only run once on mount

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      toast.success('Section deleted successfully')
      setDeleteConfirm({ open: false, section: null })
    },
    onError: (error) => {
      toast.error('Failed to delete section: ' + error.message)
    }
  })

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: ({ cardId }) => {
      return deleteCard(cardId)
    },
    onSuccess: (data, { cardId, cardToDelete }) => {
      // Remove from recent items in localStorage
      recent.removeFromRecent(cardId)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['favorite-cards'] })
      toast.success('Card deleted successfully')
      setDeleteCardConfirm({ open: false, card: null })
    },
    onError: (error) => {
      toast.error('Failed to delete card: ' + error.message)
    }
  })

  // Fetch favorite cards
  const { data: favoriteCards = [] } = useQuery({
    queryKey: ['favorite-cards', favorites.favorites],
    queryFn: async () => {
      if (favorites.favorites.length === 0) return []
      const cards = await Promise.allSettled(
        favorites.favorites.map(id => getCard(id))
      )
      return cards
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
    },
    enabled: favorites.favorites.length > 0
  })

  const handleDeleteSection = (section) => {
    setDeleteConfirm({ open: true, section })
  }

  const handleEditSection = (section) => {
    setEditSection({ open: true, section })
  }

  const handleEditCard = (card) => {
    setEditCard({ open: true, card })
  }

  const confirmDeleteSection = () => {
    if (deleteConfirm.section) {
      deleteSectionMutation.mutate(deleteConfirm.section.id)
    }
  }

  const handleDeleteCard = (card) => {
    setDeleteCardConfirm({ open: true, card })
  }

  const confirmDeleteCard = () => {
    if (deleteCardConfirm.card) {
      // Handle both card.id and card.card_id (from different queries)
      const cardId = deleteCardConfirm.card.id || deleteCardConfirm.card.card_id
      const cardToDelete = deleteCardConfirm.card
      deleteCardMutation.mutate({ cardId, cardToDelete })
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Ainnovate Dashboard</h1>
          <p className="text-muted-foreground">
            Your central hub for company resources and tools
          </p>
        </div>

        {/* Sections Grid */}
        {sections.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Explore Sections</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sections.map((section) => (
                <Link key={section.id} to={`/s/${section.id}`} className="block">
                  <Card className="group transition-all duration-200 hover:shadow-lg hover:scale-[1.02] h-full relative overflow-hidden cursor-pointer">
                    {/* Cover Image */}
                    {section.image_url ? (
                      <div className="relative h-32 overflow-hidden">
                        <img 
                          src={section.image_url} 
                          alt={section.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {section.color && (
                          <div 
                            className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: section.color }}
                          />
                        )}
                      </div>
                    ) : (
                      <div 
                        className="h-32 flex items-center justify-center"
                        style={{ backgroundColor: section.color || '#f3f4f6' }}
                      >
                        {section.icon ? (
                          <span className="text-4xl opacity-80">{section.icon}</span>
                        ) : (
                          <Folder className="h-12 w-12 text-white/80" />
                        )}
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {!section.image_url && section.icon && (
                            <span className="text-lg flex-shrink-0">{section.icon}</span>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base truncate">{section.name}</h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditSection(section)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Section
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSection(section)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Section
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {section.color && (
                        <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: section.color }} />
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        {section.description || "Explore resources and tools in this section"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sections.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sections yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first section to start organizing your resources
            </p>
            <Button>
              Create Section
            </Button>
          </div>
        )}

        {/* Recent Section */}
        {recent.recent.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                <h2 className="text-2xl font-semibold">Recently Accessed</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {recent.recent.length} item{recent.recent.length !== 1 ? 's' : ''}
              </span>
            </div>
            <CardGrid
              cards={recent.recent}
              favorites={favorites}
              recent={recent}
              onDeleteCard={handleDeleteCard}
              onEditCard={handleEditCard}
            />
          </div>
        )}

        {/* Empty State for Recent */}
        {recent.recent.length === 0 && sections.length > 0 && (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring sections above to see your recently accessed resources here
            </p>
            <div className="text-sm text-muted-foreground">
              💡 Tip: Use <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> to search globally
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog for Sections */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, section: null })}
        title="Delete Section"
        description={`Are you sure you want to delete "${deleteConfirm.section?.name}"? This action cannot be undone and will also delete all folders and cards within this section.`}
        confirmText="Delete"
        onConfirm={confirmDeleteSection}
      />

      {/* Delete Confirmation Dialog for Cards */}
      <ConfirmDialog
        open={deleteCardConfirm.open}
        onOpenChange={(open) => setDeleteCardConfirm({ open, card: null })}
        title="Delete Card"
        description={`Are you sure you want to delete "${deleteCardConfirm.card?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDeleteCard}
      />

      {/* Edit Section Modal */}
      <SectionForm
        section={editSection.section}
        open={editSection.open}
        onOpenChange={(open) => setEditSection({ open, section: null })}
        onSuccess={() => {
          setEditSection({ open: false, section: null })
          toast.success('Section updated successfully')
        }}
      />

      {/* Edit Card Modal */}
      <CardForm
        card={editCard.card}
        sectionId={editCard.card?.section_id}
        open={editCard.open}
        onOpenChange={(open) => setEditCard({ open, card: null })}
        onSuccess={() => {
          setEditCard({ open: false, card: null })
          toast.success('Card updated successfully')
        }}
      />
    </div>
  )
}
