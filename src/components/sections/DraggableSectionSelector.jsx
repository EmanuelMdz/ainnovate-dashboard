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
                          className="w-full justify-start text-left h-auto p-2"
                          onClick={() => onSectionSelect(section.id)}
                        >
                          <div className="flex items-center space-x-2 w-full">
                            {section.image_url ? (
                              <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={section.image_url} 
                                  alt={section.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : section.icon ? (
                              <span className="text-lg flex-shrink-0">{section.icon}</span>
                            ) : (
                              <div 
                                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: section.color || '#f3f4f6' }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {section.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate block">{section.name}</span>
                              {section.description && (
                                <span className="text-xs text-muted-foreground truncate block">
                                  {section.description}
                                </span>
                              )}
                            </div>
                            {section.color && !section.image_url && (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: section.color }}
                              />
                            )}
                          </div>
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
