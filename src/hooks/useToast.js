import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      title: toast.title,
      description: toast.description,
      variant: toast.variant || 'default', // default, destructive, success
      duration: toast.duration || 5000,
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
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
    return addToast({ title, description, variant: 'success' })
  }, [addToast])

  toast.error = useCallback((title, description) => {
    return addToast({ title, description, variant: 'destructive' })
  }, [addToast])

  return {
    toasts,
    toast,
    removeToast
  }
}
