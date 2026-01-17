"use client"


import { useState, use, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { db, auth } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { getRegistrations, createRegistration, checkRegistration } from "@/lib/db/registrations"
import { getRecruitmentEvents } from "@/lib/db/events"

import type { Registration, Club, RecruitmentEvent } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore"
import {
  ArrowLeft,
  Users,
  User,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Info,
  Globe,
  FileQuestion
} from "lucide-react"

export default function ClubDetailClient({ 
  id, 
  initialClub, 
  initialEvents 
}: { 
  id: string, 
  initialClub: Club | null, 
  initialEvents: RecruitmentEvent[] 
}) {
  const { user } = useAuth()
  const router = useRouter()
  // ... existing state
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([])


  
  // New state for Event Detail Dialog
  const [selectedEvent, setSelectedEvent] = useState<RecruitmentEvent | null>(null)
  const [eventParticipants, setEventParticipants] = useState<Registration[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  const club = initialClub
  const [events, setEvents] = useState<RecruitmentEvent[]>(initialEvents)
  const [loadingEvents, setLoadingEvents] = useState(false)
  
  useEffect(() => {
    if (!id) return;
    
    setLoadingEvents(true)
    // Create query
    const q = query(collection(db, "events"), where("clubId", "==", id))
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const freshEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecruitmentEvent))
        setEvents(freshEvents)
        setLoadingEvents(false)
    }, (error) => {
        console.error("Error listening to event updates:", error)
        setLoadingEvents(false)
    })
    
    // Cleanup subscription
    return () => unsubscribe()
  }, [id])

  // Queries via userId (Auth UID) to match security rules
  useEffect(() => {
    if (user?.id) {
       getRegistrations(user.id).then(setUserRegistrations)
    }
  }, [user?.id, club?.id])

  const clubEvents = events
  const generalEvents = clubEvents.filter(e => e.eventType === "recruitment" || (!e.eventType && !e.quiz))
  const quizEvents = clubEvents.filter(e => e.eventType === "quiz" || (!!e.quiz && e.eventType !== "recruitment"))

  // Fetch participants when an event is selected (if permitted)
  useEffect(() => {
    if (selectedEvent && user) {
        setLoadingParticipants(true)
        const fetchParticipants = async () => {
            try {
                // This will fail for normal students due to security rules, which is expected.
                // Admin users or Club Admins for this club will succeed.
                const q = query(
                    collection(db, "registrations"), 
                    where("eventId", "==", selectedEvent.id)
                )
                const snapshot = await getDocs(q)
                const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration))
                setEventParticipants(participants)
            } catch (error) {
                // Determine if it's a permission error or something else
                // console.log("Could not fetch participants (likely restricted):", error)
                setEventParticipants([])
            } finally {
                setLoadingParticipants(false)
            }
        }
        fetchParticipants()
    } else {
        setEventParticipants([])
    }
  }, [selectedEvent, user])



  const getEventRegistrationStatus = (eventId: string) => {
    const existingReg = userRegistrations.find((r) => r.eventId === eventId)
    return existingReg
  }



  if (!club) {
     return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Club not found</h1>
          <Button asChild className="mt-4">
            <Link href="/student">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleRegister = async (eventId: string) => {
     // ... existing implementation
    if (!user) {
      router.push("/login/student")
      return
    }

    const existingRegistration = getEventRegistrationStatus(eventId)

    if (existingRegistration) {
      setErrorMessage(
        existingRegistration.status === "rejected"
          ? "Your previous registration was rejected. Please contact the club admin."
          : "You have already registered for this event.",
      )
      setRegistrationStatus("error")
      return
    }



    setIsRegistering(true)
    setRegistrationStatus("idle")
    setErrorMessage("")

    try {
      const realUid = auth.currentUser?.uid || user.id
      const isAlreadyRegisteredServer = await checkRegistration(realUid, eventId)
      
      if (isAlreadyRegisteredServer) {
         setErrorMessage("You have already registered for this event.")
         setRegistrationStatus("error")
         getRegistrations(realUid).then(setUserRegistrations)
         setIsRegistering(false)
         return
      }

      const event = clubEvents.find(e => e.id === eventId)
      
      const newRegistration: Registration = {
        id: `r_${eventId}_${realUid}`,
        userId: realUid, 
        studentId: realUid,
        studentName: user.name,
        studentEmail: user.email,
        eventId: eventId,
        status: "pending",
        registeredAt: new Date().toISOString(),
        department: "Computer Science", 
      }

      await createRegistration(newRegistration)
      setUserRegistrations([...userRegistrations, newRegistration])
      
      setIsRegistering(false)
      setRegistrationStatus("success")
      
      // Update participant list if dialog is open and user is admin
      if (selectedEvent?.id === eventId) {
          // Re-fetch handled by effect? No, only on mounting/change. 
          // Optimistic update for now or re-trigger?
          // Let's just re-fetch in effect if we add `userRegistrations` as dependency? 
          // No, separate query.
      }
      
    } catch (error) {
      console.error("Registration failed", error)
      setErrorMessage("Failed to register. Please try again.")
      setRegistrationStatus("error")
      setIsRegistering(false)
    }
  }

  return (
    <div className="container py-8">
      <Link
        href="/student"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Club Header */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
        {/* ... existing header code ... */}
        <div className="relative h-48 md:h-64">
          <Image 
            src={club.image ? (club.image.startsWith('http') || club.image.startsWith('/') || club.image.startsWith('data:') ? club.image : `/${club.image}`) : "/placeholder.svg"} 
            alt={club.name} 
            fill 
            className="object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <StatusBadge variant={club.isRecruiting ? "success" : "default"} className="mb-2">
              {club.isRecruiting ? "Recruiting" : "Not Recruiting"}
            </StatusBadge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{club.name}</h1>
          </div>
        </div>

        <div className="p-6">
          <p className="mb-6 text-muted-foreground">{club.description}</p>
          
          {club.recruitmentDetails && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
               <h3 className="font-semibold mb-2">Recruitment Process</h3>
               <p className="text-sm text-muted-foreground whitespace-pre-line">{club.recruitmentDetails}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Faculty Lead:</span>
              <span className="font-medium text-foreground">{club.facultyLead}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Members:</span>
              <span className="font-medium text-foreground">{club.memberCount}</span>
            </div>
            {/* Request to Join button removed */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {club.category}
              </span>
            </div>
          </div>
          
           {club.websiteUrl && (
             <div className="mt-6 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">Website:</span>
                <a href={club.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
                  {club.websiteUrl}
                </a>
             </div>
           )}
        </div>
      </div>

       {/* Registration Status Messages */}
       {registrationStatus === "success" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-400">Registration Successful!</p>
            <p className="text-sm text-emerald-400/80">
              You have been registered for the recruitment event. Check your email for confirmation.
            </p>
          </div>
        </div>
      )}

      {registrationStatus === "error" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Registration Failed</p>
            <p className="text-sm text-destructive/80">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Duplicate Registration Warning */}


      {/* Recruitment Tests / Quizzes */}
      {quizEvents.length > 0 && (
        <div className="mb-8">
           <h2 className="mb-4 text-xl font-semibold text-foreground">Recruitment Tests & Quizzes</h2>
           <div className="grid gap-4 md:grid-cols-2">
               {quizEvents.map(event => {
                   const registration = getEventRegistrationStatus(event.id)
                   const isRegistered = !!registration && registration.status !== "rejected"
                   
                   return (
                       <Card key={event.id} className="bg-card border-border">
                           <CardHeader>
                               <div className="flex items-center justify-between">
                                   <StatusBadge variant="default">Quiz</StatusBadge>
                                   <span className="text-sm text-foreground font-bold">{event.quiz?.totalMarks || 0} Marks</span>
                               </div>
                               <CardTitle className="text-foreground mt-2">{event.title}</CardTitle>
                               <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-4">
                               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <FileQuestion className="h-4 w-4" />
                                   <span>{event.quiz?.questions.length || 0} Questions</span>
                               </div>
                               
                               {!isRegistered ? (
                                   <Button asChild className="w-full" variant="default">
                                       <Link href={`/student/quiz?id=${event.id}`}>
                                           Take Quiz
                                       </Link>
                                   </Button>
                               ) : (
                                   <Button asChild className="w-full" variant="secondary">
                                       <Link href={`/student/quiz?id=${event.id}`}>
                                           Retake Quiz
                                       </Link>
                                   </Button>
                               )}
                           </CardContent>
                       </Card>
                   )
               })}
           </div>
        </div>
      )}

      {/* Recruitment Events */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Recruitment Events</h2>
        {generalEvents.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No recruitment events scheduled at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {generalEvents.map((event) => {
              const registration = getEventRegistrationStatus(event.id)
              const isRegistered = !!registration && registration.status !== "rejected"
              const isRejected = registration?.status === "rejected"
              const canRegister = !isRegistered && event.status === "upcoming"

              return (
                <div key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <Card className="bg-card border-border h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        variant={
                          event.status === "upcoming"
                            ? "success"
                            : event.status === "ongoing"
                              ? "warning"
                              : event.status === "cancelled"
                                ? "error"
                                : "default"
                        }
                      >
                        {event.status}
                      </StatusBadge>
                      <span className="text-sm text-muted-foreground">
                        {event.registeredCount}/{event.maxParticipants} registered
                      </span>
                    </div>
                    <CardTitle className="text-foreground">{event.title}</CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-foreground">{event.testDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Time:</span>
                        <span className="text-foreground">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Info className="h-4 w-4" />
                            <span className="text-xs">Click for details</span>
                         </div>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}> 
                    {/* Stop propagation so clicking button doesn't open modal again (though modal logic handles it) */}
                    {isRegistered ? (
                      <Button disabled className="w-full gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Already Registered ({registration.status})
                      </Button>
                    ) : isRejected ? (
                      <Button disabled variant="destructive" className="w-full gap-2">
                        <XCircle className="h-4 w-4" />
                        Registration Rejected
                      </Button>
                    ) : event.status !== "upcoming" ? (
                      <Button disabled variant="secondary" className="w-full">
                        Registration Closed
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRegister(event.id)}
                        disabled={isRegistering || !canRegister}
                        className="w-full"
                      >
                        {isRegistering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          "Register Now"
                        )}
                      </Button>
                    )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent?.title}</DialogTitle>
                <DialogDescription>
                    {selectedEvent?.clubName} • {selectedEvent?.status}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedEvent?.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Date</span>
                        <p className="flex items-center gap-2 text-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            {selectedEvent?.testDate}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Time</span>
                        <p className="flex items-center gap-2 text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            {selectedEvent?.time}
                        </p>
                    </div>
                     <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Venue</span>
                        <p className="flex items-center gap-2 text-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            {selectedEvent?.venue}
                        </p>
                    </div>
                     <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Participants</span>
                        <p className="flex items-center gap-2 text-foreground">
                            <Users className="h-4 w-4 text-primary" />
                            {selectedEvent?.registeredCount} / {selectedEvent?.maxParticipants}
                        </p>
                    </div>
                </div>

                {/* Registered Users List (Visible only if permitted) */}
                {eventParticipants.length > 0 && (
                    <div className="border-t border-border pt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Registered Participants</h3>
                        <div className="bg-muted/30 rounded-lg p-2 max-h-40 overflow-y-auto space-y-2">
                             {eventParticipants.map((p) => (
                                 <div key={p.id} className="text-sm flex justify-between items-center p-2 rounded hover:bg-muted/50">
                                     <div>
                                         <p className="font-medium">{p.studentName}</p>
                                         <p className="text-xs text-muted-foreground">{p.department}</p>
                                     </div>
                                      <StatusBadge variant={p.status === "approved" ? "success" : p.status === "rejected" ? "error" : "default"} className="text-xs py-0 px-2 h-5">
                                         {p.status}
                                     </StatusBadge>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}
                 
                 {/* Fallback msg if not admin (but we can't detect permission err easily in client generic catch, so optional) */}
                 {eventParticipants.length === 0 && user?.role === "admin" && (
                     <div className="text-sm text-muted-foreground italic">No participants found or visible.</div>
                 )}
                 
                 <div className="pt-4 flex justify-end">
                      {/* Duplicate action button inside dialog? Maybe redundancy is good. */}
                      {selectedEvent && (() => {
                          const event = selectedEvent;
                          const registration = getEventRegistrationStatus(event.id)
                          const isRegistered = !!registration && registration.status !== "rejected"
                          const isRejected = registration?.status === "rejected"
                          const canRegister = !isRegistered && event.status === "upcoming"
                          
                          if (isRegistered) return <Button disabled variant="outline">Already Registered</Button>
                          if (isRejected) return <Button disabled variant="destructive">Registration Rejected</Button>
                          if (event.status !== "upcoming") return <Button disabled>Closed</Button>
                          
                          return (
                              <Button onClick={() => handleRegister(event.id)} disabled={isRegistering}>
                                  {isRegistering ? "Registering..." : "Register Now"}
                              </Button>
                          )
                      })()}
                 </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
