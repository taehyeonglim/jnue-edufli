import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createPost, uploadPostImage } from '../services/postService'
import { POINT_VALUES, CategoryType, CATEGORY_INFO } from '../types'
import { useImageUpload } from '../hooks/useImageUpload'

const VALID_CATEGORIES: CategoryType[] = ['introduction', 'study', 'project', 'resources']

export default function WritePost() {
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawCategory = searchParams.get('category') || 'study'
  const category: CategoryType = VALID_CATEGORIES.includes(rawCategory as CategoryType)
    ? (rawCategory as CategoryType)
    : 'study'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const {
    imageFile,
    imagePreview,
    error: imageError,
    fileInputRef,
    handleImageChange,
    handlePaste,
    handleRemoveImage,
  } = useImageUpload()

  const CATEGORY_PLACEHOLDERS: Record<CategoryType, { titlePlaceholder: string; contentPlaceholder: string }> = {
    introduction: {
      titlePlaceholder: '자기소개 제목을 입력하세요',
      contentPlaceholder: '자신을 소개해주세요! 학과, 관심 분야, 하고 싶은 활동 등을 자유롭게 작성해보세요.',
    },
    study: {
      titlePlaceholder: '스터디/세미나 제목을 입력하세요',
      contentPlaceholder: '스터디 모집 또는 세미나 공지를 작성해주세요. 주제, 일정, 모집 인원 등을 포함해주세요.',
    },
    project: {
      titlePlaceholder: '프로젝트 제목을 입력하세요',
      contentPlaceholder: '프로젝트 소개 또는 팀원 모집 글을 작성해주세요. 프로젝트 목표, 기술 스택, 모집 역할 등을 포함해주세요.',
    },
    resources: {
      titlePlaceholder: '자료 제목을 입력하세요',
      contentPlaceholder: '공유할 교육 자료에 대한 설명을 작성해주세요. 자료 내용, 활용 방법 등을 포함해주세요.',
    },
  }

  const CATEGORY_LINKS: Record<CategoryType, string> = {
    introduction: '/introduction',
    study: '/study',
    project: '/project',
    resources: '/resources',
  }

  const info = CATEGORY_INFO[category]
  const placeholders = CATEGORY_PLACEHOLDERS[category]
  const categoryLink = CATEGORY_LINKS[category]
  const categoryPoints = category === 'introduction' ? POINT_VALUES.INTRODUCTION
    : category === 'resources' ? POINT_VALUES.RESOURCE_UPLOAD
    : POINT_VALUES.POST

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let imageURL: string | undefined

      if (imageFile) {
        imageURL = await uploadPostImage(imageFile, currentUser.uid)
      }

      const postId = await createPost(title.trim(), content.trim(), category, imageURL)
      await refreshUser()
      navigate(`/post/${postId}`)
    } catch (err) {
      console.error('글 작성 실패:', err)
      setError('글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="section">
        <div className="container-xs">
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-slate-500 mb-6">로그인이 필요합니다</p>
            <Link to="/" className="btn btn-primary">
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="container-sm">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">홈</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={categoryLink} className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <span>{info.icon}</span>
            <span>{info.name}</span>
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>글쓰기</span>
        </nav>

        <div className="card">
          {/* Header */}
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{info.icon}</span>
              <h1 className="heading-3 text-blue-600">{info.name}</h1>
            </div>
            <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-bold rounded-full shadow-lg shadow-primary-500/30">
              ✨ +{categoryPoints}P
            </span>
          </div>

          <div className="card-body">
            {(error || imageError) && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 flex items-center gap-2" role="alert">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error || imageError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={placeholders.titlePlaceholder}
                  className="input"
                  maxLength={100}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-slate-900 mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={placeholders.contentPlaceholder}
                  className="input textarea h-64"
                  maxLength={5000}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-400">Ctrl+V로 이미지 붙여넣기 가능</span>
                  <span className="text-xs text-slate-500">{content.length} / 5000</span>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  이미지 첨부 <span className="text-slate-500 font-normal">(선택)</span>
                </label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      className="w-full max-h-80 object-contain rounded border border-slate-200 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-300"
                  >
                    <svg className="w-10 h-10 mx-auto mb-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500 mb-1">클릭하여 이미지 업로드</p>
                    <p className="text-xs text-slate-400">PNG, JPG, GIF (최대 5MB)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn btn-primary"
                >
                  {submitting ? '작성 중...' : '작성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
