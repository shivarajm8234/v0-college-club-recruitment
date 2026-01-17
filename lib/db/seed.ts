
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, writeBatch } from "firebase/firestore"
import { mockClubs, mockRecruitmentEvents, mockRegistrations, mockVenues, mockVenueSlots, mockNotifications, mockStudents, mockAdmins } from "@/data/mock-data"

export async function seedDatabase() {
  try {
    const batch = writeBatch(db)

    // Seed Users (Students and Admins)
    const allUsers = [...mockStudents, ...mockAdmins]
    allUsers.forEach((user) => {
      const ref = doc(db, "users", user.id) // Use user.id which matches the mock IDs. 
      // Note: In real app, ID should match Auth UID. 
      // The Setup page will handle mapping Auth UID to these profiles if we want consistency, 
      // but for simple seeding, we just dump the data.
      // ACTUALLY: For Auth to work with Firestore, the document ID MUST be the Auth UID.
      // So simply seeding 'users' here might generate documents with IDs 's1', 'a1' etc.
      // But when we create Auth users, they get random UIDs.
      // We need to coordinate this. 
      // Strategy: The seedDatabase function effectively only seeds DATA. 
      // The User creation needs to happen in the Setup page, and THEN we create the Firestore doc with the right UID.
      // So I will NOT seed users here blindly if I want them to match Auth.
      // However, for viewing data in Admin dashboard (e.g. lists of students), we might want them.
      // Let's seed them with their mock IDs for now so listings look populated, 
      // but the Setup page will be responsible for creating the ACTUAL login-able Admin profile.
      batch.set(ref, user)
    })

    // Seed Clubs
    mockClubs.forEach((club) => {
      const ref = doc(db, "clubs", club.id)
      batch.set(ref, club)
    })

    // Seed Events
    mockRecruitmentEvents.forEach((event) => {
      const ref = doc(db, "events", event.id)
      batch.set(ref, event)
    })

    // Seed Registrations
    mockRegistrations.forEach((reg) => {
      const ref = doc(db, "registrations", reg.id)
      // Remove deprecated fields if any
      const { ...cleanReg } = reg as any // Type assertion to bypass strict checks if mock data has extras
      batch.set(ref, cleanReg)
    })

    // Seed Venues
    mockVenues.forEach((venue) => {
      const ref = doc(db, "venues", venue.id)
      batch.set(ref, venue)
    })

    // Seed Venue Slots
    mockVenueSlots.forEach((slot, index) => {
      // Create a deterministic ID for slots since they don't have one in mock data?
      // Mock data slots might not have IDs. Let's check type.
      // If no ID, generate one.
      const slotId = `slot_${index}`
      const ref = doc(db, "venue_slots", slotId)
      batch.set(ref, slot)
    })

    // Seed Notifications
    mockNotifications.forEach((notif) => {
      const ref = doc(db, "notifications", notif.id)
      batch.set(ref, notif)
    })

    await batch.commit()
    console.log("Database seeded successfully")
    return true
  } catch (error) {
    console.error("Error seeding database:", error)
    return false
  }
}
