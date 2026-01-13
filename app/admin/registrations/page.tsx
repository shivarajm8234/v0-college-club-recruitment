"use client"

import { useState } from "react"
import { mockRegistrations, mockRecruitmentEvents } from "@/data/mock-data"
import type { Registration } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Check, X, AlertTriangle } from "lucide-react"

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>(mockRegistrations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [rejectRegistration, setRejectRegistration] = useState<Registration | null>(null)

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || reg.status === statusFilter
    const matchesEvent = eventFilter === "all" || reg.eventId === eventFilter
    return matchesSearch && matchesStatus && matchesEvent
  })

  // Detect duplicates - same student registering multiple times for same event
  const getDuplicates = () => {
    const seen = new Map<string, string[]>()
    registrations.forEach((reg) => {
      const key = `${reg.studentId}-${reg.eventId}`
      if (!seen.has(key)) {
        seen.set(key, [])
      }
      seen.get(key)?.push(reg.id)
    })
    const duplicateIds = new Set<string>()
    seen.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicateIds.add(id))
      }
    })
    return duplicateIds
  }

  const duplicateIds = getDuplicates()

  const handleApprove = (id: string) => {
    setRegistrations(registrations.map((reg) => (reg.id === id ? { ...reg, status: "approved" } : reg)))
  }

  const handleReject = () => {
    if (!rejectRegistration) return
    setRegistrations(
      registrations.map((reg) => (reg.id === rejectRegistration.id ? { ...reg, status: "rejected" } : reg)),
    )
    setRejectRegistration(null)
  }

  const handleBulkRejectDuplicates = () => {
    setRegistrations(
      registrations.map((reg) =>
        duplicateIds.has(reg.id) && reg.status === "pending" ? { ...reg, status: "rejected" } : reg,
      ),
    )
  }

  const getEventName = (eventId: string) => {
    const event = mockRecruitmentEvents.find((e) => e.id === eventId)
    return event ? `${event.clubName} - ${event.title}` : eventId
  }

  const statusVariant = (status: Registration["status"]) => {
    switch (status) {
      case "approved":
        return "success"
      case "rejected":
        return "error"
      default:
        return "warning"
    }
  }

  const pendingDuplicates = Array.from(duplicateIds).filter(
    (id) => registrations.find((r) => r.id === id)?.status === "pending",
  ).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Student Registrations</h1>
        <p className="text-muted-foreground">Review and manage student registration requests</p>
      </div>

      {/* Warning Banner for Duplicates */}
      {pendingDuplicates > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">Duplicate Registrations Detected</p>
              <p className="text-sm text-amber-400/80">{pendingDuplicates} pending duplicate registration(s) found</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRejectDuplicates}
            className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 bg-transparent"
          >
            Reject All Duplicates
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-input pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-input w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="bg-background border-input w-full sm:w-60">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Events</SelectItem>
                {mockRecruitmentEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.clubName} - {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Registrations ({filteredRegistrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Student</TableHead>
                  <TableHead className="text-muted-foreground">Student ID</TableHead>
                  <TableHead className="text-muted-foreground">Department</TableHead>
                  <TableHead className="text-muted-foreground">Event</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => {
                  const isDuplicate = duplicateIds.has(reg.id)
                  return (
                    <TableRow key={reg.id} className={`border-border ${isDuplicate ? "bg-amber-500/5" : ""}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-foreground">{reg.studentName}</p>
                            <p className="text-sm text-muted-foreground">{reg.studentEmail}</p>
                          </div>
                          {isDuplicate && (
                            <StatusBadge variant="warning" className="text-[10px]">
                              Duplicate
                            </StatusBadge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{reg.studentId}</TableCell>
                      <TableCell className="text-muted-foreground">{reg.department}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {getEventName(reg.eventId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={statusVariant(reg.status)}>{reg.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                              onClick={() => handleApprove(reg.id)}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRejectRegistration(reg)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No registrations found matching your criteria</div>
          )}
        </CardContent>
      </Card>

      {/* Reject Confirmation */}
      <ConfirmModal
        open={!!rejectRegistration}
        onOpenChange={(open) => !open && setRejectRegistration(null)}
        title="Reject Registration"
        description={`Are you sure you want to reject the registration from ${rejectRegistration?.studentName}? They will be notified of this decision.`}
        confirmLabel="Reject"
        onConfirm={handleReject}
        variant="destructive"
      />
    </div>
  )
}
