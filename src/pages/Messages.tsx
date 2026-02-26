import { useState, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getReceivedMessages,
  getSentMessages,
  markAsRead,
  deleteMessage,
} from '../services/messageService'
import { Message, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

type TabType = 'received' | 'sent'

export default function Messages() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('received')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadMessages()
    }
  }, [currentUser, activeTab])

  const loadMessages = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const data =
        activeTab === 'received'
          ? await getReceivedMessages(currentUser.uid)
          : await getSentMessages(currentUser.uid)
      setMessages(data)
    } catch (error) {
      console.error('쪽지 로딩 실패:', error)
      alert('쪽지를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    if (activeTab === 'received' && !message.isRead) {
      try {
        await markAsRead(message.id)
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        )
      } catch (error) {
        console.error('읽음 처리 실패:', error)
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('쪽지를 삭제하시겠습니까?')) return
    try {
      await deleteMessage(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('삭제 실패:', error)
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead && activeTab === 'received').length

  if (!currentUser) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            로그인이 필요합니다
          </Typography>
          <Button
            component={Link}
            to="/"
            variant="contained"
          >
            홈으로 가기
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            쪽지함
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            회원들과 1:1 메시지를 주고받으세요
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab === 'received' ? 0 : 1}
            onChange={(_, newValue) => {
              setActiveTab(newValue === 0 ? 'received' : 'sent')
              setSelectedMessage(null)
            }}
          >
            <Tab
              label={
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                >
                  <Box sx={{ px: 1 }}>받은 쪽지</Box>
                </Badge>
              }
            />
            <Tab label="보낸 쪽지" />
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { lg: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Message List */}
          <Paper variant="outlined">
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {activeTab === 'received' ? '받은 쪽지' : '보낸 쪽지'}
              </Typography>
            </Box>
            <Box>
              {loading ? (
                <Box sx={{ p: 4 }}>
                  <LoadingSpinner />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 2 }}>
                    {activeTab === 'received' ? '📭' : '📤'}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {activeTab === 'received'
                      ? '받은 쪽지가 없습니다'
                      : '보낸 쪽지가 없습니다'}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {messages.map((message) => (
                    <MessageListItem
                      key={message.id}
                      message={message}
                      type={activeTab}
                      isSelected={selectedMessage?.id === message.id}
                      onClick={() => handleSelectMessage(message)}
                      onDelete={() => handleDeleteMessage(message.id)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Paper>

          {/* Message Detail */}
          <Paper variant="outlined">
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                쪽지 내용
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {selectedMessage ? (
                <MessageDetail
                  message={selectedMessage}
                  type={activeTab}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 2 }}>💌</Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    쪽지를 선택하세요
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

const MessageListItem = memo(function MessageListItem({
  message,
  type,
  isSelected,
  onClick,
  onDelete,
}: {
  message: Message
  type: TabType
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const tierInfo = TIER_INFO[message.senderTier] || TIER_INFO.bronze
  const isUnread = type === 'received' && !message.isRead

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        bgcolor: isSelected
          ? 'primary.50'
          : isUnread
            ? 'warning.50'
            : 'transparent',
        '&:hover': {
          bgcolor: isSelected
            ? 'primary.50'
            : isUnread
              ? 'warning.100'
              : 'action.hover',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar
          src={message.senderPhotoURL || '/default-avatar.svg'}
          alt={message.senderName}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            border: 2,
            borderColor: tierInfo.color,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {isUnread && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'warning.main',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {type === 'received' ? message.senderName : message.receiverName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: tierInfo.color }}
            >
              {tierInfo.emoji}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.5,
              color: isUnread ? 'text.primary' : 'text.secondary',
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {message.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {message.createdAt.toLocaleString('ko-KR')}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="쪽지 삭제"
          sx={{
            color: 'error.light',
            opacity: 0.5,
            '&:hover': { opacity: 1, color: 'error.main' },
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
})

function MessageDetail({
  message,
  type,
}: {
  message: Message
  type: TabType
}) {
  const tierInfo = TIER_INFO[message.senderTier] || TIER_INFO.bronze

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 2 }}>
        <Avatar
          src={message.senderPhotoURL || '/default-avatar.svg'}
          alt={message.senderName}
          sx={{
            width: 44,
            height: 44,
            border: 2,
            borderColor: tierInfo.color,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
              {type === 'received' ? message.senderName : message.receiverName}
            </Typography>
            <Chip
              label={`${tierInfo.emoji} ${tierInfo.name}`}
              size="small"
              sx={{
                bgcolor: `${tierInfo.color}20`,
                color: tierInfo.color,
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {message.createdAt.toLocaleString('ko-KR')}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Title */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
      >
        {message.title}
      </Typography>

      {/* Content */}
      <Typography
        sx={{
          color: 'text.primary',
          opacity: 0.9,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.8,
          minHeight: 150,
        }}
      >
        {message.content}
      </Typography>
    </Box>
  )
}
