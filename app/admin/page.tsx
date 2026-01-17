"use client"

import { useState, useEffect } from "react"
import { getClubs, getClubById } from "@/lib/db/clubs"
import { getRecruitmentEvents } from "@/lib/db/events"
import { getRegistrations } from "@/lib/db/registrations"
import { seedDatabase } from "@/lib/db/seed"
import type { Club, RecruitmentEvent, Registration } from "@/types"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Building2, Calendar, Users, TrendingUp, Database } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [events, setEvents] = useState<RecruitmentEvent[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (user?.role === "club_admin" && user.managedClubId) {
        // Fetch only data for the managed club
        const [club, clubEvents] = await Promise.all([
          getClubById(user.managedClubId),
          getRecruitmentEvents(user.managedClubId),
        ])
        
        setClubs(club ? [club] : [])
        setEvents(clubEvents)
        
        
        // Fetch registrations for each event individually to respect security rules
        const registrationsPromises = clubEvents.map(event => getRegistrations(undefined, event.id))
        const registrationArrays = await Promise.all(registrationsPromises)
        const allRegistrations = registrationArrays.flat()
        
        setRegistrations(allRegistrations)
      } else {
        // Fetch all data for super admin
        const [fetchedClubs, fetchedEvents, fetchedRegistrations] = await Promise.all([
          getClubs(),
          getRecruitmentEvents(),
          getRegistrations()
        ])
        setClubs(fetchedClubs)
        setEvents(fetchedEvents)
        setRegistrations(fetchedRegistrations)
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch data", error)
    }
  }

  const handleSeed = async () => {
    if (!confirm("This will populate the database with mock data. Continue?")) return
    setIsSeeding(true)
    await seedDatabase()
    await fetchData()
    setIsSeeding(false)
  }

  const stats = {
    totalClubs: clubs.length,
    recruitingClubs: clubs.filter((c) => c.isRecruiting).length,
    upcomingEvents: events.filter((e) => e.status === "upcoming").length,
    totalRegistrations: registrations.length,
    pendingRegistrations: registrations.filter((r) => r.status === "pending").length,
  }

  const recentRegistrations = registrations
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here&apos;s an overview of the recruitment system.
          </p>
        </div>
        <Button onClick={handleSeed} disabled={isSeeding} variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          {isSeeding ? "Seeding..." : "Seed Database"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalClubs}</div>
            <p className="text-xs text-muted-foreground">{stats.recruitingClubs} actively recruiting</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Scheduled recruitment events</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingRegistrations}</div>
            <p className="text-xs text-muted-foreground">Registrations awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Registrations */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRegistrations.map((reg) => {
                const event = events.find((e) => e.id === reg.eventId)
                return (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{reg.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {event?.clubName} - {event?.title}
                      </p>
                    </div>
                    <StatusBadge
                      variant={reg.status === "approved" ? "success" : reg.status === "rejected" ? "error" : "warning"}
                    >
                      {reg.status}
                    </StatusBadge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events
                .filter((e) => e.status === "upcoming")
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{event.clubName}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.testDate} • {event.venue}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {event.registeredCount}/{event.maxParticipants}
                      </p>
                      <p className="text-xs text-muted-foreground">registered</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
