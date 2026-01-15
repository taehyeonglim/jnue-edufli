import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { User, TIER_INFO, TierType, POINT_VALUES, CATEGORY_INFO, TIER_THRESHOLDS } from '../types'

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-200/10 to-transparent rounded-full" />

        <div className="container relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 py-2.5 mb-10 bg-white/80 backdrop-blur-xl rounded-full border border-white/50 shadow-lg shadow-black/[0.03]" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500"></span>
              </span>
              <span className="text-sm font-medium text-slate-600">전주교육대학교 초등교육과 교육공학 동아리</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 bg-clip-text text-transparent">Edu</span>
              <span className="bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 bg-clip-text text-transparent"> FLI</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg font-semibold tracking-[0.2em] mb-4 bg-gradient-to-r from-slate-500 to-slate-400 bg-clip-text text-transparent uppercase">
              Education & Future Learning Innovation
            </p>

            <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto">
              교육과 기술의 만남, 그 중심에 내가 있다
            </p>

            {/* CTA Buttons */}
            {!currentUser ? (
              <button
                onClick={handleSignIn}
                className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white rounded-2xl overflow-hidden shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google로 시작하기
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Members Carousel Section */}
      {members.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 mb-5 bg-accent-50 rounded-full" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                <span className="text-lg">👥</span>
                <span className="text-sm font-medium text-accent-600">Members</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">반가워요!</h2>
              <p className="text-slate-500">카드에 마우스를 올려보세요</p>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto pt-3 pr-3 pb-6 scrollbar-hide scroll-smooth justify-center"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {members.map((member, index) => (
                <MemberCard key={member.uid} member={member} rank={index + 1} isAdmin={currentUser?.isAdmin} />
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                to="/ranking"
                className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="text-lg">🏆</span>
                <span>전체 랭킹 보기</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Section Divider */}
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />
      </div>

      {/* Features Section */}
      <section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container-sm">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-5 bg-primary-50 rounded-full" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium text-primary-600">Boards</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">게시판</h2>
            <p className="text-slate-500">동아리원들과 소통하세요</p>
          </div>

          <div className="grid gap-4">
            <FeatureCard
              to="/introduction"
              title={CATEGORY_INFO.introduction.name}
              desc={CATEGORY_INFO.introduction.description}
              icon={CATEGORY_INFO.introduction.icon}
              points={POINT_VALUES.INTRODUCTION}
              gradient="from-amber-400 to-orange-400"
            />
            <FeatureCard
              to="/study"
              title={CATEGORY_INFO.study.name}
              desc={CATEGORY_INFO.study.description}
              icon={CATEGORY_INFO.study.icon}
              points={POINT_VALUES.POST}
              gradient="from-primary-400 to-primary-500"
            />
            <FeatureCard
              to="/project"
              title={CATEGORY_INFO.project.name}
              desc={CATEGORY_INFO.project.description}
              icon={CATEGORY_INFO.project.icon}
              points={POINT_VALUES.POST}
              gradient="from-accent-400 to-cyan-500"
            />
            <FeatureCard
              to="/resources"
              title={CATEGORY_INFO.resources.name}
              desc={CATEGORY_INFO.resources.description}
              icon={CATEGORY_INFO.resources.icon}
              points={POINT_VALUES.RESOURCE_UPLOAD}
              gradient="from-violet-400 to-purple-500"
            />
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)' }} />
      </div>

      {/* Tier Section */}
      <section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="container-sm">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-5 bg-warm-light/30 rounded-full" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              <span className="text-lg">🏅</span>
              <span className="text-sm font-medium text-amber-600">Growth System</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">성장 시스템</h2>
            <p className="text-slate-500">활동하면서 성장해보세요</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-black/[0.03] overflow-hidden">
            <div className="p-8">
              {/* Tier List */}
              <div className="flex justify-center gap-3 md:gap-6 mb-10 flex-wrap">
                {tiers.map((tier, index) => (
                  <div
                    key={tier}
                    className="group relative text-center p-3 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-default"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {TIER_INFO[tier].emoji}
                    </div>
                    <div
                      className="text-xs font-bold tracking-wide"
                      style={{ color: TIER_INFO[tier].color }}
                    >
                      {TIER_INFO[tier].name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {TIER_THRESHOLDS[tier].min}P+
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 py-1 bg-white text-xs font-medium text-slate-400 rounded-full">
                    포인트 획득 방법
                  </span>
                </div>
              </div>

              {/* Points Guide */}
              <div className="grid grid-cols-2 gap-3">
                <PointItem label="자기소개" points={POINT_VALUES.INTRODUCTION} icon="👋" />
                <PointItem label="게시글 작성" points={POINT_VALUES.POST} icon="✍️" />
                <PointItem label="댓글 작성" points={POINT_VALUES.COMMENT} icon="💬" />
                <PointItem label="좋아요 받기" points={POINT_VALUES.LIKE_RECEIVED} icon="❤️" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="py-16 md:py-24">
          <div className="container-xs">
            <div className="relative text-center p-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20">
              {/* Decorative */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="text-6xl mb-6">💡</div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">지금 시작하세요</h2>
                <p className="text-white/80 text-lg mb-10">전주교대 학생이라면 누구나 환영합니다</p>
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google로 로그인
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function FeatureCard({
  to,
  title,
  desc,
  icon,
  points,
  gradient,
}: {
  to: string
  title: string
  desc: string
  icon: string
  points: number
  gradient: string
}) {
  return (
    <Link
      to={to}
      className="group relative flex items-center justify-between p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-black/[0.02] hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-0.5 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-accent-50 text-primary-600 text-sm font-bold rounded-lg">
          +{points}P
        </span>
        <svg className="w-5 h-5 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function PointItem({ label, points, icon }: { label: string; points: number; icon: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-300 group">
      <div className="flex items-center gap-3">
        <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-primary-600 font-bold">+{points}P</span>
    </div>
  )
}

function MemberCard({ member, rank, isAdmin }: { member: User; rank: number; isAdmin?: boolean }) {
  const tierInfo = TIER_INFO[member.tier] || TIER_INFO.bronze
  const displayName = member.nickname || member.displayName

  return (
    <div
      className="relative flex-shrink-0 w-[160px] h-[200px] group"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 group-hover:[transform:rotateY(180deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div
          className="absolute inset-0 rounded-2xl border border-white/50 p-4 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.03]"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Rank Badge - 관리자에게는 표시하지 않음 */}
          {!isAdmin && rank <= 3 && (
            <div
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              style={{
                background: rank === 1
                  ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
                  : rank === 2
                  ? 'linear-gradient(135deg, #E2E8F0, #94A3B8)'
                  : 'linear-gradient(135deg, #FDBA74, #CD7F32)',
                color: '#FFFFFF',
              }}
            >
              {rank}
            </div>
          )}

          {/* Profile Image */}
          <div className="relative mb-3">
            <div
              className="absolute inset-0 rounded-full blur-md opacity-40"
              style={{ background: `linear-gradient(135deg, ${tierInfo.color}60, ${tierInfo.color}20)` }}
            />
            <img
              src={member.photoURL || '/default-avatar.png'}
              alt={displayName}
              className="relative w-16 h-16 rounded-full border-2 object-cover shadow-md"
              style={{ borderColor: tierInfo.color }}
            />
            <span
              className="absolute -bottom-1 -right-1 text-lg drop-shadow-md"
              title={tierInfo.name}
            >
              {tierInfo.emoji}
            </span>
          </div>

          {/* Name */}
          <h3 className="w-full font-bold text-slate-800 text-sm mb-1 truncate text-center">
            {displayName}
          </h3>

          {/* Tier */}
          <p className="text-[11px] font-semibold mb-3 text-center" style={{ color: tierInfo.color }}>
            {tierInfo.name}
          </p>

          {/* Points */}
          <div className="px-4 py-1.5 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full">
            <span className="text-xs font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {member.points.toLocaleString()}P
            </span>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 rounded-2xl border border-primary-200/50 p-4 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white to-primary-50/30 backdrop-blur-xl shadow-lg"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Tier Emoji */}
          <div className="text-4xl mb-2 drop-shadow-md">{tierInfo.emoji}</div>

          {/* Real Name (stored in studentId) */}
          <div className="w-full text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">이름</p>
            <p className="text-sm font-semibold text-slate-700 truncate">
              {member.studentId || '미등록'}
            </p>
          </div>

          {/* Interests */}
          <div className="w-full text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">관심분야</p>
            <p className="text-sm font-semibold text-primary-600 truncate">
              {member.interests && member.interests.length > 0
                ? member.interests.slice(0, 2).join(', ')
                : '미등록'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
