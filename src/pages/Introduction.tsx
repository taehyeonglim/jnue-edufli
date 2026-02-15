import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPosts } from '../services/postService'
import { Post, POINT_VALUES } from '../types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PostItem from '../components/common/PostItem'

export default function Introduction() {
  const { currentUser } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { posts: data } = await getPosts('introduction', 50)
      setPosts(data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

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

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">👋</div>
              <p className="text-gray-500 mb-6">아직 자기소개가 없습니다</p>
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
