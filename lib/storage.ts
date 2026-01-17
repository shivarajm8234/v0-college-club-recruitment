
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export async function uploadImage(file: File, path: string): Promise<string> {
  if (!file) {
    throw new Error("No file provided")
  }

  // Create a unique filename if needed, or rely on path
  const storageRef = ref(storage, path)

  try {
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}
