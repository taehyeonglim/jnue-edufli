import { useState, useRef, useEffect, useCallback } from 'react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface UseImageUploadReturn {
  imageFile: File | null
  imagePreview: string | null
  error: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  processImageFile: (file: File) => boolean
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePaste: (e: React.ClipboardEvent) => void
  handleRemoveImage: () => void
  clearError: () => void
}

export function useImageUpload(initialPreview?: string | null): UseImageUploadReturn {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialPreview || null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const processImageFile = useCallback((file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError('이미지 크기는 5MB 이하여야 합니다.')
      return false
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('지원하는 이미지 형식: JPG, PNG, GIF, WebP')
      return false
    }
    setImageFile(file)
    setImagePreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setError('')
    return true
  }, [])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }, [processImageFile])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }
  }, [processImageFile])

  const handleRemoveImage = useCallback(() => {
    setImageFile(null)
    setImagePreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return {
    imageFile,
    imagePreview,
    error,
    fileInputRef,
    processImageFile,
    handleImageChange,
    handlePaste,
    handleRemoveImage,
    clearError,
  }
}
