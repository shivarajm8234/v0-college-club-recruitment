
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, query, where, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore"
import type { Registration, Notification } from "@/types"

// Legacy: querying by studentId because that's what the security rules allow reading for "own" data
export async function getRegistrations(userId?: string, eventId?: string): Promise<Registration[]> {
  try {
    let q = query(collection(db, "registrations"))
    
    if (userId) {
      q = query(q, where("userId", "==", userId))
    }
    if (eventId) {
      q = query(q, where("eventId", "==", eventId))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration))
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return []
  }
}

export async function createRegistration(registration: Registration): Promise<void> {
  try {
    // We rely on the composite ID (r_eventId_userId) to ensure uniqueness (idempotent write)
    await setDoc(doc(db, "registrations", registration.id), registration)
    
    // Also update the User document to include this event ID in a list.
    // We wrap this in a separate try-catch so that if it fails (e.g. user doc missing),
    // the registration itself still succeeds.
    try {
      const userRef = doc(db, "users", registration.userId)
      await updateDoc(userRef, {
          registeredEventIds: arrayUnion(registration.eventId)
      })
    } catch (updateError) {
      console.warn("Could not update user profile with registered event:", updateError)
      // We do NOT throw here, allowing the registration to complete
    }

    // Increment registeredCount for the event
    try {
      const eventRef = doc(db, "events", registration.eventId)
      await updateDoc(eventRef, {
        registeredCount: increment(1)
      })
    } catch (countError) {
      console.error("Error updating event registration count:", countError)
    }
  } catch (error) {
    console.error("Error creating registration:", error)
    throw error
  }
}

export async function updateRegistrationStatus(id: string, status: Registration["status"]): Promise<void> {
  try {
    const docRef = doc(db, "registrations", id)
    // Get doc first to get userId and eventId
    const docSnap = await getDoc(docRef) // We need to read it to know WHO to notify
    if (!docSnap.exists()) throw new Error("Registration not found")
    
    const data = docSnap.data() as Registration
    
    await updateDoc(docRef, { status })
    
    // Create notification for the user
    if (status !== "pending") {
      const notification: Notification = {
        id: `n_${Date.now()}`,
        title: `Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your registration for checking event has been ${status}.`,
        targetAudience: "specific_user", // We might need to add this to types or interpret 'registered' differently
        userId: data.userId, // Add this specific field to target the user
        sentAt: new Date().toISOString(),
        sentBy: "system",
        read: false
      } as any // using any temporarily to bypass strict type check if needed, but better to update types
      
      await setDoc(doc(db, "notifications", notification.id), notification)
    }
  } catch (error) {
    console.error("Error updating registration status:", error)
    throw error
  }
}

export async function checkRegistration(studentId: string, eventId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "registrations"), 
      where("userId", "==", studentId), 
      where("eventId", "==", eventId)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking registration:", error)
    return false
  }
}
