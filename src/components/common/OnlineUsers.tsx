import { useState, useEffect } from 'react'
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth, calculateTier } from '../../contexts/AuthContext'
import { TierType, TIER_INFO } from '../../types'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import ButtonBase from '@mui/material/ButtonBase'
import Badge from '@mui/material/Badge'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

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

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        const lastSeen = data.lastSeen?.toDate?.() || new Date()

        if (now - lastSeen.getTime() < 120000) {
          users.push({
            uid: docSnap.id,
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
    <Box sx={{ position: 'fixed', bottom: 32, right: 20, zIndex: 40 }}>
      <Paper elevation={8} sx={{ width: 280, borderRadius: 4, overflow: 'hidden' }}>
        {/* Header */}
        <ButtonBase
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ width: '100%', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge
              variant="dot"
              color="success"
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Box sx={{ width: 10, height: 10 }} />
            </Badge>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              접속 중
            </Typography>
            <Chip label={onlineUsers.length} size="small" color="primary" variant="outlined" />
          </Box>
          {isExpanded ? <ExpandLessIcon sx={{ color: 'text.disabled' }} /> : <ExpandMoreIcon sx={{ color: 'text.disabled' }} />}
        </ButtonBase>

        {/* User List */}
        <Collapse in={isExpanded}>
          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            {onlineUsers.length === 0 ? (
              <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  접속 중인 유저가 없습니다
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {onlineUsers.map((user) => {
                  const tierInfo = TIER_INFO[user.tier] || TIER_INFO.bronze
                  return (
                    <ListItem
                      key={user.uid}
                      sx={{
                        bgcolor: user.uid === currentUser.uid ? 'primary.50' : 'transparent',
                        '&:hover': { bgcolor: user.uid === currentUser.uid ? 'primary.50' : 'action.hover' },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Badge
                          variant="dot"
                          color="success"
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar
                            src={user.photoURL || undefined}
                            alt={user.nickname || user.displayName}
                            sx={{ width: 32, height: 32 }}
                          />
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.nickname || user.displayName}
                            {user.uid === currentUser.uid && (
                              <Typography component="span" variant="caption" sx={{ color: 'primary.main', ml: 0.5 }}>
                                (나)
                              </Typography>
                            )}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: tierInfo.color }}>
                            {tierInfo.emoji} {tierInfo.name}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Box>
        </Collapse>

        {/* Collapsed avatars */}
        {!isExpanded && onlineUsers.length > 0 && (
          <Box sx={{ pb: 2, pl: 3 }}>
            <AvatarGroup max={4} sx={{ justifyContent: 'flex-end', '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
              {onlineUsers.map((user) => (
                <Avatar
                  key={user.uid}
                  src={user.photoURL || undefined}
                  alt={user.nickname || user.displayName}
                />
              ))}
            </AvatarGroup>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
