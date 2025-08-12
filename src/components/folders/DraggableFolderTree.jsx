import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function DraggableFolderItem({ folder, sectionId, level = 0, expandedFolders, currentFolderId, onToggleFolder, index }) {
  const isExpanded = expandedFolders.has(folder.id)
  const hasChildren = folder.children && folder.children.length > 0
  const isSelected = folder.id === currentFolderId

  return (
    <Draggable draggableId={String(folder.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(snapshot.isDragging && 'opacity-75')}
        >
          <div className="flex items-center">
            <div style={{ paddingLeft: `${level * 12}px` }} className="flex items-center flex-1">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 mr-1"
                  onClick={() => onToggleFolder(folder.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <div className="w-6 mr-1" />
              )}
              
              <Link to={`/s/${sectionId}/f/${folder.id}`} className="flex-1">
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-8 px-2 text-sm",
                    isSelected && "bg-secondary text-secondary-foreground"
                  )}
                >
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  ) : (
                    <Folder className="h-4 w-4 mr-2" />
                  )}
                  <span className="truncate">{folder.name}</span>
                </Button>
              </Link>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <Droppable droppableId={`folder-${folder.id}`} type="FOLDER">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {folder.children.map((child, childIndex) => (
                    <DraggableFolderItem
                      key={child.id}
                      folder={child}
                      sectionId={sectionId}
                      level={level + 1}
                      expandedFolders={expandedFolders}
                      currentFolderId={currentFolderId}
                      onToggleFolder={onToggleFolder}
                      index={childIndex}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default function DraggableFolderTree({ 
  folders, 
  sectionId, 
  expandedFolders, 
  currentFolderId,
  onToggleFolder, 
  onReorderFolders,
  onMoveFolderToParent 
}) {
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    const folderId = draggableId

    // Moving within same parent
    if (source.droppableId === destination.droppableId) {
      const parentId = source.droppableId === 'folder-root' ? null : source.droppableId.replace('folder-', '')
      onReorderFolders?.(folderId, parentId, source.index, destination.index)
    } else {
      // Moving to different parent
      const newParentId = destination.droppableId === 'folder-root' ? null : destination.droppableId.replace('folder-', '')
      onMoveFolderToParent?.(folderId, newParentId, destination.index)
    }
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
        No folders yet
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Folders
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="folder-root" type="FOLDER">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {folders.map((folder, index) => (
                <DraggableFolderItem
                  key={folder.id}
                  folder={folder}
                  sectionId={sectionId}
                  expandedFolders={expandedFolders}
                  currentFolderId={currentFolderId}
                  onToggleFolder={onToggleFolder}
                  index={index}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
