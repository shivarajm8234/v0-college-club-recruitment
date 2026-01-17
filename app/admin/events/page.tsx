"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getRecruitmentEvents, createEvent, updateEvent, deleteEvent as deleteEventService } from "@/lib/db/events"
import { getClubs } from "@/lib/db/clubs"
import { getVenues } from "@/lib/db/venues"
import type { RecruitmentEvent, Club, Venue } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Calendar, MapPin, Clock, Users } from "lucide-react"

export default function EventsPage() {
  const [events, setEvents] = useState<RecruitmentEvent[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    let [fetchedEvents, fetchedClubs, fetchedVenues] = await Promise.all([
      getRecruitmentEvents(),
      getClubs(),
      getVenues()
    ])

    // RBAC: If club_admin, filter events and clubs
    if (user?.role === "club_admin" && user.managedClubId) {
       fetchedEvents = fetchedEvents.filter(e => e.clubId === user.managedClubId)
       fetchedClubs = fetchedClubs.filter(c => c.id === user.managedClubId)
    }

    setEvents(fetchedEvents)
    setClubs(fetchedClubs)
    setVenues(fetchedVenues)
    setLoading(false)
  }
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RecruitmentEvent | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<RecruitmentEvent | null>(null)

  const [formData, setFormData] = useState({
    clubId: "",
    title: "",
    testDate: "",
    venue: "",
    venueId: "", // NEW: Store ID for booking
    time: "",
    description: "",
    maxParticipants: 50,
    status: "upcoming" as RecruitmentEvent["status"],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.clubId) errors.clubId = "Club is required"
    if (!formData.title.trim()) errors.title = "Title is required"
    if (!formData.testDate) errors.testDate = "Date is required"
    if (!formData.venue) errors.venue = "Venue is required"
    if (!formData.time.trim()) errors.time = "Time is required"
    if (!formData.description.trim()) errors.description = "Description is required"
    if (formData.maxParticipants < 1) errors.maxParticipants = "Must be at least 1"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateForm()) return
    const club = clubs.find((c) => c.id === formData.clubId)
    // Extra safety: ensure they can't create for others
    if (user?.role === "club_admin" && formData.clubId !== user.managedClubId) {
        alert("You can only create events for your managed club")
        return
    }

    const newEvent: RecruitmentEvent = {
      id: `e${Date.now()}`,
      ...formData,
      clubName: club?.name || "",
      registeredCount: 0,
    }

    try {
      await createEvent(newEvent)
      setEvents([...events, newEvent])
      setIsCreateOpen(false)
      resetForm()
      alert("Event created and venue slot booked successfully!")
    } catch (error: any) {
      console.error("Failed to create event", error)
      alert(error.message || "Failed to create event")
    }
  }

  const handleEdit = async () => {
    if (!validateForm() || !editingEvent) return
    const club = clubs.find((c) => c.id === formData.clubId)
    
    try {
      await updateEvent(editingEvent.id, { ...formData, clubName: club?.name || "" })
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id ? { ...event, ...formData, clubName: club?.name || "" } : event,
        ),
      )
      setEditingEvent(null)
      resetForm()
    } catch (error) {
       console.error("Failed to update event", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteEvent) return
    
    try {
      await deleteEventService(deleteEvent.id)
      setEvents(events.filter((event) => event.id !== deleteEvent.id))
      setDeleteEvent(null)
    } catch (error) {
       console.error("Failed to delete event", error)
    }
  }

  const resetForm = () => {
    setFormData({
      clubId: user?.role === "club_admin" && user.managedClubId ? user.managedClubId : "",
      title: "",
      testDate: "",
      venue: "",
      venueId: "",
      time: "",
      description: "",
      maxParticipants: 50,
      status: "upcoming",
    })
    setFormErrors({})
  }

  const openEditDialog = (event: RecruitmentEvent) => {
    setFormData({
      clubId: event.clubId,
      title: event.title,
      testDate: event.testDate,
      venue: event.venue,
      time: event.time,
      description: event.description,
      maxParticipants: event.maxParticipants,
      maxParticipants: event.maxParticipants,
      status: event.status,
      venueId: event.venueId || "",
    })
    setEditingEvent(event)
  }

  const statusVariant = (status: RecruitmentEvent["status"]) => {
    switch (status) {
      case "upcoming":
        return "success"
      case "ongoing":
        return "warning"
      case "completed":
        return "info"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }


  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruitment Events</h1>
          <p className="text-muted-foreground">Create and manage recruitment events</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (open) resetForm()
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Recruitment Event</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Schedule a new recruitment event for a club
              </DialogDescription>
            </DialogHeader>
            <EventForm 
                onSubmit={handleCreate} 
                submitLabel="Create Event" 
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                clubs={clubs}
                venues={venues}
                userRole={user?.role}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <StatusBadge variant={statusVariant(event.status)}>{event.status}</StatusBadge>
                  </div>
                  <CardTitle className="text-lg text-foreground">{event.clubName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{event.title}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(event)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit event</span>
                  </Button>
                  {/* Allow delete for everyone for now, or restrict? Let's leave it open as Club Admin manages events */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteEvent(event)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete event</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{event.testDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {event.registeredCount}/{event.maxParticipants} registered
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEvent(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Event</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update event details</DialogDescription>
          </DialogHeader>
          <EventForm 
            onSubmit={handleEdit} 
            submitLabel="Save Changes" 
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            clubs={clubs}
            venues={venues}
            userRole={user?.role}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteEvent}
        onOpenChange={(open) => !open && setDeleteEvent(null)}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteEvent?.title}" for ${deleteEvent?.clubName}? This will also remove all registrations.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}

interface EventFormData {
  clubId: string
  title: string
  testDate: string
  venue: string
  venueId: string
  time: string
  description: string
  maxParticipants: number
  status: RecruitmentEvent["status"]
}

interface EventFormProps {
  formData: EventFormData
  setFormData: (data: EventFormData) => void
  formErrors: Record<string, string>
  onSubmit: () => void
  submitLabel: string
  clubs: Club[]
  venues: Venue[]
  userRole?: string
}

function EventForm({
  formData,
  setFormData,
  formErrors,
  onSubmit,
  submitLabel,
  clubs,
  venues,
  userRole
}: EventFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground">Club</Label>
        <Select 
          value={formData.clubId} 
          onValueChange={(value) => setFormData({ ...formData, clubId: value })}
          disabled={userRole === "club_admin"}
        >
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select club" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.clubId && <p className="text-sm text-destructive">{formErrors.clubId}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Event Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Spring Recruitment Drive"
          className="bg-background border-input"
        />
        {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground">Date</Label>
          <Input
            type="date"
            value={formData.testDate}
            onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
            className="bg-background border-input"
          />
          {formErrors.testDate && <p className="text-sm text-destructive">{formErrors.testDate}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Time</Label>
          <Input
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            placeholder="e.g., 10:00 AM - 12:00 PM"
            className="bg-background border-input"
          />
          {formErrors.time && <p className="text-sm text-destructive">{formErrors.time}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Venue</Label>
        <Select 
            value={formData.venueId || ""} 
            onValueChange={(value) => {
                const selectedVenue = venues.find(v => v.id === value)
                setFormData({ 
                    ...formData, 
                    venueId: value, 
                    venue: selectedVenue?.name || "" 
                })
            }}
        >
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name} (Capacity: {venue.capacity})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.venue && <p className="text-sm text-destructive">{formErrors.venue}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event..."
          className="bg-background border-input min-h-[80px]"
        />
        {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-foreground">Max Participants</Label>
          <Input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: Number.parseInt(e.target.value) || 0 })}
            className="bg-background border-input"
          />
          {formErrors.maxParticipants && <p className="text-sm text-destructive">{formErrors.maxParticipants}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as RecruitmentEvent["status"] })}
          >
            <SelectTrigger className="bg-background border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  )
}
