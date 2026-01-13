export interface User {
  id: string
  email: string
  name: string
  role: "student" | "admin" | "club_admin"
  studentId?: string
  department?: string
}

export interface Club {
  id: string
  name: string
  description: string
  category: string
  facultyLead: string
  memberCount: number
  image: string
  isRecruiting: boolean
}

export interface RecruitmentEvent {
  id: string
  clubId: string
  clubName: string
  title: string
  testDate: string
  venue: string
  time: string
  description: string
  maxParticipants: number
  registeredCount: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
}

export interface Registration {
  id: string
  eventId: string
  studentId: string
  studentName: string
  studentEmail: string
  department: string
  registeredAt: string
  status: "pending" | "approved" | "rejected"
}

export interface Venue {
  id: string
  name: string
  capacity: number
  location: string
}

export interface VenueSlot {
  venueId: string
  date: string
  time: string
  isAvailable: boolean
  bookedBy?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  targetAudience: "all" | "registered" | "specific_club"
  clubId?: string
  sentAt: string
  sentBy: string
}
