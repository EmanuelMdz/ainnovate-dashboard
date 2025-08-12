import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Heart, Copy, MoreHorizontal, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { copyToClipboard, extractDomain } from '@/lib/utils'
import { cn } from '@/lib/utils'
// import { useToast } from '@/contexts/ToastContext'

export default function Card({ card, favorites, recent, className, onDelete, onEdit }) {
  const [isHovered, setIsHovered] = useState(false)
  // const { toast } = useToast()
  
  // Handle both card.id and card.card_id (from getCardsInTree)
  const cardId = card.id || card.card_id
  const isFavorite = favorites.isFavorite(cardId)

  const handleOpen = () => {
    recent.addToRecent(card)
    window.open(card.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyUrl = async (e) => {
    e.stopPropagation()
    const success = await copyToClipboard(card.url)
    if (success) {
      console.log('URL copiada al portapapeles')
    } else {
      console.log('Error al copiar URL')
    }
  }

  const handleToggleFavorite = (e) => {
    e.stopPropagation()
    favorites.toggleFavorite(cardId)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(card)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit?.(card)
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

  return (
    <UICard 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpen}
    >
      <CardContent className="p-4">
        {/* Header with image on left */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Small image on left or type icon fallback */}
            {card.image_url ? (
              <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src={card.image_url}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <span className="text-lg flex-shrink-0">{getTypeIcon(card.type)}</span>
            )}
            <h3 className="font-semibold text-sm leading-tight">{card.title}</h3>
          </div>
          
          {/* Action buttons - show on hover */}
          <div className={cn(
            "flex items-center space-x-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleToggleFavorite}
            >
              <Heart 
                className={cn(
                  "h-3 w-3",
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyUrl}
            >
              <Copy className="h-3 w-3 text-muted-foreground" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link 
                    to={`/c/${cardId}`} 
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Card
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Card
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{card.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{extractDomain(card.url)}</span>
          <div className="flex items-center space-x-2">
            {card.is_favorite && (
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            )}
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </UICard>
  )
}
