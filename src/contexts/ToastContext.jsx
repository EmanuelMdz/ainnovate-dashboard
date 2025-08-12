import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      title: toast.title,
      description: toast.description,
      variant: toast.variant || 'default',
      duration: toast.duration || 5000,
    }

    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, newToast.duration)

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ title: options })
    }
    return addToast(options)
  }, [addToast])

  toast.success = useCallback((title, description) => {
    return addToast({ title, description, variant: 'default' })
  }, [addToast])

  toast.error = useCallback((title, description) => {
    return addToast({ title, description, variant: 'destructive' })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
