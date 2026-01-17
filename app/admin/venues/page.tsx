"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getVenues, getVenueSlots, checkVenueAvailability, createVenue, updateVenue, deleteVenue, bookVenueSlot } from "@/lib/db/venues"
import type { Venue, VenueSlot } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Check, X, Calendar, Clock, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [venueSlots, setVenueSlots] = useState<VenueSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{
    checked: boolean
    available: boolean
    bookedBy?: string
  } | null>(null)

  const [clubs, setClubs] = useState<any[]>([]) // Need clubs to match name for RBAC
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // We need imports! (Will fixing next step)
    const { getClubs } = await import("@/lib/db/clubs") // Dynamic or add import at top
    
    const [fetchedVenues, fetchedSlots, fetchedClubs] = await Promise.all([
      getVenues(),
      getVenueSlots(),
      getClubs()
    ])
    setVenues(fetchedVenues)
    
    // RBAC: Show availability to all, but filter "Upcoming Bookings" list to only show relevant ones?
    // Actually, seeing availability is fine. But let's verify if they should see WHO booked it.
    // The prompt says "see their content only". 
    // If I see a slot is booked, I should probably know it's booked, but maybe not by whom if strict?
    // But for "Upcoming Bookings" list at the bottom, definitely only their own.
    
    setVenueSlots(fetchedSlots)
    setLoading(false)
  }

  const timeSlots = [
    "9:00 AM - 11:00 AM",
    "10:00 AM - 12:00 PM",
    "11:00 AM - 1:00 PM",
    "2:00 PM - 4:00 PM",
    "3:00 PM - 5:00 PM",
    "3:00 PM - 6:00 PM",
  ]

  const handleCheckAvailability = async () => {
    if (!selectedVenue || !selectedDate) return

    setIsChecking(true)
    setCheckResult(null)

    try {
      const result = await checkVenueAvailability(selectedVenue, selectedDate, selectedTime)
      
      setCheckResult({
        checked: true,
        available: result.available,
        bookedBy: result.bookedBy,
      })
    } catch (error) {
       console.error("Check failed", error)
    }
    
    setIsChecking(false)
  }

  const handleCreateVenue = async () => {
    if (!venueFormData.name || !venueFormData.location || venueFormData.capacity <= 0) {
        alert("Please fill all fields correctly")
        return
    }

    const newVenue: Venue = {
        id: `v${Date.now()}`,
        name: venueFormData.name,
        location: venueFormData.location,
        capacity: venueFormData.capacity
    }

    try {
        await createVenue(newVenue)
        setVenues([...venues, newVenue])
        setIsCreateVenueOpen(false)
        setVenueFormData({ name: "", location: "", capacity: 0 })
        alert("Venue created successfully!")
    } catch (error) {
        console.error("Failed to create venue", error)
        alert("Failed to create venue")
    }
  }

  const handleEditVenue = async () => {
    if (!editingVenue || !venueFormData.name) return

    try {
        await updateVenue(editingVenue.id, venueFormData)
        setVenues(venues.map(v => v.id === editingVenue.id ? { ...v, ...venueFormData } : v))
        setEditingVenue(null)
        setVenueFormData({ name: "", location: "", capacity: 0 })
        alert("Venue updated successfully!")
    } catch (error) {
        console.error("Failed to update venue", error)
        alert("Failed to update venue")
    }
  }

  const handleDeleteVenue = async () => {
    if (!deleteVenueState) return
    try {
        await deleteVenue(deleteVenueState.id)
        setVenues(venues.filter(v => v.id !== deleteVenueState.id))
        setDeleteVenueState(null)
    } catch (error) {
        console.error("Failed to delete venue", error)
    }
  }

  const handleBookSlot = async () => {
      // Manual booking by Admin
      if (!selectedVenue || !selectedDate || !selectedTime || !bookingReason) {
          alert("Please select venue, date, time and enter a reason")
          return
      }

      const newSlot: VenueSlot = {
          venueId: selectedVenue,
          date: selectedDate,
          time: selectedTime,
          isAvailable: false,
          bookedBy: bookingReason
      }

      try {
          await bookVenueSlot(newSlot)
          // Update local state? Complex with filtering mostly relying on fetch. 
          // For now, let's just re-fetch slots or push to state.
          setVenueSlots([...venueSlots, newSlot])
          alert("Slot blocked/booked successfully!")
          setBookingReason("")
      } catch (error) {
          console.error("Failed to book slot", error)
          alert("Failed to book slot")
      }
  }

  const openEditVenue = (venue: Venue) => {
      setVenueFormData({
          name: venue.name,
          location: venue.location,
          capacity: venue.capacity
      })
      setEditingVenue(venue)
  }

  const [isCreateVenueOpen, setIsCreateVenueOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [deleteVenueState, setDeleteVenueState] = useState<Venue | null>(null) // renamed to avoid conflict with import
  const [venueFormData, setVenueFormData] = useState({ name: "", location: "", capacity: 0 })
  const [bookingReason, setBookingReason] = useState("")

  const selectedVenueData = venues.find((v) => v.id === selectedVenue)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Venue Management</h1>
          <p className="text-muted-foreground">Manage venues and check availability</p>
        </div>
        {user?.role === "admin" && (
            <Dialog open={isCreateVenueOpen} onOpenChange={setIsCreateVenueOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Venue
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Add New Venue</DialogTitle>
                        <DialogDescription>Create a new venue for events</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Venue Name</Label>
                            <Input 
                                value={venueFormData.name} 
                                onChange={(e) => setVenueFormData({...venueFormData, name: e.target.value})}
                                placeholder="e.g. Main Auditorium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input 
                                value={venueFormData.location} 
                                onChange={(e) => setVenueFormData({...venueFormData, location: e.target.value})}
                                placeholder="e.g. Block A, 2nd Floor"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input 
                                type="number"
                                value={venueFormData.capacity} 
                                onChange={(e) => setVenueFormData({...venueFormData, capacity: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <Button onClick={handleCreateVenue} className="w-full">Create Venue</Button>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </div>

      {/* Check Availability */}
      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Check & Manage Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-foreground">Select Venue</Label>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Choose a venue" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Time Slot</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="any">Any time</SelectItem> 
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleCheckAvailability}
                disabled={!selectedVenue || !selectedDate || isChecking}
                className="flex-1 gap-2"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Check
                  </>
                ) : (
                  "Check"
                )}
              </Button>
            </div>
          </div>
          
          {/* Manual Blocking UI for Admin */}
          {user?.role === "admin" && checkResult?.checked && checkResult.available && selectedTime !== "any" && (
             <div className="mt-6 pt-4 border-t border-border">
                 <h3 className="text-sm font-semibold mb-2 text-foreground">Admin: Block this slot?</h3>
                 <div className="flex gap-2">
                     <Input 
                        placeholder="Reason / Event Name (e.g. Maintenance)" 
                        value={bookingReason}
                        onChange={(e) => setBookingReason(e.target.value)}
                        className="flex-1"
                     />
                     <Button variant="destructive" onClick={handleBookSlot}>Block Slot</Button>
                 </div>
             </div>
          )}

          {/* Result Display - Enhanced with clearer visual feedback */}
          {checkResult?.checked && (
            <div
              className={`mt-6 flex items-center gap-4 rounded-lg border-2 p-4 ${
                checkResult.available ? "border-emerald-500 bg-emerald-500/10" : "border-destructive bg-destructive/10"
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  checkResult.available ? "bg-emerald-500/20" : "bg-destructive/20"
                }`}
              >
                {checkResult.available ? (
                  <Check className="h-7 w-7 text-emerald-400" />
                ) : (
                  <X className="h-7 w-7 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">{selectedVenueData?.name}</h3>
                  <StatusBadge
                    variant={checkResult.available ? "success" : "error"}
                    className="text-sm font-bold px-3 py-1"
                  >
                    {checkResult.available ? "AVAILABLE" : "NOT AVAILABLE"}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedDate}
                  </span>
                  {selectedTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedTime}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedVenueData?.location}
                  </span>
                </div>
                {checkResult.bookedBy && (
                  <p className="mt-2 text-sm text-amber-400">
                    Currently booked by: <span className="font-medium">{checkResult.bookedBy}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Venues */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">All Venues</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => {
          const slots = venueSlots.filter((s) => s.venueId === venue.id)
          const bookedSlots = slots.filter((s) => !s.isAvailable).length
          const availableSlots = slots.filter((s) => s.isAvailable).length

          return (
            <Card key={venue.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{venue.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{venue.location}</p>
                    </div>
                  </div>
                  {user?.role === "admin" && (
                     <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditVenue(venue)}>
                             <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteVenueState(venue)}>
                             <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Capacity: <span className="text-foreground">{venue.capacity}</span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                    <p className="text-lg font-semibold text-emerald-400">{availableSlots}</p>
                    <p className="text-xs text-emerald-400/80">Available</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                    <p className="text-lg font-semibold text-amber-400">{bookedSlots}</p>
                    <p className="text-xs text-amber-400/80">Booked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingVenue} onOpenChange={(open) => !open && setEditingVenue(null)}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Venue</DialogTitle>
                    <DialogDescription className="text-muted-foreground">Modify venue details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Venue Name</Label>
                        <Input 
                            value={venueFormData.name} 
                            onChange={(e) => setVenueFormData({...venueFormData, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input 
                            value={venueFormData.location} 
                            onChange={(e) => setVenueFormData({...venueFormData, location: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input 
                            type="number"
                            value={venueFormData.capacity} 
                            onChange={(e) => setVenueFormData({...venueFormData, capacity: parseInt(e.target.value) || 0})}
                        />
                    </div>
                    <Button onClick={handleEditVenue} className="w-full">Save Changes</Button>
                </div>
            </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <ConfirmModal
         open={!!deleteVenueState}
         onOpenChange={(open) => !open && setDeleteVenueState(null)}
         title="Delete Venue"
         description={`Are you sure you want to delete "${deleteVenueState?.name}"?`}
         confirmLabel="Delete"
         onConfirm={handleDeleteVenue}
         variant="destructive"
      />

      {/* Upcoming Bookings */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Upcoming Bookings</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {venueSlots
                .filter((slot) => !slot.isAvailable)
                .filter((slot) => {
                     // Filter logic remains same
                     if (user?.role === "club_admin" && user.managedClubId) {
                         const myClub = clubs.find(c => c.id === user.managedClubId)
                         if (myClub) {
                             // Only show bookings by my club
                             return slot.bookedBy === myClub.name
                         }
                     }
                     return true
                })
                .map((slot, index) => {
                  const venue = venues.find((v) => v.id === slot.venueId)
                  return (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{venue?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {slot.date} • {slot.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge variant="warning">Booked</StatusBadge>
                        <p className="mt-1 text-sm text-muted-foreground">{slot.bookedBy}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
