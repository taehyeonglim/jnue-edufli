import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { POINT_VALUES, CATEGORY_INFO } from '../types'
import { useBoardPosts } from '../hooks/useBoardPosts'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import PostItem from '../components/common/PostItem'

export default function ResourcesBoard() {
  const { currentUser } = useAuth()
  const { posts, loading, error, reload } = useBoardPosts('resources', 50)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="text-3xl mb-2">{CATEGORY_INFO.resources.icon}</div>
          <h1 className="page-title">{CATEGORY_INFO.resources.name}</h1>
          <p className="page-desc">{CATEGORY_INFO.resources.description}</p>
        </div>
      </div>

      <div className="section">
        <div className="container-sm">
          {/* Action Bar */}
          {currentUser && (
            <div className="flex justify-end mb-6">
              <Link to="/write?category=resources" className="btn btn-accent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                자료 업로드
                <span className="badge badge-accent ml-1">+{POINT_VALUES.RESOURCE_UPLOAD}P</span>
              </Link>
            </div>
          )}

          {/* Error State */}
          {error ? (
            <ErrorMessage message={error} onRetry={reload} />
          ) : posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">{CATEGORY_INFO.resources.icon}</div>
              <p className="text-gray-500 mb-6">아직 등록된 자료가 없습니다</p>
              {currentUser && (
                <Link to="/write?category=resources" className="btn btn-accent">
                  첫 자료 업로드하기
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
