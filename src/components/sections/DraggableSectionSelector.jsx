import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DraggableSectionSelector({ 
  sections, 
  selectedSectionId, 
  onSectionSelect, 
  onReorderSections 
}) {
  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const newOrder = Array.from(sections)
    const [reorderedItem] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, reorderedItem)
    
    onReorderSections?.(newOrder)
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Sections
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={String(section.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(snapshot.isDragging && 'opacity-75')}
                    >
                      <Link to={`/s/${section.id}`}>
                        <Button
                          variant={selectedSectionId === section.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start text-left"
                          onClick={() => onSectionSelect(section.id)}
                        >
                          {section.icon && (
                            <span className="mr-2 text-lg">{section.icon}</span>
                          )}
                          <span className="truncate">{section.name}</span>
                          {section.color && (
                            <div 
                              className="ml-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: section.color }}
                            />
                          )}
                        </Button>
                      </Link>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {sections.length === 0 && (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
          No sections yet
        </div>
      )}
    </div>
  )
}
