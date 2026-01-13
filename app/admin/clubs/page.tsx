"use client"

import { useState } from "react"
import { mockClubs } from "@/data/mock-data"
import type { Club } from "@/types"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react"

export default function ManageClubsPage() {
  const [clubs, setClubs] = useState<Club[]>(mockClubs)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [deleteClub, setDeleteClub] = useState<Club | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    facultyLead: "",
    isRecruiting: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const categories = ["Technology", "Engineering", "Literary", "Arts", "Business", "Sports"]

  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = "Club name is required"
    if (!formData.description.trim()) errors.description = "Description is required"
    if (!formData.category) errors.category = "Category is required"
    if (!formData.facultyLead.trim()) errors.facultyLead = "Faculty lead is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateClub = () => {
    if (!validateForm()) return

    const newClub: Club = {
      id: `c${Date.now()}`,
      ...formData,
      memberCount: 0,
      image: `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(formData.name)}`,
    }
    setClubs([...clubs, newClub])
    setIsCreateOpen(false)
    resetForm()
  }

  const handleEditClub = () => {
    if (!validateForm() || !editingClub) return

    setClubs(clubs.map((club) => (club.id === editingClub.id ? { ...club, ...formData } : club)))
    setEditingClub(null)
    resetForm()
  }

  const handleDeleteClub = () => {
    if (!deleteClub) return
    setClubs(clubs.filter((club) => club.id !== deleteClub.id))
    setDeleteClub(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      facultyLead: "",
      isRecruiting: true,
    })
    setFormErrors({})
  }

  const openEditDialog = (club: Club) => {
    setFormData({
      name: club.name,
      description: club.description,
      category: club.category,
      facultyLead: club.facultyLead,
      isRecruiting: club.isRecruiting,
    })
    setEditingClub(club)
  }

  const ClubForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Club Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter club name"
          className="bg-background border-input"
        />
        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the club's activities and goals"
          className="bg-background border-input min-h-[100px]"
        />
        {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category" className="text-foreground">
          Category
        </Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger className="bg-background border-input">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="facultyLead" className="text-foreground">
          Faculty Lead
        </Label>
        <Input
          id="facultyLead"
          value={formData.facultyLead}
          onChange={(e) => setFormData({ ...formData, facultyLead: e.target.value })}
          placeholder="Enter faculty lead name"
          className="bg-background border-input"
        />
        {formErrors.facultyLead && <p className="text-sm text-destructive">{formErrors.facultyLead}</p>}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
        <div>
          <Label htmlFor="isRecruiting" className="text-foreground">
            Recruitment Status
          </Label>
          <p className="text-sm text-muted-foreground">Enable if the club is currently recruiting new members</p>
        </div>
        <Switch
          id="isRecruiting"
          checked={formData.isRecruiting}
          onCheckedChange={(checked) => setFormData({ ...formData, isRecruiting: checked })}
        />
      </div>
      <DialogFooter>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Clubs</h1>
          <p className="text-muted-foreground">Create, edit, and manage college clubs</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Club</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new club to the college club directory
              </DialogDescription>
            </DialogHeader>
            <ClubForm onSubmit={handleCreateClub} submitLabel="Create Club" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-input pl-9"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClubs.map((club) => (
          <Card key={club.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground">{club.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge variant={club.isRecruiting ? "success" : "default"}>
                      {club.isRecruiting ? "Recruiting" : "Not Recruiting"}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">{club.category}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(club)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit club</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteClub(club)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete club</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{club.facultyLead}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {club.memberCount}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No clubs found</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClub}
        onOpenChange={(open) => {
          if (!open) {
            setEditingClub(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Club</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update club information</DialogDescription>
          </DialogHeader>
          <ClubForm onSubmit={handleEditClub} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteClub}
        onOpenChange={(open) => !open && setDeleteClub(null)}
        title="Delete Club"
        description={`Are you sure you want to delete "${deleteClub?.name}"? This action cannot be undone and will remove all associated recruitment events.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteClub}
        variant="destructive"
      />
    </div>
  )
}
