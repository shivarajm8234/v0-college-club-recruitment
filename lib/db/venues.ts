import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import type { Venue, VenueSlot } from "@/types"

export async function getVenues(): Promise<Venue[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "venues"))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue))
  } catch (error) {
    console.error("Error fetching venues:", error)
    return []
  }
}

export async function getVenueSlots(venueId?: string): Promise<VenueSlot[]> {
  try {
    let q = query(collection(db, "venue_slots"))
    if (venueId) {
      q = query(collection(db, "venue_slots"), where("venueId", "==", venueId))
    }
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as VenueSlot)
  } catch (error) {
    console.error("Error fetching venue slots:", error)
    return []
  }
}

export async function checkVenueAvailability(venueId: string, date: string, time?: string): Promise<{ available: boolean, bookedBy?: string }> {
  try {
    let q = query(
      collection(db, "venue_slots"), 
      where("venueId", "==", venueId),
      where("date", "==", date)
    )
    
    if (time && time !== "any") {
      q = query(q, where("time", "==", time))
    }

    const querySnapshot = await getDocs(q)
    const slots = querySnapshot.docs.map(doc => doc.data() as VenueSlot)
    
    // If we found any booked slot that matches
    const bookedSlot = slots.find(slot => !slot.isAvailable)
    
    if (bookedSlot) {
      return { available: false, bookedBy: bookedSlot.bookedBy }
    }
    
    return { available: true }
  } catch (error) {
    console.error("Error checking availability:", error)
    return { available: false } // Fail safe
  }
}

export async function createVenue(venue: Venue): Promise<void> {
  try {
    await setDoc(doc(db, "venues", venue.id), venue)
  } catch (error) {
    console.error("Error creating venue:", error)
    throw error
  }
}

export async function updateVenue(id: string, data: Partial<Venue>): Promise<void> {
  try {
    const docRef = doc(db, "venues", id)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Error updating venue:", error)
    throw error
  }
}

export async function deleteVenue(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "venues", id))
  } catch (error) {
    console.error("Error deleting venue:", error)
    throw error
  }
}

export async function bookVenueSlot(slot: VenueSlot): Promise<void> {
  try {
    // Unique ID for the slot: venueId_date_time (sanitize time)
    // Actually, let's use a composite key or just auto-id?
    // Using composite key ensures valid uniqueness check at write time
    const slotId = `${slot.venueId}_${slot.date}_${slot.time.replace(/[:\s]/g, '-')}`
    await setDoc(doc(db, "venue_slots", slotId), slot)
  } catch (error) {
    console.error("Error booking venue slot:", error)
    throw error
  }
}
