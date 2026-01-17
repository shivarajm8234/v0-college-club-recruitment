import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import type { Club } from "@/types"

export async function getClubs(): Promise<Club[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "clubs"))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club))
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return []
  }
}

export async function getClubById(id: string): Promise<Club | null> {
  try {
    const docRef = doc(db, "clubs", id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Club
    }
    return null
  } catch (error) {
    console.error("Error fetching club:", error)
    return null
  }
}

export async function createClub(club: Club): Promise<void> {
  try {
    await setDoc(doc(db, "clubs", club.id), club)
  } catch (error) {
    console.error("Error creating club:", error)
    throw error
  }
}

export async function updateClub(id: string, data: Partial<Club>): Promise<void> {
  try {
    const docRef = doc(db, "clubs", id)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Error updating club:", error)
    throw error
  }
}

export async function deleteClub(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "clubs", id))
  } catch (error) {
    console.error("Error deleting club:", error)
    throw error
  }
}
