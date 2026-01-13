"use client"

import { useState } from "react"
import { mockClubs, mockRecruitmentEvents } from "@/data/mock-data"
import { useAuth } from "@/context/auth-context"
import { ClubCard } from "@/components/club-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Search, Building2, Calendar, Bell } from "lucide-react"
import Link from "next/link"

export default function StudentDashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(new Set(mockClubs.map((club) => club.category)))

  const filteredClubs = mockClubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || club.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const upcomingEvents = mockRecruitmentEvents.filter((event) => event.status === "upcoming").slice(0, 3)

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-muted-foreground">Discover clubs and register for upcoming recruitment events</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockClubs.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockClubs.filter((c) => c.isRecruiting).length} currently recruiting
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Recruitment drives this month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground">New announcements</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Quick View */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Upcoming Recruitment Events</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/events">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <StatusBadge variant="success">{event.status}</StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {event.registeredCount}/{event.maxParticipants} registered
                  </span>
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{event.clubName}</h3>
                <p className="mb-2 text-sm text-muted-foreground">{event.title}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>📅 {event.testDate}</p>
                  <p>🕐 {event.time}</p>
                  <p>📍 {event.venue}</p>
                </div>
              </CardContent>
            </Card>
          ))}
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
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No clubs found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
