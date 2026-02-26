import { useState } from 'react'
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ textAlign: 'center', py: 8, px: 3 }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>로그인이 필요합니다</Typography>
          <Button component={RouterLink} to="/" variant="contained">
            홈으로 가기
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<ChevronRightIcon sx={{ fontSize: 16 }} />}
        sx={{ mb: 3, fontSize: '0.875rem' }}
      >
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="text.secondary"
          sx={{ '&:hover': { color: 'primary.main' } }}
        >
          홈
        </Link>
        <Link
          component={RouterLink}
          to={categoryLink}
          underline="hover"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            '&:hover': { color: 'primary.main' },
          }}
        >
          <span>{info.icon}</span>
          <span>{info.name}</span>
        </Link>
        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>글쓰기</Typography>
      </Breadcrumbs>

      <Paper sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontSize: '1.5rem' }}>{info.icon}</Typography>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {info.name}
            </Typography>
          </Stack>
          <Chip
            label={`✨ +${categoryPoints}P`}
            size="small"
            sx={{
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              px: 1,
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}
          />
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 3 }}>
          {(error || imageError) && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error || imageError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Title */}
            <Box sx={{ mb: 2.5 }}>
              <TextField
                id="title"
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={placeholders.titlePlaceholder}
                inputProps={{ maxLength: 100 }}
                fullWidth
              />
            </Box>

            {/* Content */}
            <Box sx={{ mb: 3 }}>
              <TextField
                id="content"
                label="내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder={placeholders.contentPlaceholder}
                inputProps={{ maxLength: 5000 }}
                multiline
                rows={10}
                fullWidth
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Ctrl+V로 이미지 붙여넣기 가능
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {content.length} / 5000
                </Typography>
              </Stack>
            </Box>

            {/* Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                이미지 첨부{' '}
                <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  (선택)
                </Typography>
              </Typography>

              {imagePreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="미리보기"
                    sx={{
                      width: '100%',
                      maxHeight: 320,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveImage}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(239,68,68,0.8)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'error.main' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ) : (
                <Paper
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    borderRadius: 3,
                    py: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'primary.light', mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    클릭하여 이미지 업로드
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    PNG, JPG, GIF (최대 5MB)
                  </Typography>
                </Paper>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </Box>

            {/* Buttons */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} fullWidth>
                취소
              </Button>
              <Button type="submit" variant="contained" disabled={submitting} fullWidth>
                {submitting ? '작성 중...' : '작성하기'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
