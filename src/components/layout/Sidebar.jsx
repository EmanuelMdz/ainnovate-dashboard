import { useState, useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Home, 
  Settings, 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Folder,
  FolderOpen
} from 'lucide-react'
import AinnovateLogoDark from '../images/ainnovate-logo-blue.svg'
import AinnovateLogoLight from '../images/logo_ainnovate_svg_blanco_horizontal.svg'
import { Button } from '@/components/ui/button'
import { getSections, getFoldersBySection, reorderFoldersInParent, moveFolderToParent, reorderSections } from '@/lib/queries'
import { buildFolderTree } from '@/lib/utils'
import SectionSelector from '@/components/sections/SectionSelector'
import DraggableSectionSelector from '@/components/sections/DraggableSectionSelector'
import FolderTree from '@/components/folders/FolderTree'
import DraggableFolderTree from '@/components/folders/DraggableFolderTree'

export default function Sidebar({ isOpen, onToggle, darkMode, onToggleDarkMode, selectedSectionId, onSectionSelect }) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  // Extract current folder ID from URL
  const getCurrentFolderId = () => {
    const match = location.pathname.match(/\/s\/[^/]+\/f\/([^/]+)/)
    return match ? match[1] : null
  }

  const currentFolderId = getCurrentFolderId()

  // Fetch sections
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: getSections
  })

  // Fetch folders for selected section
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', selectedSectionId],
    queryFn: () => getFoldersBySection(selectedSectionId),
    enabled: !!selectedSectionId
  })

  const folderTree = buildFolderTree(folders)

  // Function to find all ancestor folder IDs for a given folder
  const findAncestorFolders = (folderId, allFolders) => {
    const ancestors = new Set()
    
    const findParents = (id) => {
      const folder = allFolders.find(f => f.id === id)
      if (folder && folder.parent_id) {
        ancestors.add(folder.parent_id)
        findParents(folder.parent_id)
      }
    }
    
    findParents(folderId)
    return ancestors
  }

  // Auto-expand folders when navigating to a folder URL
  useEffect(() => {
    if (currentFolderId && folders.length > 0) {
      const ancestorIds = findAncestorFolders(currentFolderId, folders)
      const newExpanded = new Set(expandedFolders)
      
      // Add all ancestors to expanded set
      ancestorIds.forEach(id => newExpanded.add(id))
      
      // Also expand the current folder if it has children
      const currentFolder = folders.find(f => f.id === currentFolderId)
      if (currentFolder && folders.some(f => f.parent_id === currentFolderId)) {
        newExpanded.add(currentFolderId)
      }
      
      setExpandedFolders(newExpanded)
    }
  }, [currentFolderId, folders])

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleReorderFolders = async (folderId, parentId, fromIndex, toIndex) => {
    try {
      await reorderFoldersInParent(folderId, parentId, fromIndex, toIndex)
      queryClient.invalidateQueries({ queryKey: ['folders', selectedSectionId] })
    } catch (e) {
      console.error('Failed to reorder folders', e)
    }
  }

  const handleMoveFolderToParent = async (folderId, newParentId, newIndex) => {
    try {
      await moveFolderToParent(folderId, newParentId, newIndex)
      queryClient.invalidateQueries({ queryKey: ['folders', selectedSectionId] })
    } catch (e) {
      console.error('Failed to move folder', e)
    }
  }

  const handleReorderSections = async (newOrder) => {
    try {
      await reorderSections(newOrder)
      queryClient.invalidateQueries({ queryKey: ['sections'] })
    } catch (e) {
      console.error('Failed to reorder sections', e)
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className={`fixed left-0 top-0 h-full bg-card border-r transition-all duration-300 z-40 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {isOpen ? (
            <div className="flex items-center justify-center flex-1">
              <img 
                src={darkMode ? AinnovateLogoLight : AinnovateLogoDark} 
                alt="Ainnovate" 
                className="h-15 w-auto"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img 
                src={darkMode ? AinnovateLogoLight : AinnovateLogoDark} 
                alt="Ainnovate" 
                className="h-15 w-auto"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={isOpen ? "ml-auto" : "hidden"}
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1">
            {/* Home */}
            <Link to="/" onClick={() => onSectionSelect?.(null)}>
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${!isOpen && 'px-2'}`}
              >
                <Home className="h-4 w-4" />
                {isOpen && <span className="ml-2">Home</span>}
              </Button>
            </Link>

            {/* Section Selector */}
            {isOpen && (
              <div className="pt-4">
                <DraggableSectionSelector
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  onSectionSelect={onSectionSelect}
                  onReorderSections={handleReorderSections}
                />
              </div>
            )}

            {/* Folder Tree */}
            {isOpen && selectedSectionId && (
              <div className="pt-2">
                <DraggableFolderTree
                  folders={folderTree}
                  sectionId={selectedSectionId}
                  expandedFolders={expandedFolders}
                  currentFolderId={currentFolderId}
                  onToggleFolder={toggleFolder}
                  onReorderFolders={handleReorderFolders}
                  onMoveFolderToParent={handleMoveFolderToParent}
                />
              </div>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-2 border-t space-y-1">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            onClick={onToggleDarkMode}
            className={`w-full justify-start ${!isOpen && 'px-2'}`}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isOpen && <span className="ml-2">{darkMode ? 'Light' : 'Dark'}</span>}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            className={`w-full justify-start ${!isOpen && 'px-2'}`}
          >
            <Settings className="h-4 w-4" />
            {isOpen && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
