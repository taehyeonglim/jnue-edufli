import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth, calculateTier } from '../contexts/AuthContext'
import { User, Reward, TIER_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { Navigate } from 'react-router-dom'
import { adminAdjustPoints, adminSetRole, adminDeleteUser } from '../services/adminService'

type Tab = 'users' | 'rewards' | 'challenger'

const TAB_INFO: Record<Tab, { label: string; icon: string; description: string }> = {
  users: { label: '회원 관리', icon: '👥', description: '포인트 조정 및 관리자 권한 관리' },
  challenger: { label: '챌린저 지정', icon: '👑', description: '특별 챌린저 티어 부여' },
  rewards: { label: '상품 지급', icon: '🎁', description: '이벤트 상품 지급 및 내역 관리' },
}

export default function Admin() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="flex items-center gap-3 justify-center mb-2">
            <span className="text-3xl">⚙️</span>
            <h1 className="page-title">관리자 페이지</h1>
          </div>
          <p className="page-desc">회원 관리, 챌린저 지정, 상품 지급을 관리합니다</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {error && <ErrorMessage message={error} onRetry={loadData} />}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="전체 회원" value={users.length} icon="👥" />
            <StatCard label="챌린저" value={users.filter(u => u.isChallenger).length} icon="👑" />
            <StatCard label="관리자" value={users.filter(u => u.isAdmin).length} icon="🛡️" />
            <StatCard label="상품 지급" value={rewards.length} icon="🎁" />
          </div>

          {/* Tabs */}
          <div className="tabs mb-6">
            {(Object.entries(TAB_INFO) as [Tab, typeof TAB_INFO[Tab]][]).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tab ${activeTab === key ? 'tab-active' : ''}`}
              >
                <span className="text-lg">{info.icon}</span>
                <span className="hidden sm:inline ml-2">{info.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Description */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <span>{TAB_INFO[activeTab].icon}</span>
            <span>{TAB_INFO[activeTab].description}</span>
          </div>

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
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-blue-600">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
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
    <div className="space-y-4">
      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 닉네임, 이메일로 검색..."
            className="input pl-12"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          총 {filteredUsers.length}명의 회원
        </p>
      </div>

      {/* User List */}
      <div className="card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 p-4 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-200">
          <span>유저</span>
          <span className="w-24 text-center">티어</span>
          <span className="w-20 text-right">포인트</span>
          <span className="w-16 text-center">관리자</span>
          <span className="w-12 text-center">테스트</span>
          <span className="w-56 text-right">액션</span>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => {
            const tierInfo = TIER_INFO[user.tier]
            return (
              <div key={user.uid} className={`p-4 hover:bg-gray-50 transition-colors ${user.isTestAccount ? 'opacity-60' : ''}`}>
                <div className="sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:gap-4 sm:items-center">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <img
                      src={user.photoURL || '/default-avatar.svg'}
                      alt={user.displayName}
                      className="avatar avatar-md"
                      style={{ borderColor: tierInfo.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-gray-900 font-medium truncate">
                        {user.nickname || user.displayName}
                        {user.isChallenger && <span className="ml-1.5 text-xs">{TIER_INFO.challenger.emoji}</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:contents">
                    <div className="sm:w-24 sm:flex sm:justify-center">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${tierInfo.color}20`,
                          color: tierInfo.color,
                        }}
                      >
                        {tierInfo.emoji} {tierInfo.name}
                      </span>
                    </div>

                    <span className="text-blue-600 font-bold sm:w-20 sm:text-right">
                      {user.points}P
                    </span>

                    <span className="sm:w-16 sm:text-center hidden sm:block">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-teal-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </span>

                    <span className="sm:w-12 sm:text-center hidden sm:block">
                      {user.isTestAccount ? (
                        <span className="inline-flex items-center gap-1 text-orange-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </span>

                    <div className="flex justify-end gap-2 sm:w-56">
                      <button
                        onClick={() => adjustPoints(user)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        포인트
                      </button>
                      <button
                        onClick={() => toggleTestAccount(user)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          user.isTestAccount
                            ? 'text-orange-400 hover:bg-orange-400/10'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="테스트 계정 토글"
                      >
                        {user.isTestAccount ? '테스트 해제' : '테스트'}
                      </button>
                      <button
                        onClick={() => toggleAdmin(user)}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          user.isAdmin
                            ? 'text-red-400 hover:bg-red-400/10'
                            : 'text-teal-500 hover:bg-teal-50'
                        }`}
                      >
                        {user.isAdmin ? '관리자 해제' : '관리자'}
                      </button>
                      {!user.isAdmin && (
                        <button
                          onClick={() => deleteUser(user)}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="회원 삭제"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      {/* Current Challengers */}
      <div className="card overflow-hidden">
        <div className="card-header bg-gradient-to-r from-amber-100 to-transparent">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{TIER_INFO.challenger.emoji}</span>
            <div>
              <h2 className="heading-3 text-blue-600">현재 챌린저</h2>
              <p className="text-sm text-gray-500">{challengers.length}명의 챌린저</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {challengers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">👑</span>
              <p className="text-gray-500">아직 챌린저가 없습니다</p>
              <p className="text-sm text-gray-500">아래에서 지정해주세요</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {challengers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-transparent border border-amber-300 rounded"
                >
                  <img
                    src={user.photoURL || '/default-avatar.svg'}
                    alt={user.displayName}
                    className="avatar avatar-lg"
                    style={{ borderColor: TIER_INFO.challenger.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{user.nickname || user.displayName}</p>
                    <p className="text-sm text-blue-600">{user.points}P</p>
                  </div>
                  <button
                    onClick={() => toggleChallenger(user)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    해제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Challenger */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="heading-3 text-blue-600">챌린저 지정하기</h2>
          <p className="text-sm text-gray-500">
            포인트 상위 유저들 중에서 챌린저를 선정하세요
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {nonChallengers.slice(0, 20).map((user, index) => {
            const tierInfo = TIER_INFO[user.tier]
            return (
              <div
                key={user.uid}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 text-sm font-medium">
                  {index + 1}
                </span>
                <img
                  src={user.photoURL || '/default-avatar.svg'}
                  alt={user.displayName}
                  className="avatar avatar-md"
                  style={{ borderColor: tierInfo.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.nickname || user.displayName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: tierInfo.color }}>
                      {tierInfo.emoji} {tierInfo.name}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">{user.points}P</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleChallenger(user)}
                  className="px-4 py-2 text-sm font-medium text-teal-500 border border-teal-300 hover:bg-teal-50 rounded transition-colors flex items-center gap-2"
                >
                  <span>👑</span>
                  <span className="hidden sm:inline">챌린저 지정</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
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
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Give Reward Form */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <h2 className="heading-3 text-blue-600">상품 지급</h2>
          </div>
        </div>

        <form onSubmit={handleGiveReward} className="card-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              대상 유저
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="input select"
            >
              <option value="">유저 선택...</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.nickname || user.displayName} ({user.points}P - {TIER_INFO[user.tier].name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              상품명
            </label>
            <input
              type="text"
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              placeholder="예: 스타벅스 아메리카노"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 지급 사유나 설명"
              className="input textarea"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedUser || !rewardName.trim()}
            className="w-full btn btn-primary btn-lg"
          >
            {submitting ? '지급 중...' : '상품 지급'}
          </button>
        </form>
      </div>

      {/* Reward History */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="heading-3 text-blue-600">지급 내역</h2>
          </div>
          <span className="text-sm text-gray-500">{rewards.length}건</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {rewards.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-gray-500">아직 지급 내역이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rewards.map((reward) => (
                <div key={reward.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{reward.rewardName}</p>
                      <p className="text-sm text-blue-600">{reward.userName}</p>
                      {reward.description && (
                        <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 shrink-0">
                      <p>{reward.givenAt.toLocaleDateString('ko-KR')}</p>
                      <p className="mt-0.5">by {reward.givenBy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
