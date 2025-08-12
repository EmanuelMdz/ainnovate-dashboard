import { supabase, IMAGES_BUCKET } from './supabaseClient'

/**
 * Compress and resize image before upload
 * @param {File} file - The image file to process
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Processed image blob
 */
export const processImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(resolve, 'image/webp', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload image to Supabase Storage
 * @param {File|Blob} file - Image file to upload
 * @param {string} path - Storage path (e.g., 'sections/section-id.webp')
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadImage = async (file, path) => {
  try {
    // Process image before upload
    const processedImage = await processImage(file)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, processedImage, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(path)
    
    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage
 * @param {string} path - Storage path to delete
 */
export const deleteImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .remove([path])
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Generate storage path for section image
 * @param {string} sectionId - Section ID
 * @param {string} fileName - Original file name
 * @returns {string} - Storage path
 */
export const getSectionImagePath = (sectionId, fileName) => {
  const extension = fileName.split('.').pop()
  return `sections/${sectionId}.webp`
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {boolean} - Whether file is valid
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no válido. Use JPG, PNG o WebP.')
  }
  
  if (file.size > maxSize) {
    throw new Error('El archivo es demasiado grande. Máximo 5MB.')
  }
  
  return true
}
