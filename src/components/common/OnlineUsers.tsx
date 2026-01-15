import { useState, useEffect } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'
import { TierType, TIER_THRESHOLDS, TIER_INFO } from '../../types'

interface OnlineUser {
  uid: string
  displayName: string
  nickname?: string
  photoURL: string | null
  tier: TierType
  lastSeen: Date
}

export default function OnlineUsers() {
  const { currentUser } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const calculateTier = (points: number, isChallenger: boolean): TierType => {
    if (isChallenger) return 'challenger'
    const tiers: TierType[] = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze']
    for (const tier of tiers) {
      if (points >= TIER_THRESHOLDS[tier].min) return tier
    }
    return 'bronze'
  }

  useEffect(() => {
    if (!currentUser) return

    const presenceRef = doc(db, 'presence', currentUser.uid)

    const registerPresence = async () => {
      await setDoc(presenceRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || '',
        nickname: currentUser.nickname || null,
        photoURL: currentUser.photoURL || null,
        points: currentUser.points || 0,
        isChallenger: currentUser.isChallenger || false,
        lastSeen: serverTimestamp(),
      })
    }

    registerPresence()
    const interval = setInterval(registerPresence, 30000)

    const handleBeforeUnload = () => {
      deleteDoc(presenceRef)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    const unsubscribe = onSnapshot(collection(db, 'presence'), (snapshot) => {
      const now = Date.now()
      const users: OnlineUser[] = []

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const lastSeen = data.lastSeen?.toDate?.() || new Date()

        if (now - lastSeen.getTime() < 120000) {
          users.push({
            uid: doc.id,
            displayName: data.displayName,
            nickname: data.nickname,
            photoURL: data.photoURL,
            tier: calculateTier(data.points || 0, data.isChallenger || false),
            lastSeen,
          })
        }
      })

      setOnlineUsers(users)
    })

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      deleteDoc(presenceRef)
      unsubscribe()
    }
  }, [currentUser])

  if (!currentUser) return null

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-72 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2.5 ml-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-700">
              접속 중
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
              {onlineUsers.length}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* User List */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            {onlineUsers.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-gray-400">접속 중인 유저가 없습니다</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto py-2">
                {onlineUsers.map((user) => {
                  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze
                  return (
                    <div
                      key={user.uid}
                      className={`px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        user.uid === currentUser.uid
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={user.photoURL || '/default-avatar.png'}
                          alt={user.nickname || user.displayName}
                          className="w-8 h-8 rounded-full ring-1 ring-gray-200 object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.nickname || user.displayName}
                          {user.uid === currentUser.uid && (
                            <span className="text-xs text-blue-500 ml-1">(나)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{tierInfo.emoji}</span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: tierInfo.color }}
                          >
                            {tierInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsed avatars */}
        {!isExpanded && onlineUsers.length > 0 && (
          <div className="px-6 pb-4 flex items-center ml-2">
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 4).map((user) => (
                <img
                  key={user.uid}
                  src={user.photoURL || '/default-avatar.png'}
                  alt={user.nickname || user.displayName}
                  className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
                  title={user.nickname || user.displayName}
                />
              ))}
            </div>
            {onlineUsers.length > 4 && (
              <span className="text-xs text-gray-400 ml-2.5">
                +{onlineUsers.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
