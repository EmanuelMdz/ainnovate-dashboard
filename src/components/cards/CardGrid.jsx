import Card from './Card'
import { cn } from '@/lib/utils'

export default function CardGrid({ cards, favorites, recent, className, onDeleteCard, onEditCard }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <p>No cards found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4",
      className
    )}>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          favorites={favorites}
          recent={recent}
          onDelete={onDeleteCard}
          onEdit={onEditCard}
        />
      ))}
    </div>
  )
}
