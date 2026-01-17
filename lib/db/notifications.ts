
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore"
import type { Notification } from "@/types"

export async function getNotifications(): Promise<Notification[]> {
  try {
    // In a real app we might filter by user or club, but for now fetch all or for admin usage
    const querySnapshot = await getDocs(collection(db, "notifications"))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function createNotification(notification: Notification): Promise<void> {
  try {
    await setDoc(doc(db, "notifications", notification.id), notification)
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}
