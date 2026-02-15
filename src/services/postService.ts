import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage, functions } from '../config/firebase'
import { Post, Comment } from '../types'

const POSTS_COLLECTION = 'posts'

const createPostCallable = httpsCallable<
  { title: string; content: string; category: Post['category']; imageURL?: string | null },
  { postId: string }
>(functions, 'createPost')
const toggleLikeCallable = httpsCallable<{ postId: string }, { liked: boolean; likesCount: number }>(
  functions,
  'togglePostLike',
)
const addCommentCallable = httpsCallable<
  { postId: string; content: string },
  {
    comment: Omit<Comment, 'createdAt'> & { createdAt: number }
  }
>(functions, 'addPostComment')
const deleteCommentCallable = httpsCallable<{ postId: string; commentId: string }, { success: boolean }>(
  functions,
  'deletePostComment',
)
const deletePostCallable = httpsCallable<{ postId: string }, { success: boolean }>(functions, 'deletePost')

export interface PaginatedPosts {
  posts: Post[]
  cursor: QueryDocumentSnapshot<DocumentData> | null
}

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const timestamp = Date.now()
  const fileName = `posts/${userId}/${timestamp}_${file.name}`
  const storageRef = ref(storage, fileName)

  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function deletePostImage(imageURL: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageURL)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('이미지 삭제 실패:', error)
  }
}

export async function createPost(
  title: string,
  content: string,
  category: Post['category'],
  imageURL?: string,
): Promise<string> {
  const result = await createPostCallable({
    title,
    content,
    category,
    imageURL: imageURL || null,
  })
  return result.data.postId
}

function parsePost(docId: string, data: DocumentData): Post {
  return {
    id: docId,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    comments: Array.isArray(data.comments)
      ? data.comments.map((comment: Comment & { createdAt: Timestamp | Date }) => ({
          ...comment,
          createdAt:
            comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt),
        }))
      : [],
  } as Post
}

export async function getPosts(
  category?: Post['category'],
  pageSize = 30,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PaginatedPosts> {
  const constraints: QueryConstraint[] = []

  if (category) {
    constraints.push(where('category', '==', category))
  }
  constraints.push(orderBy('createdAt', 'desc'))
  constraints.push(limit(pageSize))
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const snapshot = await getDocs(query(collection(db, POSTS_COLLECTION), ...constraints))
  const posts = snapshot.docs.map((item) => parsePost(item.id, item.data()))
  const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return { posts, cursor: nextCursor }
}

export async function getPost(postId: string): Promise<Post | null> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null
  return parsePost(docSnap.id, docSnap.data())
}

export async function updatePost(
  postId: string,
  title: string,
  content: string,
  imageURL?: string | null,
): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId)
  const updateData: Record<string, unknown> = {
    title,
    content,
    updatedAt: Timestamp.now(),
  }

  if (imageURL !== undefined) {
    updateData.imageURL = imageURL
  }

  await updateDoc(docRef, updateData)
}

export async function deletePost(postId: string): Promise<void> {
  await deletePostCallable({ postId })
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  const response = await toggleLikeCallable({ postId })
  return response.data
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  const response = await addCommentCallable({ postId, content })
  return {
    ...response.data.comment,
    createdAt: new Date(response.data.comment.createdAt),
  }
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteCommentCallable({ postId, commentId })
}

export async function getUserPosts(
  userId: string,
  pageSize = 30,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
): Promise<PaginatedPosts> {
  const constraints: QueryConstraint[] = [where('authorId', '==', userId), orderBy('createdAt', 'desc'), limit(pageSize)]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const snapshot = await getDocs(query(collection(db, POSTS_COLLECTION), ...constraints))
  const posts = snapshot.docs.map((item) => parsePost(item.id, item.data()))
  const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return { posts, cursor: nextCursor }
}
