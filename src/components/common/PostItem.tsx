import { memo } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import CardActionArea from '@mui/material/CardActionArea'
import ImageIcon from '@mui/icons-material/Image'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { Post, TIER_INFO } from '../../types'

interface PostItemProps {
  post: Post
  isLast: boolean
}

const PostItem = memo(function PostItem({ post, isLast }: PostItemProps) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <CardActionArea
      component={Link}
      to={`/post/${post.id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 2,
        borderBottom: isLast ? 'none' : 1,
        borderColor: 'divider',
        borderRadius: 0,
      }}
    >
      <Avatar
        src={post.authorPhotoURL || undefined}
        alt={`${post.authorName} 프로필`}
        sx={{ width: 44, height: 44, borderColor: tierInfo.color }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {post.title}
          </Typography>
          {post.imageURL && <ImageIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />}
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}
        >
          {post.content}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {post.authorName}
          </Typography>
          <Typography variant="caption" sx={{ color: tierInfo.color }}>
            {tierInfo.emoji}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {post.createdAt.toLocaleDateString('ko-KR')}
          </Typography>
        </Stack>
      </Box>
      {post.imageURL && (
        <Box
          component="img"
          src={post.imageURL}
          alt={`${post.title} 썸네일`}
          loading="lazy"
          sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0, border: 1, borderColor: 'divider' }}
        />
      )}
      <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
        <Chip
          icon={<FavoriteIcon sx={{ fontSize: 14 }} />}
          label={post.likes.length}
          size="small"
          sx={{ bgcolor: 'error.50', color: 'error.main', fontSize: '0.75rem', '& .MuiChip-icon': { color: 'error.light' } }}
        />
        <Chip
          icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />}
          label={post.comments.length}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </Stack>
    </CardActionArea>
  )
})

export default PostItem
