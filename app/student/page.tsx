"use client"

import { useState, useEffect } from "react"
import { getClubs } from "@/lib/db/clubs"
import { getRecruitmentEvents } from "@/lib/db/events"
import { getRegistrations } from "@/lib/db/registrations"
import type { Club, RecruitmentEvent, Registration } from "@/types"
import { useAuth } from "@/context/auth-context"
import { ClubCard } from "@/components/club-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Search, Building2, Calendar, Bell, Clock, MapPin, ArrowRight, CheckCircle2, FileQuestion } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [events, setEvents] = useState<RecruitmentEvent[]>([])
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
        const promises: any[] = [getClubs(), getRecruitmentEvents()]
        if (user) {
            promises.push(getRegistrations(user.id))
        }

      const [fetchedClubs, fetchedEvents, fetchedRegistrations] = await Promise.all(promises)
      setClubs(fetchedClubs)
      setEvents(fetchedEvents)
      if (fetchedRegistrations) {
          setMyRegistrations(fetchedRegistrations)
      }
      setLoading(false)
    }
    fetchData()
  }, [user])

  const categories = Array.from(new Set(clubs.map((club) => club.category)))

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || club.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Event Logic
  const joinedEventIds = new Set(myRegistrations.map(r => r.eventId))

  const joinedEvents = events
    .filter(event => joinedEventIds.has(event.id))
    .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())

  const availableEvents = events
    .filter((event) => event.status === "upcoming" && !joinedEventIds.has(event.id))
    .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
    .slice(0, 6) // Show top 6 available

  return (

    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}</h1>
          <p className="mt-1 text-muted-foreground">Discover clubs and register for upcoming recruitment events</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/profile">Manage Profile</Link>
        </Button>
      </div>

      {/* Search and Filter */}
      {/* My Schedule (Joined Events) */}
      {joinedEvents.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">My Schedule</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {joinedEvents.map((event) => (
                  <Card key={event.id} className="bg-card border-border border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <StatusBadge variant="success">Registered</StatusBadge>
                         <span className="text-xs text-muted-foreground">
                          {event.testDate}
                        </span>
                      </div>
                      <h3 className="mb-1 font-semibold text-foreground">{event.clubName}</h3>
                      <p className="mb-3 text-sm text-muted-foreground">{event.title}</p>
                      
                       <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{event.venue}</span>
                           <span className="mx-1">•</span>
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>{event.time}</span>
                          {event.quiz && (
                            <>
                              <span className="mx-1">•</span>
                              <FileQuestion className="h-3.5 w-3.5 text-primary" />
                              <span>{event.quiz.totalMarks} Marks</span>
                            </>
                          )}
                        </div>

                      <Button asChild size="sm" variant="outline" className="w-full gap-2 mb-2">
                        <Link href={`/student/clubs/${event.clubId}`}>
                          View Club Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {event.quiz && (
                          <Button asChild size="sm" className="w-full gap-2">
                              <Link href={`/student/quiz/${event.id}`}>
                                  <FileQuestion className="h-3.5 w-3.5" />
                                  Take Quiz
                              </Link>
                          </Button>
                      )}
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
      )}

      {/* Recommended / Available Events */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recommended For You</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableEvents.length === 0 ? (
               <p className="text-muted-foreground col-span-3 text-center py-8">No upcoming events available at the moment.</p>
          ) : (
          availableEvents.map((event) => {
            return (
              <Card key={event.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge variant={event.status === "upcoming" ? "default" : "info"}>{event.status}</StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {event.registeredCount}/{event.maxParticipants} spots filled
                    </span>
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{event.clubName}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">{event.title}</p>
                  <div className="mb-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{event.testDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{event.venue}</span>
                    </div>
                    {event.quiz && (
                       <div className="flex items-center gap-2">
                         <FileQuestion className="h-3.5 w-3.5 text-primary" />
                         <span>Quiz: {event.quiz.totalMarks} Marks</span>
                       </div>
                    )}
                  </div>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href={`/student/clubs/${event.clubId}`}>
                      View Details & Register
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">All Clubs</h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border-input pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "" : "bg-transparent"}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "" : "bg-transparent"}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {filteredClubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center mb-8">
          <p className="text-muted-foreground">No clubs found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
