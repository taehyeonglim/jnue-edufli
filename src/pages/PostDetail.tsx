import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Alert from '@mui/material/Alert'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { useAuth } from '../contexts/AuthContext'
import { getPost, toggleLike, addComment, deletePost, deleteComment } from '../services/postService'
import { getUserById } from '../services/messageService'
import { Post, Comment, User, POINT_VALUES, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TierBadge from '../components/common/TierBadge'
import SendMessageModal from '../components/common/SendMessageModal'
import { getCategoryRoute } from '../utils/helpers'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentUser, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    if (!id) return
    try {
      const data = await getPost(id)
      setPost(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser || !post) return
    try {
      const { liked } = await toggleLike(post.id)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          likes: liked
            ? Array.from(new Set([...(prev.likes || []), currentUser.uid]))
            : (prev.likes || []).filter((uid) => uid !== currentUser.uid),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('좋아요 실패:', error)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !post || !commentText.trim() || submitting) return

    setSubmitting(true)
    try {
      const newComment = await addComment(post.id, commentText.trim())
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        }
      })
      setCommentText('')
      await refreshUser()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await deletePost(post.id)
      await refreshUser()
      navigate(-1)
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  const handleDeleteComment = async (comment: Comment) => {
    if (!post || !window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(post.id, comment.id)
      setPost((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.filter((c) => c.id !== comment.id),
        }
      })
      await refreshUser()
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
    }
  }

  const handleSendMessage = async (userId: string) => {
    try {
      const user = await getUserById(userId)
      if (user) {
        setMessageTarget(user)
      }
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    }
  }


  if (loading) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <Container maxWidth='md' sx={{ py: 4, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 8, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant='h4' sx={{ mb: 2 }}>😢</Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>게시글을 찾을 수 없습니다</Typography>
          <Button variant='outlined' onClick={() => navigate(-1)}>돌아가기</Button>
        </Paper>
      </Container>
    )
  }

  const categoryInfo = getCategoryRoute(post.category)
  const isAuthor = currentUser?.uid === post.authorId
  const isAdmin = currentUser?.isAdmin
  const likes = post.likes || []
  const isLiked = currentUser && likes.includes(currentUser.uid)
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Container maxWidth='md' sx={{ py: 4, pb: 8 }}>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<ChevronRightIcon sx={{ fontSize: 16 }} />}
        sx={{ mb: 3 }}
      >
        <Link component={RouterLink} to='/' underline='hover' color='text.secondary' sx={{ fontSize: 14 }}>
          홈
        </Link>
        <Link component={RouterLink} to={categoryInfo.link} underline='hover' color='text.secondary' sx={{ fontSize: 14 }}>
          {categoryInfo.icon} {categoryInfo.label}
        </Link>
      </Breadcrumbs>

      {/* Post Content */}
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 2, sm: 4 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
        {/* Author Info */}
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2} sx={{ mb: 3 }}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar
              src={post.authorPhotoURL || '/default-avatar.svg'}
              alt={post.authorName}
              sx={{
                width: 48,
                height: 48,
                border: `2px solid ${tierInfo.color}`,
              }}
            />
            <Box>
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.25 }}>
                <Typography variant='subtitle2' color='text.primary'>{post.authorName}</Typography>
                <TierBadge tier={post.authorTier} size='sm' />
              </Stack>
              <Typography variant='caption' color='text.secondary'>
                {post.createdAt.toLocaleString('ko-KR')}
              </Typography>
            </Box>
          </Stack>

          {(isAuthor || isAdmin) && (
            <Stack direction='row' spacing={1}>
              {isAuthor && (
                <Button
                  component={RouterLink}
                  to={`/edit/${post.id}`}
                  size='small'
                  startIcon={<EditIcon />}
                  color='inherit'
                  sx={{ color: 'text.secondary', fontSize: 13 }}
                >
                  수정
                </Button>
              )}
              <Button
                size='small'
                startIcon={<DeleteOutlineIcon />}
                color='error'
                onClick={handleDeletePost}
                sx={{ fontSize: 13 }}
              >
                삭제
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Title & Content */}
        <Typography variant='h5' color='primary' sx={{ fontWeight: 700, mb: 2 }}>
          {post.title}
        </Typography>
        <Typography
          variant='body1'
          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'text.primary', mb: 2 }}
        >
          {post.content}
        </Typography>

        {/* Post Image */}
        {post.imageURL && (
          <Box sx={{ mt: 2 }}>
            <Box
              component='img'
              src={post.imageURL}
              alt={`${post.title} 첨부 이미지`}
              loading='lazy'
              onClick={() => window.open(post.imageURL, '_blank')}
              sx={{
                width: '100%',
                maxHeight: 500,
                objectFit: 'contain',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'grey.50',
                cursor: 'pointer',
                '&:hover': { opacity: 0.9 },
              }}
            />
          </Box>
        )}

        {/* Actions */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        <Stack direction='row' spacing={2} alignItems='center'>
          <Button
            variant={isLiked ? 'contained' : 'outlined'}
            color={isLiked ? 'error' : 'inherit'}
            startIcon={isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            onClick={handleLike}
            disabled={!currentUser || isAuthor}
            size='small'
            sx={{ borderRadius: 5, textTransform: 'none' }}
          >
            {likes.length}
          </Button>
          <Typography variant='body2' color='text.secondary'>
            댓글 {post.comments.length}개
          </Typography>
          {currentUser && !isAuthor && (
            <Button
              variant='outlined'
              color='inherit'
              size='small'
              startIcon={<MailOutlineIcon />}
              onClick={() => handleSendMessage(post.authorId)}
              sx={{ ml: 'auto !important', borderRadius: 2, textTransform: 'none', borderColor: 'divider' }}
            >
              쪽지
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Comments Section */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant='h6' color='primary' sx={{ fontWeight: 700 }}>
            댓글 <Typography component='span' variant='body2' color='text.secondary'>({post.comments.length})</Typography>
          </Typography>
        </Box>
        <Box sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
          {/* Comment Form */}
          {currentUser ? (
            <Box component='form' onSubmit={handleComment} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`댓글을 작성하세요 (+${POINT_VALUES.COMMENT}P)`}
                inputProps={{ maxLength: 500 }}
                size='small'
              />
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mt: 1.5 }}>
                <Typography variant='caption' color='text.secondary'>{commentText.length}/500</Typography>
                <Button
                  type='submit'
                  variant='contained'
                  size='small'
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Alert severity='info' sx={{ mb: 3 }}>
              댓글을 작성하려면 로그인하세요
            </Alert>
          )}

          {/* Comments List */}
          {post.comments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='body2' color='text.secondary'>아직 댓글이 없습니다</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {post.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canDelete={currentUser?.uid === comment.authorId || isAdmin}
                  onDelete={() => handleDeleteComment(comment)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </Container>
  )
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment
  canDelete?: boolean
  onDelete: () => void
}) {
  const createdAt = comment.createdAt instanceof Date
    ? comment.createdAt
    : new Date(comment.createdAt)

  const tierInfo = TIER_INFO[comment.authorTier] || TIER_INFO.bronze

  return (
    <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
      <Stack direction='row' spacing={1.5}>
        <Avatar
          src={comment.authorPhotoURL || '/default-avatar.svg'}
          alt={comment.authorName}
          sx={{
            width: 36,
            height: 36,
            border: `2px solid ${tierInfo.color}`,
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' sx={{ mb: 0.5 }}>
            <Typography variant='body2' fontWeight={500}>{comment.authorName}</Typography>
            <Typography variant='caption' sx={{ color: tierInfo.color }}>
              {tierInfo.emoji}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {createdAt.toLocaleString('ko-KR')}
            </Typography>
            {canDelete && (
              <IconButton
                size='small'
                color='error'
                onClick={onDelete}
                sx={{ ml: 'auto !important', p: 0.5 }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Stack>
          <Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {comment.content}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
