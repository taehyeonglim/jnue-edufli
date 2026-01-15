import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { GalleryImage } from '../types'

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as GalleryImage[]
}

export const uploadGalleryImage = async (
  file: File,
  title: string,
  description: string,
  userId: string,
  userName: string
): Promise<GalleryImage> => {
  // Upload image to storage
  const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`)
  await uploadBytes(storageRef, file)
  const imageURL = await getDownloadURL(storageRef)

  // Save to Firestore
  const docRef = await addDoc(collection(db, 'gallery'), {
    imageURL,
    title,
    description,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    imageURL,
    title,
    description,
    uploadedBy: userId,
    uploadedByName: userName,
    createdAt: new Date(),
  }
}

export const deleteGalleryImage = async (imageId: string, imageURL: string): Promise<void> => {
  // Delete from Firestore
  await deleteDoc(doc(db, 'gallery', imageId))

  // Delete from Storage
  try {
    const storageRef = ref(storage, imageURL)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Storage 삭제 실패:', error)
  }
}
