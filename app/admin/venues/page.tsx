"use client"

import { useState } from "react"
import { mockVenues, mockVenueSlots } from "@/data/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Check, X, Calendar } from "lucide-react"

export default function VenuesPage() {
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [checkResult, setCheckResult] = useState<{
    checked: boolean
    available: boolean
    bookedBy?: string
  } | null>(null)

  const handleCheckAvailability = () => {
    if (!selectedVenue || !selectedDate) return

    // Find matching slot
    const slot = mockVenueSlots.find((s) => s.venueId === selectedVenue && s.date === selectedDate)

    if (slot) {
      setCheckResult({
        checked: true,
        available: slot.isAvailable,
        bookedBy: slot.bookedBy,
      })
    } else {
      // If no specific slot found, assume available
      setCheckResult({
        checked: true,
        available: true,
      })
    }
  }

  const selectedVenueData = mockVenues.find((v) => v.id === selectedVenue)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Venue Availability</h1>
        <p className="text-muted-foreground">Check and manage venue availability for events</p>
      </div>

      {/* Check Availability */}
      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Check Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-foreground">Select Venue</Label>
              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Choose a venue" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {mockVenues.map((venue) => (
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
            <div className="flex items-end">
              <Button onClick={handleCheckAvailability} disabled={!selectedVenue || !selectedDate} className="w-full">
                Check Availability
              </Button>
            </div>
          </div>

          {/* Result Display */}
          {checkResult?.checked && (
            <div
              className={`mt-6 flex items-center gap-4 rounded-lg border p-4 ${
                checkResult.available
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-destructive/50 bg-destructive/10"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  checkResult.available ? "bg-emerald-500/20" : "bg-destructive/20"
                }`}
              >
                {checkResult.available ? (
                  <Check className="h-6 w-6 text-emerald-400" />
                ) : (
                  <X className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{selectedVenueData?.name}</h3>
                  <StatusBadge variant={checkResult.available ? "success" : "error"}>
                    {checkResult.available ? "AVAILABLE" : "NOT AVAILABLE"}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedDate} • {selectedVenueData?.location}
                </p>
                {checkResult.bookedBy && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Currently booked by: <span className="text-foreground">{checkResult.bookedBy}</span>
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
        {mockVenues.map((venue) => {
          const venueSlots = mockVenueSlots.filter((s) => s.venueId === venue.id)
          const bookedSlots = venueSlots.filter((s) => !s.isAvailable).length
          const availableSlots = venueSlots.filter((s) => s.isAvailable).length

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

      {/* Upcoming Bookings */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Upcoming Bookings</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockVenueSlots
                .filter((slot) => !slot.isAvailable)
                .map((slot, index) => {
                  const venue = mockVenues.find((v) => v.id === slot.venueId)
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
