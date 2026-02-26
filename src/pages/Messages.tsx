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
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">쪽지함</h1>
          <p className="page-desc">회원들과 1:1 메시지를 주고받으세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Tabs */}
          <div className="tabs mb-6">
            <button
              onClick={() => {
                setActiveTab('received')
                setSelectedMessage(null)
              }}
              className={`tab ${activeTab === 'received' ? 'tab-active' : ''}`}
            >
              📥 받은 쪽지
              {messages.filter((m) => !m.isRead && activeTab === 'received').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {messages.filter((m) => !m.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('sent')
                setSelectedMessage(null)
              }}
              className={`tab ${activeTab === 'sent' ? 'tab-active' : ''}`}
            >
              📤 보낸 쪽지
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Message List */}
            <div className="card">
              <div className="card-header">
                <h2 className="heading-3 text-primary-600">
                  {activeTab === 'received' ? '받은 쪽지' : '보낸 쪽지'}
                </h2>
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="p-8">
                    <LoadingSpinner />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">
                      {activeTab === 'received' ? '📭' : '📤'}
                    </div>
                    <p className="text-slate-500">
                      {activeTab === 'received'
                        ? '받은 쪽지가 없습니다'
                        : '보낸 쪽지가 없습니다'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
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
                  </div>
                )}
              </div>
            </div>

            {/* Message Detail */}
            <div className="card">
              <div className="card-header">
                <h2 className="heading-3 text-primary-600">쪽지 내용</h2>
              </div>
              <div className="card-body">
                {selectedMessage ? (
                  <MessageDetail
                    message={selectedMessage}
                    type={activeTab}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💌</div>
                    <p className="text-slate-500">쪽지를 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    <div
      onClick={onClick}
      className={`p-5 border-b border-slate-200 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary-50'
          : isUnread
          ? 'bg-accent-50 hover:bg-accent-100'
          : 'hover:bg-slate-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={message.senderPhotoURL || '/default-avatar.svg'}
          alt={message.senderName}
          className="avatar avatar-sm shrink-0"
          style={{ borderColor: tierInfo.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isUnread && (
              <span className="w-2 h-2 bg-accent-500 rounded-full shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-900 truncate">
              {type === 'received' ? message.senderName : message.receiverName}
            </span>
            <span className="text-xs" style={{ color: tierInfo.color }}>
              {tierInfo.emoji}
            </span>
          </div>
          <p
            className={`text-sm truncate mb-1 ${
              isUnread ? 'text-slate-900 font-medium' : 'text-slate-500'
            }`}
          >
            {message.title}
          </p>
          <span className="text-xs text-slate-400">
            {message.createdAt.toLocaleString('ko-KR')}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-red-400/50 hover:text-red-400 transition-colors p-1"
          aria-label="쪽지 삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
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
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <img
          src={message.senderPhotoURL || '/default-avatar.svg'}
          alt={message.senderName}
          className="avatar avatar-md"
          style={{ borderColor: tierInfo.color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">
              {type === 'received' ? message.senderName : message.receiverName}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${tierInfo.color}20`,
                color: tierInfo.color,
              }}
            >
              {tierInfo.emoji} {tierInfo.name}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {message.createdAt.toLocaleString('ko-KR')}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-primary-600 mb-4">{message.title}</h3>

      {/* Content */}
      <div className="text-slate-900/90 whitespace-pre-wrap leading-relaxed min-h-[150px]">
        {message.content}
      </div>
    </div>
  )
}
