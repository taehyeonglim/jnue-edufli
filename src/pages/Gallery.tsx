import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { GalleryImage } from '../types'
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage } from '../services/galleryService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { useImageUpload } from '../hooks/useImageUpload'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ImageIcon from '@mui/icons-material/Image'

export default function Gallery() {
  const { currentUser } = useAuth()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const [error, setError] = useState<string | null>(null)

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const {
    imageFile: uploadFile,
    imagePreview: previewUrl,
    error: uploadImageError,
    handleImageChange: handleFileChange,
    handleRemoveImage: resetUploadPreview,
  } = useImageUpload()

  useEffect(() => {
    loadImages()
  }, [])

  // ESC key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedImage) setSelectedImage(null)
        else if (showUploadModal) closeUploadModal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, showUploadModal])

  const loadImages = async () => {
    setError(null)
    try {
      const data = await getGalleryImages()
      setImages(data)
    } catch (err) {
      console.error('갤러리 로딩 실패:', err)
      setError('갤러리를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !currentUser) return

    setUploading(true)
    try {
      const newImage = await uploadGalleryImage(
        uploadFile,
        uploadTitle.trim(),
        uploadDescription.trim(),
        currentUser.uid,
        currentUser.nickname || currentUser.displayName
      )
      setImages((prev) => [newImage, ...prev])
      resetUploadForm()
      setShowUploadModal(false)
    } catch (err) {
      console.error('업로드 실패:', err)
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (image: GalleryImage) => {
    if (!currentUser) return
    if (currentUser.uid !== image.uploadedBy && !currentUser.isAdmin) {
      alert('삭제 권한이 없습니다.')
      return
    }

    if (!window.confirm('이 사진을 삭제하시겠습니까?')) return

    try {
      await deleteGalleryImage(image.id, image.imageURL)
      setImages((prev) => prev.filter((img) => img.id !== image.id))
      setSelectedImage(null)
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const resetUploadForm = useCallback(() => {
    resetUploadPreview()
    setUploadTitle('')
    setUploadDescription('')
  }, [resetUploadPreview])

  const closeUploadModal = useCallback(() => {
    resetUploadForm()
    setShowUploadModal(false)
  }, [resetUploadForm])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center', bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            갤러리
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            동아리 활동 사진을 공유하세요
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          {/* Upload Button */}
          {currentUser && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={() => setShowUploadModal(true)}
              >
                사진 업로드
              </Button>
            </Box>
          )}

          {/* Error State */}
          {error && <ErrorMessage message={error} onRetry={loadImages} />}

          {/* Gallery Grid */}
          {!error && images.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                아직 등록된 사진이 없습니다
              </Typography>
              {currentUser && (
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  첫 번째 사진을 업로드해보세요!
                </Typography>
              )}
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {images.map((image) => (
                <Box
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    bgcolor: 'grey.100',
                    boxShadow: 1,
                    transition: 'box-shadow 0.3s',
                    '&:hover': {
                      boxShadow: 6,
                    },
                    '&:hover img': {
                      transform: 'scale(1.05)',
                    },
                    '&:hover .overlay': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={image.imageURL}
                    alt={image.title}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s',
                    }}
                  />
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                      opacity: 0,
                      transition: 'opacity 0.3s',
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Box sx={{ p: 1.5, width: '100%' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {image.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {image.uploadedByName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onClose={closeUploadModal} maxWidth="sm" fullWidth>
        <DialogTitle>사진 업로드</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* File Input */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                사진 선택
              </Typography>
              {uploadImageError && (
                <Typography variant="body2" sx={{ color: 'error.main', mb: 1 }} role="alert">
                  {uploadImageError}
                </Typography>
              )}
              {previewUrl ? (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={previewUrl}
                    alt="업로드 미리보기"
                    sx={{
                      width: '100%',
                      height: 192,
                      objectFit: 'cover',
                      borderRadius: 2,
                    }}
                  />
                  <IconButton
                    onClick={resetUploadPreview}
                    aria-label="선택한 이미지 제거"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 192,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ImageIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    클릭하여 사진 선택
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    hidden
                  />
                </Box>
              )}
            </Box>

            {/* Title */}
            <TextField
              label="제목"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="사진 제목을 입력하세요"
              fullWidth
              inputProps={{ maxLength: 50 }}
            />

            {/* Description */}
            <TextField
              label="설명 (선택)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="사진에 대한 설명을 입력하세요"
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadModal} disabled={uploading}>
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!uploadFile || !uploadTitle.trim() || uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox Modal */}
      {selectedImage && (
        <Box
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'rgba(0,0,0,0.9)',
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ position: 'relative', maxWidth: 900, width: '100%' }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setSelectedImage(null)}
              aria-label="이미지 뷰어 닫기"
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: -48 },
                right: { xs: 8, sm: 0 },
                color: 'rgba(255,255,255,0.7)',
                bgcolor: { xs: 'rgba(0,0,0,0.5)', sm: 'transparent' },
                zIndex: 10,
                '&:hover': { color: 'white' },
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
            </IconButton>

            {/* Image */}
            <Box
              component="img"
              src={selectedImage.imageURL}
              alt={selectedImage.title}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 2,
              }}
            />

            {/* Info */}
            <Box sx={{ mt: 2, color: 'white' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedImage.title}
                  </Typography>
                  {selectedImage.description && (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}
                    >
                      {selectedImage.description}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}
                  >
                    {selectedImage.uploadedByName} ·{' '}
                    {selectedImage.createdAt.toLocaleDateString('ko-KR')}
                  </Typography>
                </Box>

                {/* Delete Button */}
                {currentUser &&
                  (currentUser.uid === selectedImage.uploadedBy || currentUser.isAdmin) && (
                    <IconButton
                      onClick={() => handleDelete(selectedImage)}
                      title="삭제"
                      sx={{
                        color: 'error.light',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'rgba(244,67,54,0.15)',
                        },
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
