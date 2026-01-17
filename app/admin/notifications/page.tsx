"use client"

import { useState, useEffect } from "react"
import { getNotifications, createNotification } from "@/lib/db/notifications"
import { getClubs } from "@/lib/db/clubs"
import type { Notification, Club } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { Bell, Plus, Send, Users, Building2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [fetchedNotifications, fetchedClubs] = await Promise.all([
      getNotifications(),
      getClubs()
    ])
    setNotifications(fetchedNotifications)
    setClubs(fetchedClubs)
    setLoading(false)
  }
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetAudience: "all" as Notification["targetAudience"],
    clubId: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = "Title is required"
    if (!formData.message.trim()) errors.message = "Message is required"
    if (formData.targetAudience === "specific_club" && !formData.clubId) {
      errors.clubId = "Please select a club"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSendNotification = async () => {
    if (!validateForm()) return

    setIsSending(true)
    
    // In real app, we might call an API to send emails too
    
    const newNotification: Notification = {
      id: `n${Date.now()}`,
      title: formData.title,
      message: formData.message,
      targetAudience: formData.targetAudience,
      clubId: formData.clubId || undefined,
      sentAt: new Date().toISOString(),
      sentBy: user?.name || "Admin",
    }

    try {
      await createNotification(newNotification)
      setNotifications([newNotification, ...notifications])
      setIsSending(false)
      setSendSuccess(true)

      setTimeout(() => {
        setIsCreateOpen(false)
        setSendSuccess(false)
        resetForm()
      }, 1500)
    } catch (error) {
      console.error("Failed to send notification", error)
      setIsSending(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      targetAudience: "all",
      clubId: "",
    })
    setFormErrors({})
  }

  const getAudienceLabel = (audience: Notification["targetAudience"], clubId?: string) => {
    switch (audience) {
      case "all":
        return "All Students"
      case "registered":
        return "Registered Students"
      case "specific_club":
        const club = clubs.find((c) => c.id === clubId)
        return club ? `${club.name} Members` : "Specific Club"
      default:
        return audience
    }
  }

  const getAudienceCount = (audience: Notification["targetAudience"]) => {
    switch (audience) {
      case "all":
        return "~500 recipients"
      case "registered":
        return "~150 recipients"
      case "specific_club":
        return "~50 recipients"
      default:
        return ""
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Send announcements to students about recruitment events</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
              resetForm()
              setSendSuccess(false)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Send Notification</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create and send a notification to students
              </DialogDescription>
            </DialogHeader>

            {sendSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Send className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Notification Sent!</h3>
                <p className="text-sm text-muted-foreground">Your notification has been delivered successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                    className="bg-background border-input"
                  />
                  {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Message</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your message..."
                    className="bg-background border-input min-h-[120px]"
                  />
                  {formErrors.message && <p className="text-sm text-destructive">{formErrors.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        targetAudience: value as Notification["targetAudience"],
                        clubId: value !== "specific_club" ? "" : formData.clubId,
                      })
                    }
                  >
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          All Students
                        </div>
                      </SelectItem>
                      <SelectItem value="registered">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Registered Students Only
                        </div>
                      </SelectItem>
                      <SelectItem value="specific_club">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Specific Club
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{getAudienceCount(formData.targetAudience)}</p>
                </div>

                {formData.targetAudience === "specific_club" && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Select Club</Label>
                    <Select
                      value={formData.clubId}
                      onValueChange={(value) => setFormData({ ...formData, clubId: value })}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Choose a club" />
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
                )}

                <DialogFooter>
                  <Button onClick={handleSendNotification} disabled={isSending} className="gap-2">
                    {isSending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex gap-4 rounded-lg border border-border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <StatusBadge variant="info">
                      {getAudienceLabel(notification.targetAudience, notification.clubId)}
                    </StatusBadge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Sent by: {notification.sentBy}</span>
                    <span>
                      {new Date(notification.sentAt).toLocaleDateString()} at{" "}
                      {new Date(notification.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No notifications sent yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
