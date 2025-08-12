import { useState, useEffect } from 'react'

const RECENT_KEY = 'dashboard-recent'
const MAX_RECENT_ITEMS = 10

export function useRecent() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY)
    if (stored) {
      try {
        setRecent(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing recent items from localStorage:', error)
        setRecent([])
      }
    }
  }, [])

  const addToRecent = (card) => {
    const newRecent = [
      { ...card, visitedAt: new Date().toISOString() },
      ...recent.filter(item => item.id !== card.id)
    ].slice(0, MAX_RECENT_ITEMS)
    
    setRecent(newRecent)
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent))
  }

  const removeFromRecent = (cardId) => {
    // Filter by both id and card_id to handle different data structures
    const newRecent = recent.filter(item => 
      item.id !== cardId && item.card_id !== cardId
    )
    setRecent(newRecent)
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent))
  }

  const clearRecent = () => {
    setRecent([])
    localStorage.removeItem(RECENT_KEY)
  }

  const cleanupOrphanedItems = async (getCardFn) => {
    if (!recent.length) return
    
    try {
      // Check which cards still exist
      const validCards = []
      for (const item of recent) {
        try {
          const cardExists = await getCardFn(item.id || item.card_id)
          if (cardExists) {
            validCards.push(item)
          }
        } catch (error) {
          // Card doesn't exist anymore, skip it
          console.log(`Removing orphaned recent item: ${item.title || item.id}`)
        }
      }
      
      // Update recent list with only valid cards
      if (validCards.length !== recent.length) {
        setRecent(validCards)
        localStorage.setItem(RECENT_KEY, JSON.stringify(validCards))
        console.log(`Cleaned up ${recent.length - validCards.length} orphaned recent items`)
      }
    } catch (error) {
      console.error('Error cleaning up orphaned recent items:', error)
    }
  }

  return {
    recent,
    addToRecent,
    removeFromRecent,
    clearRecent,
    cleanupOrphanedItems
  }
}
