import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import UploadIcon from '@mui/icons-material/Upload'
import { useAuth } from '../contexts/AuthContext'
import { POINT_VALUES, CATEGORY_INFO } from '../types'
import { useBoardPosts } from '../hooks/useBoardPosts'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PostItem from '../components/common/PostItem'

export default function ResourcesBoard() {
  const { currentUser } = useAuth()
  const { posts, loading, error, reload } = useBoardPosts('resources', 50)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>{CATEGORY_INFO.resources.icon}</Typography>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>{CATEGORY_INFO.resources.name}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>{CATEGORY_INFO.resources.description}</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        {currentUser && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button component={Link} to="/write?category=resources" variant="contained" color="secondary" startIcon={<UploadIcon />}>
              자료 업로드
              <Chip label={`+${POINT_VALUES.RESOURCE_UPLOAD}P`} size="small" sx={{ ml: 1, color: '#fff', bgcolor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.5)' }} />
            </Button>
          </Box>
        )}

        {error ? (
          <ErrorMessage message={error} onRetry={reload} />
        ) : posts.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>{CATEGORY_INFO.resources.icon}</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>아직 등록된 자료가 없습니다</Typography>
            {currentUser && (
              <Button component={Link} to="/write?category=resources" variant="contained" color="secondary">첫 자료 업로드하기</Button>
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
