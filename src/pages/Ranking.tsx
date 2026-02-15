import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { User, TIER_INFO, TIER_THRESHOLDS, TierType } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SendMessageModal from '../components/common/SendMessageModal'
import { useAuth } from '../contexts/AuthContext'
import { getNextTier } from '../utils/helpers'

export default function Ranking() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(q)
      const usersData = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as User
        })
        .filter((user) => !user.isTestAccount)
        .slice(0, 50)
      setUsers(usersData)
    } catch (error) {
      console.error('랭킹 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const currentUserRank = currentUser
    ? users.findIndex((u) => u.uid === currentUser.uid) + 1
    : 0

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">랭킹</h1>
          <p className="page-desc">동아리원들의 활동 랭킹을 확인하세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Current User Card */}
          {currentUser && (
            <div className="card p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={currentUser.photoURL || '/default-avatar.png'}
                    alt={currentUser.displayName}
                    className="avatar avatar-lg"
                    style={{ borderColor: TIER_INFO[currentUser.tier].color }}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: TIER_INFO[currentUser.tier].color }}
                  >
                    {TIER_INFO[currentUser.tier].emoji}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">
                      {currentUser.nickname || currentUser.displayName}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${TIER_INFO[currentUser.tier].color}20`,
                        color: TIER_INFO[currentUser.tier].color,
                      }}
                    >
                      {TIER_INFO[currentUser.tier].emoji} {TIER_INFO[currentUser.tier].name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-blue-600">{currentUser.points}P</span>
                    {(() => {
                      const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
                      if (nextTierInfo) {
                        return (
                          <span className="text-xs text-gray-500">
                            {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>

                <div className="text-center px-4 shrink-0">
                  <p className="text-xs text-gray-500 mb-1">내 순위</p>
                  <p className="text-2xl font-bold text-blue-600">
                    #{currentUserRank || '-'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
                if (!nextTierInfo) return null

                const currentMin = TIER_THRESHOLDS[currentUser.tier].min
                const nextMin = TIER_THRESHOLDS[nextTierInfo.tier].min
                const progress = ((currentUser.points - currentMin) / (nextMin - currentMin)) * 100

                return (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <span>{TIER_INFO[currentUser.tier].emoji}</span>
                        <span>{TIER_INFO[currentUser.tier].name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>{TIER_INFO[nextTierInfo.tier].emoji}</span>
                        <span>{TIER_INFO[nextTierInfo.tier].name}</span>
                      </span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tier Legend */}
          <div className="card p-6 mb-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">티어 기준</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as TierType[]).map((tier) => (
                <div
                  key={tier}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-base">{TIER_INFO[tier].emoji}</span>
                  <span className="text-sm font-medium" style={{ color: TIER_INFO[tier].color }}>
                    {TIER_THRESHOLDS[tier].min}P+
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking List */}
          <div className="card overflow-hidden">
            {/* Header */}
            <div
              className="grid grid-cols-[3rem_1fr_auto_6rem] gap-4 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200"
              style={{ padding: '1.25rem 1.5rem' }}
            >
              <span className="text-center">#</span>
              <span>유저</span>
              <span className="text-center">티어</span>
              <span className="text-right">포인트</span>
            </div>

            {users.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-500">아직 랭킹 데이터가 없습니다</p>
              </div>
            ) : (
              <div>
                {users.map((user, index) => (
                  <RankingRow
                    key={user.uid}
                    user={user}
                    rank={index + 1}
                    isCurrentUser={currentUser?.uid === user.uid}
                    canMessage={!!currentUser && currentUser.uid !== user.uid}
                    onMessage={() => setMessageTarget(user)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </div>
  )
}

function RankingRow({
  user,
  rank,
  isCurrentUser,
  canMessage,
  onMessage,
}: {
  user: User
  rank: number
  isCurrentUser: boolean
  canMessage: boolean
  onMessage: () => void
}) {
  const getRankDisplay = () => {
    if (rank === 1) return { emoji: '🥇', className: 'text-yellow-400 font-bold text-lg' }
    if (rank === 2) return { emoji: '🥈', className: 'text-gray-300 font-bold' }
    if (rank === 3) return { emoji: '🥉', className: 'text-amber-600 font-bold' }
    return { emoji: String(rank), className: 'text-gray-500' }
  }

  const rankDisplay = getRankDisplay()
  const displayName = user.nickname || user.displayName
  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze

  return (
    <div
      className={`grid grid-cols-[3rem_1fr_auto_6rem] gap-4 items-center border-b border-gray-200 transition-colors ${
        isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      style={{ padding: '1.25rem 1.5rem' }}
    >
      <span className={`text-center ${rankDisplay.className}`}>
        {rankDisplay.emoji}
      </span>

      <div className="flex items-center gap-3 min-w-0">
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={displayName}
          className="avatar avatar-sm"
          style={{ borderColor: tierInfo.color }}
        />
        <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
          {displayName}
          {isCurrentUser && <span className="ml-1.5 text-xs text-teal-500">(나)</span>}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm">{tierInfo.emoji}</span>
        <span className="text-xs font-medium" style={{ color: tierInfo.color }}>
          {tierInfo.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-600">{user.points}P</span>
        {canMessage && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMessage()
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
            title="쪽지 보내기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
