import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { exportData, importData } from '@/lib/queries'
// import { useToast } from '@/contexts/ToastContext'

export default function ImportExport({ open, onOpenChange }) {
  const queryClient = useQueryClient()
  // const { toast } = useToast()
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)

  const exportMutation = useMutation({
    mutationFn: exportData,
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ainnovate-dashboard-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log('Datos exportados exitosamente')
    },
    onError: (error) => {
      console.error('Error de exportación:', error)
    }
  })

  const importMutation = useMutation({
    mutationFn: importData,
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries()
      onOpenChange(false)
      setImportFile(null)
      setImportPreview(null)
      console.log('Datos importados exitosamente')
    },
    onError: (error) => {
      console.error('Import error:', error)
      console.error('Error de importación: Verifica el formato del archivo')
    }
  })

  const handleExport = () => {
    exportMutation.mutate()
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          setImportPreview(data)
        } catch (error) {
          alert('Error al leer el archivo JSON')
          setImportFile(null)
        }
      }
      reader.readAsText(file)
    } else {
      alert('Por favor selecciona un archivo JSON válido')
    }
  }

  const handleImport = () => {
    if (importPreview) {
      const confirmed = window.confirm(
        '⚠️ ADVERTENCIA: Esta acción eliminará todos los datos existentes y los reemplazará con los datos del archivo. ¿Estás seguro de que quieres continuar?'
      )
      
      if (confirmed) {
        importMutation.mutate(importPreview)
      }
    }
  }

  const isLoading = exportMutation.isPending || importMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import/Export de Datos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Exportar Datos
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Descarga todos los datos del dashboard en formato JSON como respaldo.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={isLoading}
              className="w-full"
            >
              {exportMutation.isPending ? 'Exportando...' : 'Exportar Datos'}
            </Button>
          </div>

          {/* Import Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Importar Datos
            </h3>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Advertencia:</strong> Esta acción eliminará todos los datos existentes 
                  y los reemplazará con los datos del archivo importado. Asegúrate de tener un respaldo.
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Seleccionar archivo JSON
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  disabled={isLoading}
                />
              </div>

              {importPreview && (
                <div className="bg-muted rounded-md p-3">
                  <h4 className="font-medium mb-2">Vista previa del archivo:</h4>
                  <div className="text-sm space-y-1">
                    <div>Secciones: {importPreview.sections?.length || 0}</div>
                    <div>Carpetas: {importPreview.folders?.length || 0}</div>
                    <div>Cards: {importPreview.cards?.length || 0}</div>
                    <div>Relaciones: {importPreview.card_folders?.length || 0}</div>
                    {importPreview.exported_at && (
                      <div className="text-muted-foreground">
                        Exportado: {new Date(importPreview.exported_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleImport} 
                disabled={!importPreview || isLoading}
                variant="destructive"
                className="w-full"
              >
                {importMutation.isPending ? 'Importando...' : 'Importar Datos'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
