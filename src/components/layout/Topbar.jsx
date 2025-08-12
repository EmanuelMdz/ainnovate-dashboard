import { Button } from '@/components/ui/button'
import { Plus, Upload, Layers, FolderPlus, FilePlus2 } from 'lucide-react'

export default function Topbar({
  selectedSectionId,
  onNewSection,
  onNewFolder,
  onNewCard,
  onOpenImportExport,
}) {
  const hasSection = !!selectedSectionId

  return (
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          <Layers className="h-4 w-4 mr-2" />
          Ainnovate Dashboard
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onNewSection} className="hidden sm:flex">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Sección</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onNewFolder} disabled={!hasSection} className="hidden sm:flex">
            <FolderPlus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Carpeta</span>
          </Button>
          <Button variant="default" size="sm" onClick={onNewCard} disabled={!hasSection}>
            <FilePlus2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Card</span>
          </Button>
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          <Button variant="secondary" size="sm" onClick={onOpenImportExport} className="hidden sm:flex">
            <Upload className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Import/Export</span>
          </Button>
          
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <Button variant="outline" size="sm" onClick={onNewSection}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
