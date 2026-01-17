import { db } from "@/lib/firebase"
import { collection, getDocs, doc, query, where, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { checkVenueAvailability, bookVenueSlot } from "@/lib/db/venues"
import type { RecruitmentEvent, VenueSlot } from "@/types"

export async function getRecruitmentEvents(clubId?: string): Promise<RecruitmentEvent[]> {
  try {
    let q = query(collection(db, "events"))
    
    if (clubId) {
      q = query(collection(db, "events"), where("clubId", "==", clubId))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecruitmentEvent))
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export async function createEvent(event: RecruitmentEvent): Promise<void> {
  try {
    // 1. Check Availability (only if venueId is provided)
    if (event.venueId) {
        const check = await checkVenueAvailability(event.venueId, event.testDate, event.time)
        if (!check.available) {
            throw new Error(`Venue is already booked by ${check.bookedBy || 'another event'}`)
        }
    }

    // 2. Create Event
    await setDoc(doc(db, "events", event.id), event)
    
    // 3. Book Venue Slot (if venueId provided)
    if (event.venueId) {
        const slot: VenueSlot = {
            venueId: event.venueId,
            date: event.testDate,
            time: event.time,
            isAvailable: false,
            bookedBy: event.clubName
        }
        await bookVenueSlot(slot)
    }

  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export async function updateEvent(id: string, data: Partial<RecruitmentEvent>): Promise<void> {
  try {
    const docRef = doc(db, "events", id)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "events", id))
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}
