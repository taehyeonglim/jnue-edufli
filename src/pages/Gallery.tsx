import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { GalleryImage } from '../types'
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage } from '../services/galleryService'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Gallery() {
  const { currentUser } = useAuth()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    loadImages()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const loadImages = async () => {
    try {
      const data = await getGalleryImages()
      setImages(data)
    } catch (error) {
      console.error('갤러리 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.')
        return
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setUploadFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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
    } catch (error) {
      console.error('업로드 실패:', error)
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

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadTitle('')
    setUploadDescription('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const closeUploadModal = () => {
    resetUploadForm()
    setShowUploadModal(false)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">갤러리</h1>
          <p className="page-desc">동아리 활동 사진을 공유하세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {/* Upload Button */}
          {currentUser && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                사진 업로드
              </button>
            </div>
          )}

          {/* Gallery Grid */}
          {images.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-gray-500 mb-2">아직 등록된 사진이 없습니다</p>
              {currentUser && (
                <p className="text-sm text-gray-400">첫 번째 사진을 업로드해보세요!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.imageURL}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm truncate">{image.title}</p>
                      <p className="text-white/70 text-xs">{image.uploadedByName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200" style={{ padding: '1.5rem' }}>
              <h3 className="text-lg font-semibold text-gray-900">사진 업로드</h3>
              <button
                onClick={closeUploadModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5" style={{ padding: '1.5rem' }}>
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진 선택</label>
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={resetUploadForm}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">클릭하여 사진 선택</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="사진 제목을 입력하세요"
                  className="input"
                  maxLength={50}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명 (선택)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="사진에 대한 설명을 입력하세요"
                  className="input min-h-[80px] resize-none"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-200" style={{ padding: '1.5rem' }}>
              <button
                onClick={closeUploadModal}
                className="btn btn-secondary flex-1"
                disabled={uploading}
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                className="btn btn-primary flex-1"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={selectedImage.imageURL}
              alt={selectedImage.title}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* Info */}
            <div className="mt-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                  {selectedImage.description && (
                    <p className="text-white/70 mt-1">{selectedImage.description}</p>
                  )}
                  <p className="text-white/50 text-sm mt-2">
                    {selectedImage.uploadedByName} · {selectedImage.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* Delete Button */}
                {currentUser && (currentUser.uid === selectedImage.uploadedBy || currentUser.isAdmin) && (
                  <button
                    onClick={() => handleDelete(selectedImage)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
