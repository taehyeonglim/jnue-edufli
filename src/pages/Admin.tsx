import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth, calculateTier } from '../contexts/AuthContext'
import { User, Reward, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { Navigate } from 'react-router-dom'
import { adminAdjustPoints, adminSetRole, adminDeleteUser } from '../services/adminService'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

type TabKey = 'users' | 'rewards' | 'challenger'

const TAB_INFO: Record<TabKey, { label: string; icon: string; description: string }> = {
  users: { label: '회원 관리', icon: '👥', description: '포인트 조정 및 관리자 권한 관리' },
  challenger: { label: '챌린저 지정', icon: '👑', description: '특별 챌린저 티어 부여' },
  rewards: { label: '상품 지급', icon: '🎁', description: '이벤트 상품 지급 및 내역 관리' },
}

const TAB_KEYS: TabKey[] = ['users', 'challenger', 'rewards']

export default function Admin() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [users, setUsers] = useState<User[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setError(null)
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('points', 'desc'), limit(500))
      const usersSnap = await getDocs(usersQuery)
      const usersData = usersSnap.docs
        .map((doc) => {
          const data = doc.data()
          const points = data.points || 0
          const isChallenger = data.isChallenger || false
          return {
            uid: doc.id,
            ...data,
            points,
            tier: calculateTier(points, isChallenger),
            createdAt: data.createdAt?.toDate() || new Date(),
          }
        })
        .sort((a, b) => b.points - a.points) as User[]
      setUsers(usersData)

      const rewardsSnap = await getDocs(collection(db, 'rewards'))
      const rewardsData = rewardsSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          givenAt: doc.data().givenAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.givenAt.getTime() - a.givenAt.getTime()) as Reward[]
      setRewards(rewardsData)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
      setError('데이터를 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser?.isAdmin) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(TAB_KEYS[newValue])
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '1.875rem' }}>⚙️</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>관리자 페이지</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            회원 관리, 챌린저 지정, 상품 지급을 관리합니다
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          {error && <ErrorMessage message={error} onRetry={loadData} />}

          {/* Stats Overview */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
            <StatCard label="전체 회원" value={users.length} icon="👥" />
            <StatCard label="챌린저" value={users.filter(u => u.isChallenger).length} icon="👑" />
            <StatCard label="관리자" value={users.filter(u => u.isAdmin).length} icon="🛡️" />
            <StatCard label="상품 지급" value={rewards.length} icon="🎁" />
          </Box>

          {/* Tabs */}
          <Tabs
            value={TAB_KEYS.indexOf(activeTab)}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
          >
            {TAB_KEYS.map((key) => (
              <Tab
                key={key}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: '1.125rem' }}>{TAB_INFO[key].icon}</Typography>
                    <Typography sx={{ display: { xs: 'none', sm: 'inline' } }}>{TAB_INFO[key].label}</Typography>
                  </Stack>
                }
              />
            ))}
          </Tabs>

          {/* Tab Description */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">{TAB_INFO[activeTab].icon}</Typography>
            <Typography variant="body2" color="text.secondary">{TAB_INFO[activeTab].description}</Typography>
          </Stack>

          {/* Tab Content */}
          {activeTab === 'users' && (
            <UsersTab users={users} onUpdate={loadData} />
          )}
          {activeTab === 'challenger' && (
            <ChallengerTab users={users} onUpdate={loadData} />
          )}
          {activeTab === 'rewards' && (
            <RewardsTab
              users={users}
              rewards={rewards}
              adminName={currentUser.nickname || currentUser.displayName}
              onUpdate={loadData}
            />
          )}
        </Container>
      </Box>
    </Box>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography sx={{ fontSize: '1.5rem' }}>{icon}</Typography>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

function UsersTab({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    const searchLower = search.toLowerCase()
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.nickname && user.nickname.toLowerCase().includes(searchLower))
    )
  }, [users, search])

  const toggleAdmin = async (user: User) => {
    if (!window.confirm(`${user.nickname || user.displayName}의 관리자 권한을 ${user.isAdmin ? '해제' : '부여'}하시겠습니까?`)) {
      return
    }

    try {
      await adminSetRole({
        targetUid: user.uid,
        isAdmin: !user.isAdmin,
      })
      onUpdate()
    } catch (error) {
      console.error('권한 변경 실패:', error)
      alert('권한 변경에 실패했습니다.')
    }
  }

  const adjustPoints = async (user: User) => {
    const input = window.prompt(`${user.nickname || user.displayName}의 포인트를 조정합니다.\n현재: ${user.points}P\n\n조정할 포인트 (양수: 추가, 음수: 차감):`)
    if (!input) return

    const points = parseInt(input)
    if (isNaN(points)) {
      alert('올바른 숫자를 입력해주세요.')
      return
    }

    try {
      await adminAdjustPoints(user.uid, points)
      onUpdate()
    } catch (error) {
      console.error('포인트 조정 실패:', error)
      alert('포인트 조정에 실패했습니다.')
    }
  }

  const deleteUser = async (user: User) => {
    if (user.isAdmin) {
      alert('관리자는 삭제할 수 없습니다.')
      return
    }

    const confirmText = window.prompt(
      `⚠️ 정말로 "${user.nickname || user.displayName}" 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n확인하려면 "삭제"를 입력하세요:`
    )

    if (confirmText !== '삭제') {
      if (confirmText !== null) {
        alert('삭제가 취소되었습니다.')
      }
      return
    }

    try {
      await adminDeleteUser(user.uid)
      alert(`${user.nickname || user.displayName} 회원이 삭제되었습니다.`)
      onUpdate()
    } catch (error) {
      console.error('회원 삭제 실패:', error)
      alert('회원 삭제에 실패했습니다.')
    }
  }

  const toggleTestAccount = async (user: User) => {
    const action = user.isTestAccount ? '해제' : '지정'
    if (!window.confirm(`${user.nickname || user.displayName}을(를) 테스트 계정으로 ${action}하시겠습니까?\n\n테스트 계정은 랭킹과 동아리원 목록에서 숨겨집니다.`)) {
      return
    }

    try {
      await adminSetRole({
        targetUid: user.uid,
        isTestAccount: !user.isTestAccount,
      })
      onUpdate()
    } catch (error) {
      console.error('테스트 계정 변경 실패:', error)
      alert('테스트 계정 변경에 실패했습니다.')
    }
  }

  return (
    <Stack spacing={2}>
      {/* Search */}
      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 닉네임, 이메일로 검색..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          size="small"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          총 {filteredUsers.length}명의 회원
        </Typography>
      </Paper>

      {/* User List */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Header Row */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '1fr auto auto auto auto auto',
            gap: 2,
            p: 2,
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>유저</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', width: 96, textAlign: 'center' }}>티어</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', width: 80, textAlign: 'right' }}>포인트</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', width: 64, textAlign: 'center' }}>관리자</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', width: 48, textAlign: 'center' }}>테스트</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', width: 224, textAlign: 'right' }}>액션</Typography>
        </Box>

        {/* User Rows */}
        {filteredUsers.map((user, index) => {
          const tierInfo = TIER_INFO[user.tier]
          return (
            <Box key={user.uid}>
              {index > 0 && <Divider />}
              <Box
                sx={{
                  p: 2,
                  opacity: user.isTestAccount ? 0.6 : 1,
                  '&:hover': { bgcolor: 'grey.50' },
                  transition: 'background-color 0.2s',
                }}
              >
                <Box
                  sx={{
                    display: { sm: 'grid' },
                    gridTemplateColumns: { sm: '1fr auto auto auto auto auto' },
                    gap: { sm: 2 },
                    alignItems: { sm: 'center' },
                  }}
                >
                  {/* User Info */}
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: { xs: 1.5, sm: 0 } }}>
                    <Avatar
                      src={user.photoURL || '/default-avatar.svg'}
                      alt={user.displayName}
                      sx={{ width: 40, height: 40, border: 2, borderColor: tierInfo.color }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.nickname || user.displayName}
                        {user.isChallenger && <Box component="span" sx={{ ml: 0.75, fontSize: '0.75rem' }}>{TIER_INFO.challenger.emoji}</Box>}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Tier */}
                  <Box sx={{ width: { sm: 96 }, display: { sm: 'flex' }, justifyContent: { sm: 'center' } }}>
                    <Chip
                      label={`${tierInfo.emoji} ${tierInfo.name}`}
                      size="small"
                      sx={{
                        bgcolor: `${tierInfo.color}20`,
                        color: tierInfo.color,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>

                  {/* Points */}
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', width: { sm: 80 }, textAlign: { sm: 'right' } }}>
                    {user.points}P
                  </Typography>

                  {/* Admin Badge */}
                  <Box sx={{ width: { sm: 64 }, textAlign: { sm: 'center' }, display: { xs: 'none', sm: 'block' } }}>
                    {user.isAdmin ? (
                      <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </Box>

                  {/* Test Badge */}
                  <Box sx={{ width: { sm: 48 }, textAlign: { sm: 'center' }, display: { xs: 'none', sm: 'block' } }}>
                    {user.isTestAccount ? (
                      <CheckIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: { sm: 224 } }}>
                    <Button size="small" onClick={() => adjustPoints(user)}>
                      포인트
                    </Button>
                    <Button
                      size="small"
                      onClick={() => toggleTestAccount(user)}
                      color={user.isTestAccount ? 'warning' : 'inherit'}
                      title="테스트 계정 토글"
                    >
                      {user.isTestAccount ? '테스트 해제' : '테스트'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => toggleAdmin(user)}
                      color={user.isAdmin ? 'error' : 'primary'}
                    >
                      {user.isAdmin ? '관리자 해제' : '관리자'}
                    </Button>
                    {!user.isAdmin && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => deleteUser(user)}
                        title="회원 삭제"
                        startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                      >
                        삭제
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Box>
            </Box>
          )
        })}
      </Paper>
    </Stack>
  )
}

