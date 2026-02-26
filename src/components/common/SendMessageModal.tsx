import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import { useAuth } from '../../contexts/AuthContext'
import { sendMessage } from '../../services/messageService'
import { User, TIER_INFO } from '../../types'

interface SendMessageModalProps {
  receiver: User
  onClose: () => void
  onSuccess?: () => void
}

export default function SendMessageModal({
  receiver,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const { currentUser } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const tierInfo = TIER_INFO[receiver.tier] || TIER_INFO.bronze

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
      await sendMessage(
        currentUser,
        receiver.uid,
        receiver.nickname || receiver.displayName,
        title.trim(),
        content.trim()
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('쪽지 전송 실패:', err)
      setError('쪽지 전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>💌</span>
        <Typography variant="h6" component="span" sx={{ color: 'primary.main' }}>
          쪽지 보내기
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Receiver Info */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>받는 사람:</Typography>
            <Avatar
              src={receiver.photoURL || undefined}
              alt={receiver.nickname || receiver.displayName}
              sx={{ width: 32, height: 32, borderColor: tierInfo.color }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {receiver.nickname || receiver.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: tierInfo.color }}>
              {tierInfo.emoji}
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              label="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <Box>
              <TextField
                label="내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                fullWidth
                multiline
                rows={6}
                inputProps={{ maxLength: 1000 }}
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: 'text.disabled' }}>
                {content.length} / 1000
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>
            취소
          </Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ flex: 1 }}>
            {submitting ? '전송 중...' : '보내기'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
