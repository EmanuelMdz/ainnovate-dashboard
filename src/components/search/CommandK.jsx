import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Command } from 'cmdk'
import { Search, Folder, FileText, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { searchAll } from '@/lib/queries'
import { extractDomain } from '@/lib/utils'

export default function CommandK({ open, onOpenChange }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchAll(query),
    enabled: query.length > 2,
    staleTime: 1000 * 30 // 30 seconds
  })

  const handleSelect = (item) => {
    onOpenChange(false)
    setQuery('')
    
    switch (item.type) {
      case 'section':
        navigate(`/s/${item.id}`)
        break
      case 'folder':
        navigate(`/s/${item.section_id}/f/${item.id}`)
        break
      case 'card':
        navigate(`/c/${item.id}`)
        break
    }
  }

  const handleOpenCard = (card) => {
    onOpenChange(false)
    setQuery('')
    window.open(card.url, '_blank', 'noopener,noreferrer')
  }

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search sections, folders, and cards..."
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto">
            {query.length === 0 && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                Type to search across all sections, folders, and cards...
              </Command.Empty>
            )}

            {query.length > 0 && query.length <= 2 && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                Type at least 3 characters to search...
              </Command.Empty>
            )}

            {isLoading && query.length > 2 && (
              <Command.Loading className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </Command.Loading>
            )}

            {searchResults && (
              <>
                {/* Sections */}
                {searchResults.sections.length > 0 && (
                  <Command.Group heading="Sections">
                    {searchResults.sections.map((section) => (
                      <Command.Item
                        key={`section-${section.id}`}
                        value={`section-${section.name}`}
                        onSelect={() => handleSelect({ ...section, type: 'section' })}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent"
                      >
                        <div className="flex items-center flex-1">
                          {section.icon && (
                            <span className="mr-3 text-lg">{section.icon}</span>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{section.name}</div>
                          </div>
                          {section.color && (
                            <div 
                              className="w-3 h-3 rounded-full ml-2"
                              style={{ backgroundColor: section.color }}
                            />
                          )}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Folders */}
                {searchResults.folders.length > 0 && (
                  <Command.Group heading="Folders">
                    {searchResults.folders.map((folder) => (
                      <Command.Item
                        key={`folder-${folder.id}`}
                        value={`folder-${folder.name}`}
                        onSelect={() => handleSelect({ ...folder, type: 'folder' })}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent"
                      >
                        <Folder className="mr-3 h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium">{folder.name}</div>
                          <div className="text-xs text-muted-foreground">
                            in {folder.sections?.name}
                          </div>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Cards */}
                {searchResults.cards.length > 0 && (
                  <Command.Group heading="Cards">
                    {searchResults.cards.map((card) => (
                      <Command.Item
                        key={`card-${card.id}`}
                        value={`card-${card.title}`}
                        onSelect={() => handleSelect({ ...card, type: 'card' })}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent group"
                      >
                        <span className="mr-3 text-lg">{getTypeIcon(card.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{card.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {card.description || extractDomain(card.url)}
                            {card.sections?.name && ` • in ${card.sections.name}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenCard(card)
                            }}
                            className="p-1 hover:bg-accent-foreground/10 rounded"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* No results */}
                {searchResults.sections.length === 0 && 
                 searchResults.folders.length === 0 && 
                 searchResults.cards.length === 0 && 
                 query.length > 2 && !isLoading && (
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </Command.Empty>
                )}
              </>
            )}
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Press Enter to open • Ctrl+K to close</span>
              <span>Global Search</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
