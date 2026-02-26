import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { POINT_VALUES } from '../types'
import { useBoardPosts } from '../hooks/useBoardPosts'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PostItem from '../components/common/PostItem'

export default function Introduction() {
  const { currentUser } = useAuth()
  const { posts, loading, error, reload } = useBoardPosts('introduction', 50)

  const hasIntroduction = posts.some((post) => post.authorId === currentUser?.uid)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">자기소개</h1>
          <p className="page-desc">동아리원들을 만나보세요</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && !hasIntroduction && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=introduction" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                자기소개 작성하기
                <span className="badge badge-gold ml-1">+{POINT_VALUES.INTRODUCTION}P</span>
              </Link>
            </div>
          )}

          {/* Error State */}
          {error ? (
            <ErrorMessage message={error} onRetry={reload} />
          ) : posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">👋</div>
              <p className="text-slate-500 mb-6">아직 자기소개가 없습니다</p>
              {currentUser && (
                <Link to="/write?category=introduction" className="btn btn-primary">
                  첫 자기소개 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div className="card">
              {posts.map((post, index) => (
                <PostItem key={post.id} post={post} isLast={index === posts.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
