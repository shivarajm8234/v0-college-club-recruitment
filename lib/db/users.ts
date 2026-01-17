
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import type { User } from "@/types"

export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      // Prioritize doc.id (Auth UID) over any 'id' field in the data
      return { ...docSnap.data(), id: docSnap.id } as User
    }
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function createUserProfile(user: User): Promise<void> {
  try {
    await setDoc(doc(db, "users", user.id), user)
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}


export async function getAllUsers(): Promise<User[]> {
  try {
    const q = query(collection(db, "users"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User))
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}


import { collection, getDocs, query, where, updateDoc } from "firebase/firestore"

export async function assignClubToUserByEmail(email: string, clubId: string): Promise<{ success: boolean; message: string }> {
  try {
    const q = query(collection(db, "users"), where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { success: false, message: "User with this email not found." }
    }

    const userDoc = querySnapshot.docs[0]
    await updateDoc(doc(db, "users", userDoc.id), {
      role: "club_admin",
      managedClubId: clubId
    })

    return { success: true, message: `Successfully assigned ${email} as admin for this club.` }
  } catch (error: any) {
    console.error("Error assigning club admin:", error)
    return { success: false, message: error.message }
  }
}
