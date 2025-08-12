import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import SectionForm from '@/components/sections/SectionForm'
import FolderForm from '@/components/folders/FolderForm'
import CardForm from '@/components/cards/CardForm'
import ImportExport from '@/components/admin/ImportExport'
import CommandK from '@/components/search/CommandK'
import Home from '@/pages/Home'
import SectionView from '@/pages/SectionView'
import FolderView from '@/pages/FolderView'
import CardDetailModal from '@/pages/CardDetailModal'
import { useFavorites } from '@/hooks/useFavorites'
import { useRecent } from '@/hooks/useRecent'

function App() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [commandKOpen, setCommandKOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)

  // Dialog states
  const [sectionFormOpen, setSectionFormOpen] = useState(false)
  const [folderFormOpen, setFolderFormOpen] = useState(false)
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [importExportOpen, setImportExportOpen] = useState(false)
  
  const favorites = useFavorites()
  const recent = useRecent()

  // Initialize dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dashboard-dark-mode')
    if (stored) {
      setDarkMode(JSON.parse(stored))
    } else {
      // Default to system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('dashboard-dark-mode', JSON.stringify(darkMode))
  }, [darkMode])

  // Keep selectedSectionId in sync with route (/s/:sectionId or /s/:sectionId/f/:folderId)
  useEffect(() => {
    const match = location.pathname.match(/^\/s\/([^\/]+)/)
    if (match) {
      setSelectedSectionId(match[1])
    } else {
      setSelectedSectionId(null)
    }
  }, [location.pathname])

  // Command K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandKOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          selectedSectionId={selectedSectionId}
          onSectionSelect={setSelectedSectionId}
        />

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          {/* Topbar */}
          <Topbar
            selectedSectionId={selectedSectionId}
            onNewSection={() => setSectionFormOpen(true)}
            onNewFolder={() => setFolderFormOpen(true)}
            onNewCard={() => setCardFormOpen(true)}
            onOpenImportExport={() => setImportExportOpen(true)}
          />

          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  favorites={favorites}
                  recent={recent}
                />
              } 
            />
            <Route 
              path="/s/:sectionId" 
              element={
                <SectionView 
                  favorites={favorites}
                  recent={recent}
                />
              } 
            />
            <Route 
              path="/s/:sectionId/f/:folderId" 
              element={
                <FolderView 
                  favorites={favorites}
                  recent={recent}
                />
              } 
            />
            <Route 
              path="/c/:cardId" 
              element={
                <CardDetailModal 
                  favorites={favorites}
                  recent={recent}
                />
              } 
            />
          </Routes>

          {/* Dialogs */}
          <SectionForm
            open={sectionFormOpen}
            onOpenChange={setSectionFormOpen}
          />
          <FolderForm
            sectionId={selectedSectionId}
            open={folderFormOpen}
            onOpenChange={setFolderFormOpen}
          />
          <CardForm
            sectionId={selectedSectionId}
            open={cardFormOpen}
            onOpenChange={setCardFormOpen}
          />
          <ImportExport
            open={importExportOpen}
            onOpenChange={setImportExportOpen}
          />
        </main>

        {/* Command Palette */}
        <CommandK 
          open={commandKOpen}
          onOpenChange={setCommandKOpen}
        />

        {/* Toast Viewport */}
        <ToastViewport />
      </div>
    </ToastProvider>
  )
}

export default App
