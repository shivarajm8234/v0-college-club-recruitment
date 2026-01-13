"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { mockClubs, mockRecruitmentEvents, mockRegistrations } from "@/data/mock-data"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
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
} from "lucide-react"

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const club = mockClubs.find((c) => c.id === id)
  const clubEvents = mockRecruitmentEvents.filter((e) => e.clubId === id)

  // Check if user has already registered for any event from this club
  const userRegistrations = mockRegistrations.filter((r) => r.studentId === user?.studentId)

  const getEventRegistrationStatus = (eventId: string) => {
    const existingReg = userRegistrations.find((r) => r.eventId === eventId)
    return existingReg
  }

  const isAlreadyRegisteredForClub = clubEvents.some((event) =>
    userRegistrations.some((r) => r.eventId === event.id && r.status !== "rejected"),
  )

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

    if (isAlreadyRegisteredForClub) {
      setErrorMessage(
        "You have already registered for another event from this club. Multiple registrations for the same club are not allowed.",
      )
      setRegistrationStatus("error")
      return
    }

    setIsRegistering(true)
    setRegistrationStatus("idle")
    setErrorMessage("")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsRegistering(false)
    setRegistrationStatus("success")
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
        <div className="relative h-48 md:h-64">
          <Image src={club.image || "/placeholder.svg"} alt={club.name} fill className="object-cover" />
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
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {club.category}
              </span>
            </div>
          </div>
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
      {isAlreadyRegisteredForClub && registrationStatus !== "error" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div>
            <p className="font-medium text-amber-400">Already Registered</p>
            <p className="text-sm text-amber-400/80">
              You have already registered for a recruitment event from this club. Multiple registrations are not
              allowed.
            </p>
          </div>
        </div>
      )}

      {/* Recruitment Events */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Recruitment Events</h2>
        {clubEvents.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No recruitment events scheduled at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {clubEvents.map((event) => {
              const registration = getEventRegistrationStatus(event.id)
              const isRegistered = !!registration && registration.status !== "rejected"
              const isRejected = registration?.status === "rejected"
              const canRegister = !isRegistered && !isAlreadyRegisteredForClub && event.status === "upcoming"

              return (
                <Card key={event.id} className="bg-card border-border">
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
                    <CardDescription className="text-muted-foreground">{event.description}</CardDescription>
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
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Venue:</span>
                        <span className="text-foreground">{event.venue}</span>
                      </div>
                    </div>

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
                    ) : isAlreadyRegisteredForClub ? (
                      <Button disabled variant="secondary" className="w-full gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Already Registered for Club
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
