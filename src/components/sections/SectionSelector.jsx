import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function SectionSelector({ sections, selectedSectionId, onSectionSelect }) {
  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Sections
      </div>
      
      {sections.map((section) => (
        <div key={section.id}>
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
      ))}
      
      {sections.length === 0 && (
        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
          No sections yet
        </div>
      )}
    </div>
  )
}
