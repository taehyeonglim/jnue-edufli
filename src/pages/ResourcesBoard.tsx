import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES, TIER_INFO, CATEGORY_INFO } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function ResourcesBoard() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await getPosts('resources')
      setPosts(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

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

          {/* Posts */}
          {posts.length === 0 ? (
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
            <div className="space-y-3">
              {posts.map((post) => (
                <ResourceItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourceItem({ post }: { post: Post }) {
  const tierInfo = TIER_INFO[post.authorTier] || TIER_INFO.bronze

  return (
    <Link
      to={`/post/${post.id}`}
      className="card card-hover p-4 flex items-center gap-4"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center shrink-0">
        <svg className="w-6 h-6 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate hover:text-[#14B8A6] transition-colors mb-1">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 truncate">{post.content}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm shrink-0">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-gray-500">{post.authorName}</span>
            <span style={{ color: tierInfo.color }}>{tierInfo.emoji}</span>
          </div>
          <span className="text-xs text-gray-500">{post.createdAt.toLocaleDateString('ko-KR')}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <span className="flex items-center gap-1">
            <span className="text-red-400">♥</span>
            <span>{post.likes.length}</span>
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span>
            <span>{post.comments.length}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
