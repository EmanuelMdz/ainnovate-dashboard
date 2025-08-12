import { useState, useEffect } from 'react'

const FAVORITES_KEY = 'dashboard-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing favorites from localStorage:', error)
        setFavorites([])
      }
    }
  }, [])

  const addToFavorites = (cardId) => {
    const newFavorites = [...favorites, cardId]
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }

  const removeFromFavorites = (cardId) => {
    const newFavorites = favorites.filter(id => id !== cardId)
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }

  const toggleFavorite = (cardId) => {
    if (favorites.includes(cardId)) {
      removeFromFavorites(cardId)
    } else {
      addToFavorites(cardId)
    }
  }

  const isFavorite = (cardId) => {
    return favorites.includes(cardId)
  }

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite
  }
}
