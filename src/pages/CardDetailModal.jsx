import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Heart, Copy, X, Tag, Calendar, Link as LinkIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCard } from '@/lib/queries'
import { copyToClipboard, extractDomain } from '@/lib/utils'

export default function CardDetailModal({ favorites, recent }) {
  const { cardId } = useParams()
  const navigate = useNavigate()

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => getCard(cardId),
    enabled: !!cardId
  })

  const handleClose = () => {
    navigate(-1)
  }

  const handleOpen = () => {
    if (card) {
      recent.addToRecent(card)
      window.open(card.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyUrl = async () => {
    if (card) {
      const success = await copyToClipboard(card.url)
      // TODO: Show toast notification
    }
  }

  const handleToggleFavorite = () => {
    if (card) {
      favorites.toggleFavorite(card.id)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'gpt':
        return '🤖'
      case 'app':
        return '📱'
      case 'doc':
        return '📄'
      default:
        return '🔗'
    }
  }

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!card) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="text-4xl mb-2">❓</div>
            <p className="text-muted-foreground">Card not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isFavorite = favorites.isFavorite(card.id)

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <span className="text-2xl">{getTypeIcon(card.type)}</span>
            <span>{card.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {card.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={card.image_url}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {card.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{card.description}</p>
            </div>
          )}

          {/* URL */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <LinkIcon className="h-4 w-4 mr-2" />
              URL
            </h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                {card.url}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Domain: {extractDomain(card.url)}
            </p>
          </div>

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Type</h4>
              <p className="text-muted-foreground capitalize">{card.type}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Created</h4>
              <p className="text-muted-foreground">
                {new Date(card.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button onClick={handleOpen} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resource
            </Button>
            
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className="flex-1"
            >
              <Heart 
                className={`h-4 w-4 mr-2 ${
                  isFavorite ? 'fill-red-500 text-red-500' : ''
                }`}
              />
              {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
