import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { getUserPosts } from '../services/postService'
import { Post, TIER_INFO, TIER_THRESHOLDS, INTEREST_OPTIONS, SKILL_OPTIONS } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getNextTier, getCategoryLabel } from '../utils/helpers'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import SettingsIcon from '@mui/icons-material/Settings'
import EditNoteIcon from '@mui/icons-material/EditNote'
import LockIcon from '@mui/icons-material/Lock'

export default function MyPage() {
  const { currentUser, refreshUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'posts'>('profile')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nickname, setNickname] = useState('')
  const [realName, setRealName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    if (!currentUser) return
    try {
      const { posts: userPosts } = await getUserPosts(currentUser.uid, 100)
      const privateRef = doc(db, 'userPrivate', currentUser.uid)
      const privateSnap = await getDoc(privateRef)
      const privateData = privateSnap.exists() ? privateSnap.data() : {}

      setPosts(userPosts)
      setNickname(currentUser.nickname || currentUser.displayName || '')
      setRealName(typeof privateData.realName === 'string' ? privateData.realName : currentUser.realName || '')
      setStudentId(typeof privateData.studentId === 'string' ? privateData.studentId : currentUser.studentId || '')
      setInterests(currentUser.interests || [])
      setSkills(currentUser.skills || [])
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { photoURL: downloadURL })

      await refreshUser()
      alert('프로필 사진이 변경되었습니다!')
    } catch (error) {
      console.error('사진 업로드 실패:', error)
      alert('사진 업로드에 실패했습니다.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    if (!currentUser) return
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        nickname: nickname.trim(),
        interests,
        skills,
      })

      const privateRef = doc(db, 'userPrivate', currentUser.uid)
      await setDoc(
        privateRef,
        {
          realName: realName.trim(),
          studentId: studentId.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      await refreshUser()
      alert('저장되었습니다!')
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const toggleSkill = (skill: string) => {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  if (!currentUser) {
    return (
      <Box sx={{ py: 6 }}>
        <Container maxWidth="xs">
          <Paper sx={{ py: 8, textAlign: 'center' }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>로그인이 필요합니다</Typography>
            <Button
              component={Link}
              to="/"
              variant="contained"
            >
              홈으로 가기
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const nextTierInfo = getNextTier(currentUser.tier, currentUser.points)
  const displayNickname = currentUser.nickname || currentUser.displayName
  const tierInfo = TIER_INFO[currentUser.tier] || TIER_INFO.bronze

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Page Header */}
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800 }}>마이페이지</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>프로필을 관리하세요</Typography>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ pb: 6 }}>
        {/* Profile Header Card */}
        <Paper sx={{ p: 3, mb: 3, overflow: 'hidden' }}>
          {/* Tier color banner */}
          <Box
            sx={{
              height: 80,
              mx: -3,
              mt: -3,
              mb: 2.5,
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
              background: `linear-gradient(135deg, ${tierInfo.color}50, ${tierInfo.color}15)`,
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'center', sm: 'flex-start' }}
            spacing={2.5}
          >
            {/* Avatar */}
            <Box
              sx={{
                position: 'relative',
                flexShrink: 0,
                '&:hover .photo-overlay': { opacity: 1 },
              }}
            >
              <Avatar
                src={currentUser.photoURL || '/default-avatar.svg'}
                alt={displayNickname}
                sx={{
                  width: 80,
                  height: 80,
                  border: 3,
                  borderColor: tierInfo.color,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  bgcolor: tierInfo.color,
                }}
              >
                {tierInfo.emoji}
              </Box>
              <Box
                className="photo-overlay"
                onClick={handlePhotoClick}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  cursor: uploadingPhoto ? 'wait' : 'pointer',
                  pointerEvents: uploadingPhoto ? 'none' : 'auto',
                }}
              >
                {uploadingPhoto ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <CameraAltIcon sx={{ color: 'white', fontSize: 24 }} />
                )}
              </Box>
            </Box>

            {/* User Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'center', sm: 'center' }}
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{displayNickname}</Typography>
                <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1}>
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
                  {currentUser.isAdmin && (
                    <Chip
                      label="관리자"
                      size="small"
                      color="secondary"
                    />
                  )}
                </Stack>
              </Stack>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>{currentUser.email}</Typography>

              {(currentUser.department || currentUser.year) && (
                <Stack direction="row" flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1} sx={{ mb: 1.5 }}>
                  {currentUser.department && (
                    <Chip label={`🎓 ${currentUser.department}`} size="small" color="primary" variant="outlined" />
                  )}
                  {currentUser.year && (
                    <Chip label={`📚 ${currentUser.year}학년`} size="small" color="secondary" variant="outlined" />
                  )}
                </Stack>
              )}

              {/* Points & Progress */}
              <Stack direction="row" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} spacing={1.5} sx={{ mb: 1.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    background: 'linear-gradient(to right, #4f46e5, #8b5cf6)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {currentUser.points}P
                </Typography>
                {nextTierInfo && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {TIER_INFO[nextTierInfo.tier].emoji} {nextTierInfo.pointsNeeded}P 남음
                  </Typography>
                )}
              </Stack>

              {nextTierInfo && (
                <Box sx={{ maxWidth: 280, mx: { xs: 'auto', sm: 0 } }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      ((currentUser.points - TIER_THRESHOLDS[currentUser.tier].min) /
                        (TIER_THRESHOLDS[nextTierInfo.tier].min - TIER_THRESHOLDS[currentUser.tier].min)) * 100,
                      100
                    )}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${TIER_INFO[currentUser.tier].color}20`,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${TIER_INFO[currentUser.tier].color}, ${TIER_INFO[nextTierInfo.tier].color})`,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
          <StatCard label="작성글" value={posts.length} icon="📝" />
          <StatCard label="받은 좋아요" value={posts.reduce((sum, post) => sum + (post.likes || []).length, 0)} icon="❤️" />
          <StatCard label="받은 댓글" value={posts.reduce((sum, post) => sum + (post.comments || []).length, 0)} icon="💬" />
        </Box>

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="회원정보 수정" value="profile" />
            <Tab label={`내가 쓴 글 (${posts.length})`} value="posts" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 'profile' ? (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SettingsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  회원정보 수정
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5} sx={{ maxWidth: 420 }}>
                <Alert severity="info" icon={false}>
                  프로필 사진을 변경하려면 위의 프로필 이미지에 마우스를 올려보세요!
                </Alert>

                <TextField
                  label="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="사이트에서 사용할 닉네임"
                  required
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  helperText={
                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>다른 회원들에게 보여지는 이름입니다.</span>
                      <span>{nickname.length}/20</span>
                    </Box>
                  }
                />

                <TextField
                  label="실명 (비공개)"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="실명을 입력하세요"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  helperText="본인과 관리자만 확인할 수 있습니다."
                />

                <TextField
                  label="학번 (비공개)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="학번을 입력하세요"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  helperText="본인과 관리자만 확인할 수 있습니다."
                />

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>관심 분야</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {INTEREST_OPTIONS.map((interest) => (
                      <Chip
                        key={interest}
                        label={interest}
                        onClick={() => toggleInterest(interest)}
                        variant={interests.includes(interest) ? 'filled' : 'outlined'}
                        color={interests.includes(interest) ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.75, display: 'block' }}>
                    여러 개 선택 가능합니다.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>보유 기술</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {SKILL_OPTIONS.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onClick={() => toggleSkill(skill)}
                        variant={skills.includes(skill) ? 'filled' : 'outlined'}
                        color={skills.includes(skill) ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.75, display: 'block' }}>
                    여러 개 선택 가능합니다.
                  </Typography>
                </Box>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {saving ? '저장 중...' : '저장하기'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EditNoteIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  내가 쓴 글
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 3 }}>
              {posts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ fontSize: '3rem', mb: 2 }}>📝</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>아직 작성한 글이 없습니다</Typography>
                  <Button
                    component={Link}
                    to="/write?category=introduction"
                    variant="contained"
                  >
                    첫 글 작성하기
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {posts.map((post) => (
                    <Paper
                      key={post.id}
                      component={Link}
                      to={`/post/${post.id}`}
                      variant="outlined"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 1.5,
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography component="span" variant="caption" sx={{ color: 'primary.main', mr: 1 }}>
                          [{getCategoryLabel(post.category)}]
                        </Typography>
                        <Typography component="span" variant="body2">
                          {post.title}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <FavoriteIcon sx={{ fontSize: 14, color: 'error.light' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{(post.likes || []).length}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{post.comments.length}</Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
                        >
                          {post.createdAt.toLocaleDateString('ko-KR')}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '1.25rem', mb: 0.5 }}>{icon}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
    </Paper>
  )
}
