import { useState } from 'react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg border border-gray-200 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">💌</span>
            <h2 className="text-lg font-semibold text-blue-600">쪽지 보내기</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Receiver Info */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <span className="text-sm text-gray-500">받는 사람:</span>
            <img
              src={receiver.photoURL || '/default-avatar.png'}
              alt={receiver.nickname || receiver.displayName}
              className="avatar avatar-sm"
              style={{ borderColor: tierInfo.color }}
            />
            <span className="font-medium text-gray-900">
              {receiver.nickname || receiver.displayName}
            </span>
            <span className="text-sm" style={{ color: tierInfo.color }}>
              {tierInfo.emoji}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="input"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="input textarea h-40"
              maxLength={1000}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">{content.length} / 1000</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn btn-primary"
            >
              {submitting ? '전송 중...' : '보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
