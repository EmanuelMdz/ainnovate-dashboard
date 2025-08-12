import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import Card from './Card'
import { cn } from '@/lib/utils'

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export default function DraggableCardGrid({ cards, setCards, onReorder, favorites, recent, className, onDeleteCard }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return
    const newOrder = reorder(cards, result.source.index, result.destination.index)
    setCards(newOrder)
    onReorder?.(newOrder)
  }

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
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="card-grid" direction="horizontal" renderClone={null}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4',
              className
            )}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={cn(snapshot.isDragging && 'rotate-1')}
                  >
                    <Card card={card} favorites={favorites} recent={recent} onDelete={onDeleteCard} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
