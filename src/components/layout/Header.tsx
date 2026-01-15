import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { TIER_INFO } from '../../types'
import { getUnreadCount } from '../../services/messageService'

export default function Header() {
  const { currentUser, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const loadUnreadCount = async () => {
    if (!currentUser) return
    try {
      const count = await getUnreadCount(currentUser.uid)
      setUnreadMessages(count)
    } catch (error) {
      console.error('읽지 않은 쪽지 수 로딩 실패:', error)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('로그인 실패:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/introduction', label: '자기소개', icon: '👋' },
    { path: '/study', label: '스터디', icon: '📖' },
    { path: '/project', label: '프로젝트', icon: '🚀' },
    { path: '/resources', label: '자료실', icon: '📁' },
    { path: '/gallery', label: '갤러리', icon: '📷' },
    { path: '/ranking', label: '랭킹', icon: '🏆' },
  ]

  const displayName = currentUser?.nickname || currentUser?.displayName

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/[0.03]'
          : 'bg-white/60 backdrop-blur-md'
      }`}
    >
      {/* Gradient accent line */}
      <div className="h-[3px] bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 opacity-90" />

      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
              <img
                src="/edufli-logo.png"
                alt="Edu FLI"
                className="relative w-10 h-10 rounded-xl object-contain shadow-soft"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg tracking-wide">
                <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">Edu</span>
                <span className="bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent"> FLI</span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider font-medium">Education & Future Learning Innovation</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive(link.path)
                    ? 'text-primary-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isActive(link.path) && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl" />
                )}
                <span className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  !isActive(link.path) ? 'group-hover:bg-slate-100/80' : ''
                }`} />
                <span className="relative flex items-center gap-1.5">
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </span>
              </Link>
            ))}
            {currentUser?.isAdmin && (
              <Link
                to="/admin"
                className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600'
                    : 'text-amber-500 hover:bg-amber-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>⚙️</span>
                  관리자
                </span>
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Messages Link */}
                <Link
                  to="/messages"
                  className="relative p-2.5 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg shadow-red-500/30">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* User Profile */}
                <Link
                  to="/mypage"
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-100/80 transition-all duration-200 group"
                >
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-50 transition-opacity group-hover:opacity-80"
                      style={{ background: `linear-gradient(135deg, ${TIER_INFO[currentUser.tier].color}40, ${TIER_INFO[currentUser.tier].color}20)` }}
                    />
                    <img
                      src={currentUser.photoURL || '/default-avatar.png'}
                      alt={displayName}
                      className="relative w-9 h-9 rounded-full border-2 object-cover shadow-soft"
                      style={{ borderColor: TIER_INFO[currentUser.tier].color }}
                    />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {displayName}
                    </p>
                    <p className="text-xs font-medium bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                      {currentUser.points.toLocaleString()}P
                    </p>
                  </div>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100/80 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="relative px-5 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 transition-transform group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                  로그인
                </span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  isActive(link.path)
                    ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {currentUser && (
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  isActive('/messages')
                    ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">💌</span>
                쪽지함
                {unreadMessages > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            )}
            {currentUser?.isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all ${
                  isActive('/admin')
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600'
                    : 'text-amber-500 hover:bg-amber-50'
                }`}
              >
                <span className="text-lg">⚙️</span>
                관리자
              </Link>
            )}
            {currentUser && (
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="px-4 py-3.5 mt-2 text-left text-sm font-medium text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-all border-t border-slate-100 pt-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
