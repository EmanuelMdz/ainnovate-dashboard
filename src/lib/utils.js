import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Build folder tree from flat array
export function buildFolderTree(folders) {
  const folderMap = new Map()
  const rootFolders = []

  // Create map of all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build tree structure
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder.id)
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id)
      if (parent) {
        parent.children.push(folderNode)
      }
    } else {
      rootFolders.push(folderNode)
    }
  })

  return rootFolders
}

// Flatten folder tree for drag & drop reordering
export function flattenFolderTree(folders, parentId = null, level = 0) {
  const result = []
  
  folders.forEach(folder => {
    if (folder.parent_id === parentId) {
      result.push({ ...folder, level })
      result.push(...flattenFolderTree(folders, folder.id, level + 1))
    }
  })
  
  return result
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Debounce function
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch (err) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// Generate random color
export function generateRandomColor() {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate unique slug from name
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    + '-' + Date.now() // Add timestamp for uniqueness
}

// Extract domain from URL
export function extractDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// Validate URL
export function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
