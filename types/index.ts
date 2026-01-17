export interface User {
  id: string
  email: string
  name: string
  role: "student" | "admin" | "club_admin"
  studentId?: string
  department?: string
  managedClubId?: string
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
  adminEmail?: string
  recruitmentDetails?: string
  websiteUrl?: string
}

export interface RecruitmentEvent {
  id: string
  clubId: string
  clubName: string
  title: string
  testDate: string
  venue: string
  venueId?: string // Optional for backward compatibility, but required for new events
  time: string
  description: string
  maxParticipants: number
  registeredCount: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  eventType: "recruitment" | "quiz"
  quiz?: Quiz
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctOptionIndex: number
  marks: number
}

export interface Quiz {
  title: string
  questions: QuizQuestion[]
  totalMarks: number
}

export interface Registration {
  id: string
  userId: string // Auth UID for security
  eventId: string
  studentId: string // Academic ID (display)
  studentName: string
  studentEmail: string
  department: string
  registeredAt: string
  status: "pending" | "approved" | "rejected"
  quizScore?: number
  quizSubmitted?: boolean
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
  userId?: string // For specific user targeting
  read?: boolean
}

export interface JoinRequest {
  id: string
  userId: string
  clubId: string
  studentName: string
  studentEmail: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
}