function ChallengerTab({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const challengers = users.filter((u) => u.isChallenger)
  const nonChallengers = users.filter((u) => !u.isChallenger)

  const toggleChallenger = async (user: User) => {
    const action = user.isChallenger ? '해제' : '지정'
    if (!window.confirm(`${user.nickname || user.displayName}을(를) 챌린저 티어로 ${action}하시겠습니까?`)) {
      return
    }

    try {
      await adminSetRole({
        targetUid: user.uid,
        isChallenger: !user.isChallenger,
      })
      onUpdate()
    } catch (error) {
      console.error('챌린저 변경 실패:', error)
      alert('챌린저 변경에 실패했습니다.')
    }
  }

  return (
    <Stack spacing={3}>
      {/* Current Challengers */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, background: 'linear-gradient(to right, #fef3c7, transparent)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography sx={{ fontSize: '1.5rem' }}>{TIER_INFO.challenger.emoji}</Typography>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>현재 챌린저</Typography>
              <Typography variant="body2" color="text.secondary">{challengers.length}명의 챌린저</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {challengers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>👑</Typography>
              <Typography color="text.secondary">아직 챌린저가 없습니다</Typography>
              <Typography variant="body2" color="text.secondary">아래에서 지정해주세요</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 1.5 }}>
              {challengers.map((user) => (
                <Paper
                  key={user.uid}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    background: 'linear-gradient(to right, #fffbeb, transparent)',
                    borderColor: 'warning.light',
                  }}
                >
                  <Avatar
                    src={user.photoURL || '/default-avatar.svg'}
                    alt={user.displayName}
                    sx={{ width: 48, height: 48, border: 2, borderColor: TIER_INFO.challenger.color }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.nickname || user.displayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main' }}>{user.points}P</Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => toggleChallenger(user)}>
                    해제
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Assign Challenger */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>챌린저 지정하기</Typography>
          <Typography variant="body2" color="text.secondary">
            포인트 상위 유저들 중에서 챌린저를 선정하세요
          </Typography>
        </Box>

        {nonChallengers.slice(0, 20).map((user, index) => {
          const tierInfo = TIER_INFO[user.tier]
          return (
            <Box key={user.uid}>
              {index > 0 && <Divider />}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ p: 2, '&:hover': { bgcolor: 'grey.50' }, transition: 'background-color 0.2s' }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {index + 1}
                </Avatar>
                <Avatar
                  src={user.photoURL || '/default-avatar.svg'}
                  alt={user.displayName}
                  sx={{ width: 40, height: 40, border: 2, borderColor: tierInfo.color }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.nickname || user.displayName}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                    <Typography variant="caption" sx={{ color: tierInfo.color }}>
                      {tierInfo.emoji} {tierInfo.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>{user.points}P</Typography>
                  </Stack>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => toggleChallenger(user)}
                  startIcon={<Box component="span">👑</Box>}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>챌린저 지정</Box>
                </Button>
              </Stack>
            </Box>
          )
        })}
      </Paper>
    </Stack>
  )
}

function RewardsTab({
  users,
  rewards,
  adminName,
  onUpdate,
}: {
  users: User[]
  rewards: Reward[]
  adminName: string
  onUpdate: () => void
}) {
  const [selectedUser, setSelectedUser] = useState('')
  const [rewardName, setRewardName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleGiveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !rewardName.trim()) {
      alert('유저와 상품명을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const user = users.find((u) => u.uid === selectedUser)
      if (!user) return

      await addDoc(collection(db, 'rewards'), {
        userId: selectedUser,
        userName: user.nickname || user.displayName,
        rewardName: rewardName.trim(),
        description: description.trim(),
        givenAt: serverTimestamp(),
        givenBy: adminName,
      })

      setSelectedUser('')
      setRewardName('')
      setDescription('')
      onUpdate()
      alert('상품이 지급되었습니다!')
    } catch (error) {
      console.error('상품 지급 실패:', error)
      alert('상품 지급에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
      {/* Give Reward Form */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '1.25rem' }}>🎁</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>상품 지급</Typography>
          </Stack>
        </Box>

        <Box component="form" onSubmit={handleGiveReward} sx={{ p: 2.5, pt: 0 }}>
          <Stack spacing={2.5}>
            <TextField
              select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              label="대상 유저"
              fullWidth
            >
              <MenuItem value="">유저 선택...</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.uid} value={user.uid}>
                  {user.nickname || user.displayName} ({user.points}P - {TIER_INFO[user.tier].name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              label="상품명"
              placeholder="예: 스타벅스 아메리카노"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              label="설명 (선택)"
              placeholder="상품 지급 사유나 설명"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitting || !selectedUser || !rewardName.trim()}
            >
              {submitting ? '지급 중...' : '상품 지급'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Reward History */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '1.25rem' }}>📋</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>지급 내역</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">{rewards.length}건</Typography>
        </Box>

        <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
          {rewards.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>📭</Typography>
              <Typography color="text.secondary">아직 지급 내역이 없습니다</Typography>
            </Box>
          ) : (
            <>
              {rewards.map((reward, index) => (
                <Box key={reward.id}>
                  {index > 0 && <Divider />}
                  <Box sx={{ p: 2, '&:hover': { bgcolor: 'grey.50' }, transition: 'background-color 0.2s' }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Typography sx={{ fontSize: '1.5rem' }}>🎁</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{reward.rewardName}</Typography>
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>{reward.userName}</Typography>
                        {reward.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{reward.description}</Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary">{reward.givenAt.toLocaleDateString('ko-KR')}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>by {reward.givenBy}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}
