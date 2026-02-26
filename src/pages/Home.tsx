import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { User, TIER_INFO, TierType, POINT_VALUES, CATEGORY_INFO, TIER_THRESHOLDS } from '../types'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LoginIcon from '@mui/icons-material/Login'
import { gradientTextSx } from '../theme/tierColors'

export default function Home() {
  const { currentUser, signInWithGoogle } = useAuth()
  const [members, setMembers] = useState<User[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    if (members.length === 0 || isPaused) return

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
        const cardWidth = 160 + 16

        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          carouselRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [members, isPaused])

  const loadMembers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(30)
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
        .slice(0, 20)
      setMembers(usersData)
    } catch (error) {
      console.error('회원 로딩 실패:', error)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('로그인 실패:', error)
    }
  }

  const tiers: TierType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'challenger']

  return (
    <Box>
      {/* Hero Section */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 }, position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          {/* Badge */}
          <Chip
            label="전주교육대학교 초등교육과 교육공학 동아리"
            variant="outlined"
            sx={{ mb: 5, fontSize: '0.8125rem', fontWeight: 500, py: 2.5, px: 1 }}
          />

          {/* Title */}
          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, fontWeight: 800, mb: 3, letterSpacing: '-0.03em' }}>
            <Box component="span" sx={{ color: 'primary.main' }}>Edu</Box>
            <Box component="span" sx={{ color: 'secondary.main' }}> FLI</Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.2em',
              mb: 2,
              color: 'text.secondary',
              textTransform: 'uppercase',
            }}
          >
            Education & Future Learning Innovation
          </Typography>

          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 6 }}>
            교육과 기술의 만남, 그 중심에 내가 있다
          </Typography>

          {/* CTA */}
          {!currentUser && (
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              startIcon={<LoginIcon />}
              sx={{ px: 5, py: 1.5, fontSize: '1.125rem' }}
            >
              Google로 시작하기
            </Button>
          )}
        </Container>
      </Box>

      {/* Members Carousel */}
      {members.length > 0 && (
        <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Chip label="👥 Members" color="secondary" variant="outlined" sx={{ mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>반가워요!</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>카드에 마우스를 올려보세요</Typography>
            </Box>

            <Box
              ref={carouselRef}
              sx={{
                display: 'flex',
                gap: 2.5,
                overflowX: 'auto',
                pt: 1,
                pb: 3,
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {members.map((member, index) => (
                <MemberCard key={member.uid} member={member} rank={index + 1} isAdmin={currentUser?.isAdmin} />
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                component={Link}
                to="/ranking"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  borderRadius: 4,
                }}
              >
                🏆 전체 랭킹 보기
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Divider />
      </Container>

      {/* Features Section */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="📋 Boards" color="primary" variant="outlined" sx={{ mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>게시판</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>동아리원들과 소통하세요</Typography>
          </Box>

          <Stack spacing={2}>
            <FeatureCard to="/introduction" title={CATEGORY_INFO.introduction.name} desc={CATEGORY_INFO.introduction.description} icon={CATEGORY_INFO.introduction.icon} points={POINT_VALUES.INTRODUCTION} color="#F59E0B" />
            <FeatureCard to="/study" title={CATEGORY_INFO.study.name} desc={CATEGORY_INFO.study.description} icon={CATEGORY_INFO.study.icon} points={POINT_VALUES.POST} color="#6366F1" />
            <FeatureCard to="/project" title={CATEGORY_INFO.project.name} desc={CATEGORY_INFO.project.description} icon={CATEGORY_INFO.project.icon} points={POINT_VALUES.POST} color="#06B6D4" />
            <FeatureCard to="/resources" title={CATEGORY_INFO.resources.name} desc={CATEGORY_INFO.resources.description} icon={CATEGORY_INFO.resources.icon} points={POINT_VALUES.RESOURCE_UPLOAD} color="#8B5CF6" />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Divider />
      </Container>

      {/* Tier Section */}
      <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="🏅 Growth System" color="warning" variant="outlined" sx={{ mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>성장 시스템</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>활동하면서 성장해보세요</Typography>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
            {/* Tier List */}
            <Stack direction="row" justifyContent="center" spacing={{ xs: 1, md: 3 }} flexWrap="wrap" useFlexGap sx={{ mb: 5 }}>
              {tiers.map((tier) => (
                <Box key={tier} sx={{ textAlign: 'center', p: 1.5, borderRadius: 3, cursor: 'default', '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}>
                  <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, mb: 0.5 }}>{TIER_INFO[tier].emoji}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: TIER_INFO[tier].color, display: 'block' }}>{TIER_INFO[tier].name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>{TIER_THRESHOLDS[tier].min}P+</Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Chip label="포인트 획득 방법" size="small" variant="outlined" />
            </Divider>

            {/* Points Guide */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <PointItem label="자기소개" points={POINT_VALUES.INTRODUCTION} icon="👋" />
              <PointItem label="게시글 작성" points={POINT_VALUES.POST} icon="✍️" />
              <PointItem label="댓글 작성" points={POINT_VALUES.COMMENT} icon="💬" />
              <PointItem label="좋아요 받기" points={POINT_VALUES.LIKE_RECEIVED} icon="❤️" />
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* CTA Section */}
      {!currentUser && (
        <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
          <Container maxWidth="sm">
            <Paper
              sx={{
                textAlign: 'center',
                p: { xs: 5, md: 6 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                color: '#fff',
              }}
            >
              <Typography sx={{ fontSize: '3.5rem', mb: 3 }}>💡</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', mb: 2 }}>지금 시작하세요</Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5 }}>전주교대 학생이라면 누구나 환영합니다</Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSignIn}
                startIcon={<LoginIcon />}
                sx={{
                  bgcolor: '#fff',
                  color: 'primary.main',
                  fontWeight: 700,
                  px: 5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                }}
              >
                Google로 로그인
              </Button>
            </Paper>
          </Container>
        </Box>
      )}
    </Box>
  )
}

function FeatureCard({ to, title, desc, icon, points, color }: { to: string; title: string; desc: string; icon: string; points: number; color: string }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea
        component={Link}
        to={to}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48, fontSize: '1.5rem', border: 'none', boxShadow: 'none' }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{desc}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip label={`+${points}P`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
          <ChevronRightIcon sx={{ color: 'text.disabled' }} />
        </Stack>
      </CardActionArea>
    </Card>
  )
}

function PointItem({ label, points, icon }: { label: string; points: number; icon: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderRadius: 2,
        '&:hover': { borderColor: 'primary.light', bgcolor: 'primary.50' },
        transition: 'all 0.2s',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography sx={{ fontSize: '1.125rem' }}>{icon}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>+{points}P</Typography>
    </Paper>
  )
}

function MemberCard({ member, rank, isAdmin }: { member: User; rank: number; isAdmin?: boolean }) {
  const tierInfo = TIER_INFO[member.tier] || TIER_INFO.bronze
  const displayName = member.nickname || member.displayName

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: 160,
        height: 200,
        perspective: '1000px',
        '&:hover .flip-inner': { transform: 'rotateY(180deg)' },
      }}
    >
      <Box
        className="flip-inner"
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.5s',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front Side */}
        <Paper
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backfaceVisibility: 'hidden',
          }}
        >
          {!isAdmin && rank <= 3 && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#fff',
                background: rank === 1
                  ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
                  : rank === 2
                  ? 'linear-gradient(135deg, #E2E8F0, #94A3B8)'
                  : 'linear-gradient(135deg, #FDBA74, #CD7F32)',
              }}
            >
              {rank}
            </Box>
          )}

          <Box sx={{ position: 'relative', mb: 1.5 }}>
            <Avatar
              src={member.photoURL || undefined}
              alt={displayName}
              sx={{ width: 64, height: 64, borderColor: tierInfo.color }}
            />
            <Typography
              sx={{ position: 'absolute', bottom: -4, right: -4, fontSize: '1.125rem' }}
              title={tierInfo.name}
            >
              {tierInfo.emoji}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 700, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.5 }}>
            {displayName}
          </Typography>

          <Typography variant="caption" sx={{ fontWeight: 600, color: tierInfo.color, mb: 1.5 }}>
            {tierInfo.name}
          </Typography>

          <Chip
            label={`${member.points.toLocaleString()}P`}
            size="small"
            sx={{ fontWeight: 700, ...gradientTextSx, bgcolor: 'primary.50' }}
          />
        </Paper>

        {/* Back Side */}
        <Paper
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'primary.100',
          }}
        >
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{tierInfo.emoji}</Typography>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>학과</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member.department || '미등록'}
            </Typography>
          </Box>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>관심분야</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member.interests && member.interests.length > 0
                ? member.interests.slice(0, 2).join(', ')
                : '미등록'}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
