import { useState, useEffect, useCallback } from 'react'
import { getPosts } from '../services/postService'
import { Post, CategoryType } from '../types'

interface UseBoardPostsReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useBoardPosts(category: CategoryType, pageSize = 50): UseBoardPostsReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { posts: data } = await getPosts(category, pageSize)
      setPosts(data)
    } catch (err) {
      console.error('게시글 로딩 실패:', err)
      setError('게시글을 불러오는 데 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [category, pageSize])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  return { posts, loading, error, reload: loadPosts }
}
