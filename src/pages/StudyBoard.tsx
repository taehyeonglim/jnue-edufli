import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { POINT_VALUES, CATEGORY_INFO } from '../types'
import { useBoardPosts } from '../hooks/useBoardPosts'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PostItem from '../components/common/PostItem'

export default function StudyBoard() {
  const { currentUser } = useAuth()
  const { posts, loading, error, reload } = useBoardPosts('study', 50)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="text-3xl mb-2">{CATEGORY_INFO.study.icon}</div>
          <h1 className="page-title">{CATEGORY_INFO.study.name}</h1>
          <p className="page-desc">{CATEGORY_INFO.study.description}</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=study" className="btn btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                글쓰기
                <span className="badge badge-primary ml-1">+{POINT_VALUES.POST}P</span>
              </Link>
            </div>
          )}

          {/* Error State */}
          {error ? (
            <ErrorMessage message={error} onRetry={reload} />
          ) : posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">{CATEGORY_INFO.study.icon}</div>
              <p className="text-gray-500 mb-6">아직 게시글이 없습니다</p>
              {currentUser && (
                <Link to="/write?category=study" className="btn btn-primary">
                  첫 글 작성하기
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
