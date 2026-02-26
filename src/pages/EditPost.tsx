import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Breadcrumbs,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import { useAuth } from '../contexts/AuthContext'
import { getPost, updatePost, uploadPostImage } from '../services/postService'
import { Post } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getCategoryRoute } from '../utils/helpers'

export default function EditPost() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    if (!id) return
    try {
      const data = await getPost(id)
      if (data) {
        setPost(data)
        setTitle(data.title)
        setContent(data.content)
        if (data.imageURL) {
          setImagePreview(data.imageURL)
        }
      }
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.')
      return false
    }
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return false
    }
    setImageFile(file)
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
    setError('')
    return true
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
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
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setRemoveImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !post) return

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
      let newImageURL: string | null | undefined = undefined

      if (imageFile) {
        newImageURL = await uploadPostImage(imageFile, currentUser.uid)
      } else if (removeImage) {
        newImageURL = null
      }

      await updatePost(post.id, title.trim(), content.trim(), newImageURL)
      navigate(`/post/${post.id}`)
    } catch (err) {
      console.error('수정 실패:', err)
      setError('수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <Box sx={{ py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>😢</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              게시글을 찾을 수 없습니다
            </Typography>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              돌아가기
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  if (!currentUser || currentUser.uid !== post.authorId) {
    return (
      <Box sx={{ py: 6 }}>
        <Container maxWidth="sm">
          <Paper sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              수정 권한이 없습니다
            </Typography>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              돌아가기
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  const categoryInfo = getCategoryRoute(post.category)

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="sm">
        {/* Breadcrumb */}
        <Breadcrumbs
          separator={<ChevronRightIcon sx={{ fontSize: 18 }} />}
          sx={{ mb: 3, fontSize: '0.875rem' }}
        >
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            홈
          </Typography>
          <Typography
            component={RouterLink}
            to={categoryInfo.link}
            sx={{
              color: 'text.secondary',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { color: 'primary.main' },
              transition: 'color 0.2s',
            }}
          >
            <Box component="span">{categoryInfo.icon}</Box>
            <Box component="span">{categoryInfo.label}</Box>
          </Typography>
          <Typography sx={{ color: 'text.primary' }}>수정</Typography>
        </Breadcrumbs>

        <Paper sx={{ overflow: 'hidden' }}>
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: '1.5rem' }}>✏️</Typography>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
              글 수정
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Title */}
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  component="label"
                  htmlFor="title"
                  sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}
                >
                  제목
                </Typography>
                <TextField
                  id="title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  inputProps={{ maxLength: 100 }}
                  size="small"
                />
              </Box>

              {/* Content */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  component="label"
                  htmlFor="content"
                  sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, mb: 1 }}
                >
                  내용
                </Typography>
                <TextField
                  id="content"
                  fullWidth
                  multiline
                  minRows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  inputProps={{ maxLength: 5000 }}
                  size="small"
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                    Ctrl+V로 이미지 붙여넣기 가능
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {content.length} / 5000
                  </Typography>
                </Stack>
              </Box>
              {/* Image Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 1 }}>
                  이미지 첨부{' '}
                  <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
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
                        bgcolor: 'rgba(211, 47, 47, 0.8)',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.main' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      border: 2,
                      borderStyle: 'dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                  >
                    <AddPhotoAlternateIcon
                      sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }}
                    />
                    <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 0.5 }}>
                      클릭하여 이미지 업로드
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                      PNG, JPG, GIF (최대 5MB)
                    </Typography>
                  </Box>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(-1)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? '수정 중...' : '수정하기'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
