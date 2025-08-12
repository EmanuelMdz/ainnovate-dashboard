import { supabase, IMAGES_BUCKET } from './supabaseClient'

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

export const deleteSection = async (id) => {
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', id)
  
  if (error) throw error
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

export const deleteFolder = async (id) => {
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

export const deleteCard = async (id) => {
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

// ===== IMAGE UPLOAD =====
export const uploadImage = async (file, path) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = path ? `${path}/${fileName}` : fileName
  
  const { data, error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(filePath, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from(IMAGES_BUCKET)
    .getPublicUrl(filePath)
  
  return { path: filePath, url: publicUrl }
}

export const deleteImage = async (path) => {
  const { error } = await supabase.storage
    .from(IMAGES_BUCKET)
    .remove([path])
  
  if (error) throw error
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
