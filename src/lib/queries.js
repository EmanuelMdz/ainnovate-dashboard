import { supabase, IMAGES_BUCKET } from './supabaseClient'
import { uploadImage, deleteImage, getSectionImagePath, getFolderImagePath, getCardImagePath } from './imageUtils'
import { generateSlug } from './utils'

// ===== SECTIONS =====
export const getSections = async () => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('order_index', { ascending: true })
  
  if (error) throw error
  return data
}

export const createSection = async (section) => {
  const { data, error } = await supabase
    .from('sections')
    .insert([section])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createSectionWithImage = async (sectionData, imageFile) => {
  try {
    // First create the section
    const section = await createSection(sectionData)
    
    // If image provided, upload it
    if (imageFile) {
      const imagePath = getSectionImagePath(section.id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      
      // Update section with image URL
      const updatedSection = await updateSection(section.id, { image_url: imageUrl })
      return updatedSection
    }
    
    return section
  } catch (error) {
    console.error('Error creating section with image:', error)
    throw error
  }
}

export const updateSection = async (id, updates) => {
  const { data, error } = await supabase
    .from('sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateSectionWithImage = async (id, updates, imageFile) => {
  try {
    // If new image provided, upload it
    if (imageFile) {
      const imagePath = getSectionImagePath(id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      updates.image_url = imageUrl
    }
    
    return await updateSection(id, updates)
  } catch (error) {
    console.error('Error updating section with image:', error)
    throw error
  }
}

export const deleteSection = async (id) => {
  try {
    // Get section data to check if it has an image
    const { data: section } = await supabase
      .from('sections')
      .select('image_url')
      .eq('id', id)
      .single()
    
    // Delete the section from database
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Clean up image from storage if it exists
    if (section?.image_url) {
      try {
        const imagePath = getSectionImagePath(id, 'image.webp')
        await deleteImage(imagePath)
      } catch (imageError) {
        console.warn('Could not delete section image:', imageError)
        // Don't throw - section deletion succeeded
      }
    }
  } catch (error) {
    console.error('Error deleting section:', error)
    throw error
  }
}

// ===== FOLDERS =====
export const getFoldersBySection = async (sectionId) => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('section_id', sectionId)
    .order('parent_id', { ascending: true, nullsFirst: true })
    .order('order_index', { ascending: true })
  
  if (error) throw error
  return data
}

export const createFolder = async (folder) => {
  const { data, error } = await supabase
    .from('folders')
    .insert([folder])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateFolder = async (id, updates) => {
  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createFolderWithImage = async (folder, imageFile) => {
  try {
    // First create the folder to get an ID
    const createdFolder = await createFolder(folder)
    
    // If image provided, upload it with unique path
    if (imageFile) {
      const imagePath = getFolderImagePath(createdFolder.id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      
      // Update folder with image URL
      const updatedFolder = await updateFolder(createdFolder.id, { image_url: imageUrl })
      return updatedFolder
    }
    
    return createdFolder
  } catch (error) {
    console.error('Error creating folder with image:', error)
    throw error
  }
}

export const updateFolderWithImage = async (id, updates, imageFile) => {
  try {
    // If new image provided, upload it with unique path
    if (imageFile) {
      const imagePath = getFolderImagePath(id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      updates.image_url = imageUrl
    }
    
    return await updateFolder(id, updates)
  } catch (error) {
    console.error('Error updating folder with image:', error)
    throw error
  }
}

export const deleteFolder = async (id) => {
  // First, get the folder to check if it has an image
  const { data: folder, error: fetchError } = await supabase
    .from('folders')
    .select('image_url')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Delete the image from storage if it exists
  if (folder?.image_url) {
    try {
      const imagePath = getFolderImagePath(id, 'image.webp')
      await deleteImage(imagePath)
    } catch (imageError) {
      console.warn('Failed to delete folder image from storage:', imageError)
      // Continue with folder deletion even if image deletion fails
    }
  }
  
  // Delete the folder from database
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== CARDS =====
export const getCardsBySection = async (sectionId) => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getCardsWithoutFolder = async (sectionId) => {
  const { data, error } = await supabase
    .from('cards_without_folder')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getCardsInTree = async (folderId) => {
  const { data, error } = await supabase
    .rpc('cards_in_tree', { root: folderId })
  
  if (error) throw error
  return data
}

export const getCard = async (id) => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export const createCard = async (card) => {
  const { data, error } = await supabase
    .from('cards')
    .insert([card])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateCard = async (id, updates) => {
  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createCardWithImage = async (card, imageFile) => {
  try {
    // First create the card to get an ID
    const createdCard = await createCard(card)
    
    // If image provided, upload it with unique path
    if (imageFile) {
      const imagePath = getCardImagePath(createdCard.id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      
      // Update card with image URL
      const updatedCard = await updateCard(createdCard.id, { image_url: imageUrl })
      return updatedCard
    }
    
    return createdCard
  } catch (error) {
    console.error('Error creating card with image:', error)
    throw error
  }
}

export const updateCardWithImage = async (id, updates, imageFile) => {
  try {
    // If new image provided, upload it with unique path
    if (imageFile) {
      const imagePath = getCardImagePath(id, imageFile.name)
      const imageUrl = await uploadImage(imageFile, imagePath)
      updates.image_url = imageUrl
    }
    
    return await updateCard(id, updates)
  } catch (error) {
    console.error('Error updating card with image:', error)
    throw error
  }
}

export const deleteCard = async (id) => {
  // First, get the card to check if it has an image
  const { data: card, error: fetchError } = await supabase
    .from('cards')
    .select('image_url')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Delete the image from storage if it exists
  if (card?.image_url) {
    try {
      const imagePath = getCardImagePath(id, 'image.webp')
      await deleteImage(imagePath)
    } catch (imageError) {
      console.warn('Failed to delete card image from storage:', imageError)
      // Continue with card deletion even if image deletion fails
    }
  }
  
  // Delete the card from database
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== CARD-FOLDER RELATIONSHIPS =====
export const getCardFolders = async (cardId) => {
  const { data, error } = await supabase
    .from('card_folders')
    .select(`
      folder_id,
      folders (
        id,
        name,
        section_id
      )
    `)
    .eq('card_id', cardId)
  
  if (error) throw error
  return data
}

export const linkCardToFolder = async (cardId, folderId) => {
  const { data, error } = await supabase
    .from('card_folders')
    .insert([{ card_id: cardId, folder_id: folderId }])
    .select()
  
  if (error) throw error
  return data
}

export const unlinkCardFromFolder = async (cardId, folderId) => {
  const { error } = await supabase
    .from('card_folders')
    .delete()
    .eq('card_id', cardId)
    .eq('folder_id', folderId)
  
  if (error) throw error
}

export const updateCardFolders = async (cardId, folderIds) => {
  // First, remove all existing relationships
  await supabase
    .from('card_folders')
    .delete()
    .eq('card_id', cardId)
  
  // Then add new relationships
  if (folderIds.length > 0) {
    const relationships = folderIds.map(folderId => ({
      card_id: cardId,
      folder_id: folderId
    }))
    
    const { error } = await supabase
      .from('card_folders')
      .insert(relationships)
    
    if (error) throw error
  }
}

// ===== SEARCH =====
export const searchCards = async (query, sectionId = null) => {
  let queryBuilder = supabase
    .from('cards')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
  
  if (sectionId) {
    queryBuilder = queryBuilder.eq('section_id', sectionId)
  }
  
  const { data, error } = await queryBuilder
    .order('is_favorite', { ascending: false })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const searchAll = async (query) => {
  const [sectionsResult, foldersResult, cardsResult] = await Promise.allSettled([
    supabase
      .from('sections')
      .select('*')
      .ilike('name', `%${query}%`),
    supabase
      .from('folders')
      .select('*, sections(name)')
      .ilike('name', `%${query}%`),
    supabase
      .from('cards')
      .select('*, sections(name)')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
  ])
  
  return {
    sections: sectionsResult.status === 'fulfilled' ? sectionsResult.value.data || [] : [],
    folders: foldersResult.status === 'fulfilled' ? foldersResult.value.data || [] : [],
    cards: cardsResult.status === 'fulfilled' ? cardsResult.value.data || [] : []
  }
}



// ===== REORDERING =====
export const reorderSections = async (sections) => {
  const updates = sections.map((section, index) => ({
    id: section.id,
    order_index: index
  }))
  
  const { error } = await supabase
    .from('sections')
    .upsert(updates)
  
  if (error) throw error
}

export const reorderFolders = async (folders) => {
  const updates = folders.map((folder, index) => ({
    id: folder.id,
    order_index: index
  }))
  
  const { error } = await supabase
    .from('folders')
    .upsert(updates)
  
  if (error) throw error
}

export const reorderFoldersInParent = async (folderId, parentId, fromIndex, toIndex) => {
  // Get all folders with same parent
  const { data: siblings, error: fetchError } = await supabase
    .from('folders')
    .select('*')
    .eq('parent_id', parentId)
    .order('order_index')
  
  if (fetchError) throw fetchError
  
  // Reorder array
  const reordered = [...siblings]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  
  // Update order_index for all siblings
  const updates = reordered.map((folder, index) => ({
    id: folder.id,
    order_index: index
  }))
  
  const { error } = await supabase
    .from('folders')
    .upsert(updates)
  
  if (error) throw error
}

export const moveFolderToParent = async (folderId, newParentId, newIndex = 0) => {
  // First update the folder's parent
  const { error: updateError } = await supabase
    .from('folders')
    .update({ parent_id: newParentId, order_index: newIndex })
    .eq('id', folderId)
  
  if (updateError) throw updateError
  
  // Then reorder siblings in new parent
  const { data: siblings, error: fetchError } = await supabase
    .from('folders')
    .select('*')
    .eq('parent_id', newParentId)
    .order('order_index')
  
  if (fetchError) throw fetchError
  
  // Update order_index for all siblings
  const updates = siblings.map((folder, index) => ({
    id: folder.id,
    order_index: index
  }))
  
  const { error } = await supabase
    .from('folders')
    .upsert(updates)
  
  if (error) throw error
}

export const reorderCards = async (cards) => {
  const updates = cards.map((card, index) => ({
    id: card.id,
    order_index: index
  }))
  
  const { error } = await supabase
    .from('cards')
    .upsert(updates)
  
  if (error) throw error
}

// ===== EXPORT/IMPORT =====
export const exportData = async () => {
  const [sectionsResult, foldersResult, cardsResult, cardFoldersResult] = await Promise.allSettled([
    getSections(),
    supabase.from('folders').select('*').order('created_at'),
    supabase.from('cards').select('*').order('created_at'),
    supabase.from('card_folders').select('*')
  ])
  
  return {
    sections: sectionsResult.status === 'fulfilled' ? sectionsResult.value : [],
    folders: foldersResult.status === 'fulfilled' ? foldersResult.value.data || [] : [],
    cards: cardsResult.status === 'fulfilled' ? cardsResult.value.data || [] : [],
    card_folders: cardFoldersResult.status === 'fulfilled' ? cardFoldersResult.value.data || [] : [],
    exported_at: new Date().toISOString()
  }
}

export const importData = async (data) => {
  const { sections, folders, cards, card_folders } = data
  
  // Clear existing data (be careful!)
  await supabase.from('card_folders').delete().neq('card_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('folders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  // Import in order
  if (sections?.length) {
    await supabase.from('sections').insert(sections)
  }
  if (folders?.length) {
    await supabase.from('folders').insert(folders)
  }
  if (cards?.length) {
    await supabase.from('cards').insert(cards)
  }
  if (card_folders?.length) {
    await supabase.from('card_folders').insert(card_folders)
  }
}
