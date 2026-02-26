import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import { useAuth } from '../contexts/AuthContext'
import { POINT_VALUES } from '../types'
import { useBoardPosts } from '../hooks/useBoardPosts'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PostItem from '../components/common/PostItem'

export default function Introduction() {
  const { currentUser } = useAuth()
  const { posts, loading, error, reload } = useBoardPosts('introduction', 50)

  const hasIntroduction = posts.some((post) => post.authorId === currentUser?.uid)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800 }}>자기소개</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>동아리원들을 만나보세요</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        {/* Action Bar */}
        {currentUser && !hasIntroduction && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button
              component={Link}
              to="/write?category=introduction"
              variant="contained"
              startIcon={<AddIcon />}
            >
              자기소개 작성하기
              <Chip label={`+${POINT_VALUES.INTRODUCTION}P`} size="small" color="warning" sx={{ ml: 1 }} />
            </Button>
          </Box>
        )}

        {/* Content */}
        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : posts.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>👋</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              아직 자기소개가 없습니다
            </Typography>
            {currentUser && (
              <Button component={Link} to="/write?category=introduction" variant="contained">
                첫 자기소개 작성하기
              </Button>
            )}
          </Paper>
        ) : (
          <Paper variant="outlined">
            {posts.map((post, index) => (
              <PostItem key={post.id} post={post} isLast={index === posts.length - 1} />
            ))}
          </Paper>
        )}
      </Container>
    </Box>
  )
}
