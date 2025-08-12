import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function FolderItem({ folder, sectionId, level = 0, expandedFolders, onToggleFolder }) {
  const isExpanded = expandedFolders.has(folder.id)
  const hasChildren = folder.children && folder.children.length > 0

  return (
    <div>
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
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sm"
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
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              sectionId={sectionId}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FolderTree({ folders, sectionId, expandedFolders, onToggleFolder }) {
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
      
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          sectionId={sectionId}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
        />
      ))}
    </div>
  )
}
