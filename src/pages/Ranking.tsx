import { useState, useEffect, memo } from 'react'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { User, TIER_INFO, TIER_THRESHOLDS, TierType } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import SendMessageModal from '../components/common/SendMessageModal'
import { useAuth } from '../contexts/AuthContext'
import { getNextTier } from '../utils/helpers'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import TierBadge from '../components/common/TierBadge'

export default function Ranking() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messageTarget, setMessageTarget] = useState<User | null>(null)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    setError(null)
    try {
      const q = query(
        collection(db, 'users'),
        where('isTestAccount', '!=', true),
        orderBy('points', 'desc'),
        limit(50)
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
      setUsers(usersData)
    } catch {
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
        setError('랭킹을 불러오는 데 실패했습니다.')
      }
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
    <Box>
      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800 }}>랭킹</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>동아리원들의 활동 랭킹을 확인하세요</Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        {/* Current User Card */}
        {currentUser && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={currentUser.photoURL || undefined}
                  alt={currentUser.displayName}
                  sx={{ width: 60, height: 60, borderColor: TIER_INFO[currentUser.tier].color }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    bgcolor: TIER_INFO[currentUser.tier].color,
                  }}
                >
                  {TIER_INFO[currentUser.tier].emoji}
                </Box>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {currentUser.nickname || currentUser.displayName}
                  </Typography>
                  <TierBadge tier={currentUser.tier} showName />
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {currentUser.points}P
                  </Typography>
                  {(() => {
                    const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
                    if (nextTierInfo) {
                      return (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                        </Typography>
                      )
                    }
                    return null
                  })()}
                </Stack>
              </Box>

              <Box sx={{ textAlign: 'center', px: 2, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>내 순위</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  #{currentUserRank || '-'}
                </Typography>
              </Box>
            </Stack>

            {/* Progress Bar */}
            {(() => {
              const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
              if (!nextTierInfo) return null

              const currentMin = TIER_THRESHOLDS[currentUser.tier].min
              const nextMin = TIER_THRESHOLDS[nextTierInfo.tier].min
              const progress = ((currentUser.points - currentMin) / (nextMin - currentMin)) * 100

              return (
                <Box sx={{ mt: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {TIER_INFO[currentUser.tier].emoji} {TIER_INFO[currentUser.tier].name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {TIER_INFO[nextTierInfo.tier].emoji} {TIER_INFO[nextTierInfo.tier].name}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(progress, 100)}
                    sx={{
                      bgcolor: `${TIER_INFO[currentUser.tier].color}20`,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: TIER_INFO[currentUser.tier].color,
                      },
                    }}
                  />
                </Box>
              )
            })()}
          </Paper>
        )}

        {/* Tier Legend */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, mb: 2, display: 'block' }}>
            티어 기준
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }, gap: 1.5 }}>
            {(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as TierType[]).map((tier) => (
              <Paper
                key={tier}
                variant="outlined"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1.5 }}
              >
                <Typography sx={{ fontSize: '1rem' }}>{TIER_INFO[tier].emoji}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: TIER_INFO[tier].color }}>
                  {TIER_THRESHOLDS[tier].min}P+
                </Typography>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Error State */}
        {error && <ErrorMessage message={error} onRetry={loadRanking} />}

        {/* Ranking List */}
        {!error && (
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            {/* Header */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'grid' },
                gridTemplateColumns: '3rem 1fr auto 6rem',
                gap: 2,
                px: 3,
                py: 2,
                bgcolor: 'action.hover',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>#</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>유저</Typography>
              <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>티어</Typography>
              <Typography variant="caption" sx={{ textAlign: 'right', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>포인트</Typography>
            </Box>

            {users.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>🏆</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>아직 랭킹 데이터가 없습니다</Typography>
              </Box>
            ) : (
              <Box>
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
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Send Message Modal */}
      {messageTarget && (
        <SendMessageModal
          receiver={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSuccess={() => alert('쪽지를 보냈습니다!')}
        />
      )}
    </Box>
  )
}

const RankingRow = memo(function RankingRow({
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
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return String(rank)
  }

  const displayName = user.nickname || user.displayName
  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: rank === 1
          ? 'rgba(253, 224, 71, 0.08)'
          : rank === 2
          ? 'rgba(148, 163, 184, 0.06)'
          : rank === 3
          ? 'rgba(251, 146, 60, 0.06)'
          : isCurrentUser
          ? 'primary.50'
          : 'transparent',
        borderLeft: rank <= 3 || isCurrentUser ? 4 : 0,
        borderLeftColor: rank === 1
          ? 'warning.main'
          : rank === 2
          ? 'grey.400'
          : rank === 3
          ? 'warning.dark'
          : isCurrentUser
          ? 'primary.main'
          : 'transparent',
        '&:hover': { bgcolor: isCurrentUser ? 'primary.50' : 'action.hover' },
        transition: 'background-color 0.2s',
      }}
    >
      <Typography
        sx={{
          width: 32,
          textAlign: 'center',
          flexShrink: 0,
          fontWeight: rank <= 3 ? 700 : 400,
          fontSize: rank <= 3 ? '1.125rem' : '0.875rem',
          color: rank <= 3 ? tierInfo.color : 'text.secondary',
        }}
      >
        {getRankDisplay()}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Avatar
          src={user.photoURL || undefined}
          alt={displayName}
          sx={{ width: 36, height: 36, borderColor: tierInfo.color }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: isCurrentUser ? 'primary.main' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
            {isCurrentUser && <Typography component="span" variant="caption" sx={{ color: 'secondary.main', ml: 0.75 }}>(나)</Typography>}
          </Typography>
          <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: tierInfo.color, fontWeight: 500 }}>
            {tierInfo.emoji} {tierInfo.name}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <TierBadge tier={user.tier} showName />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontSize: rank <= 3 ? '1rem' : '0.875rem',
            color: rank <= 3 ? tierInfo.color : 'primary.main',
          }}
        >
          {user.points}P
        </Typography>
        {canMessage && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              onMessage()
            }}
            title="쪽지 보내기"
            aria-label={`${displayName}에게 쪽지 보내기`}
            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
          >
            <MailOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Box>
  )
})
