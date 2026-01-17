"use client"

import { useRef, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getClubs, createClub, updateClub, deleteClub as deleteClubService } from "@/lib/db/clubs"
import { assignClubToUserByEmail } from "@/lib/db/users"
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
import { Plus, Pencil, Trash2, Search, Users, Upload, X } from "lucide-react"

export default function ManageClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [deleteClub, setDeleteClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()

  useEffect(() => {
    fetchClubs()
  }, [user])

  const fetchClubs = async () => {
    setLoading(true)
    let fetchedClubs = await getClubs()
    
    // RBAC: If club_admin, only show managed club
    if (user?.role === "club_admin" && user.managedClubId) {
       fetchedClubs = fetchedClubs.filter(club => club.id === user.managedClubId)
    }

    setClubs(fetchedClubs)
    setLoading(false)
  }

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    facultyLead: "",
    isRecruiting: true,
    adminEmail: "",
    websiteUrl: "",
    memberCount: 0,
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
    
    // Admin email is required for creation, but optional for editing (keeps existing)
    if (!editingClub && !formData.adminEmail.trim()) {
        errors.adminEmail = "Club Admin Email is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }


  const handleCreateClub = async () => {
    if (!validateForm()) return

    // Base64 Image Logic
    // If imagePreview starts with data:, it's a new base64 image. 
    // Otherwise check if it's a placeholdder or existing URL (if we supported hybrid, but now we just use base64 or placeholder)
    
    let imageUrl = imagePreview || `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(formData.name)}`
    
    // Safety check: if it's too long (though input check handles it, good to catch here too if needed, but skipping for now)

    const newClub: Club = {
      id: `c${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      facultyLead: formData.facultyLead,
      isRecruiting: formData.isRecruiting,
      memberCount: formData.memberCount,
      image: imageUrl,
      adminEmail: formData.adminEmail,
      websiteUrl: formData.websiteUrl,
    }

    try {
      await createClub(newClub)
      
      const result = await assignClubToUserByEmail(formData.adminEmail, newClub.id)
      if (!result.success) {
          alert(result.message)
      }

      setClubs([...clubs, newClub])
      setIsCreateOpen(false)
      resetForm()
      alert("Club created successfully!")
    } catch (error) {
      console.error("Failed to create club", error)
      alert("Failed to create club")
    }
  }

  const handleEditClub = async () => {
    if (!validateForm() || !editingClub) return

    let imageUrl = editingClub.image
    
    // If imagePreview is different from existing image, use it (it's the new Base64)
    if (imagePreview && imagePreview !== editingClub.image) {
        imageUrl = imagePreview
    }

    // Determine final admin email to save
    // If user typed something, use it. If empty, keep existing.
    const finalAdminEmail = formData.adminEmail.trim() ? formData.adminEmail.trim() : editingClub.adminEmail

    try {
      await updateClub(editingClub.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        facultyLead: formData.facultyLead,
        isRecruiting: formData.isRecruiting,
        memberCount: formData.memberCount,
        image: imageUrl,
        adminEmail: finalAdminEmail,
        websiteUrl: formData.websiteUrl,
      })

      // Only assign admin if a new email was provided
      if (formData.adminEmail.trim()) {
          const result = await assignClubToUserByEmail(formData.adminEmail, editingClub.id)
          if (!result.success) {
              alert(result.message)
          }
      }
      
      setClubs(clubs.map((club) => (club.id === editingClub.id ? { ...club, ...formData, image: imageUrl, adminEmail: finalAdminEmail } : club)))
      setEditingClub(null)
      resetForm()
      // fetchClubs() - Removing to rely on optimistic update and avoid race conditions
      alert("Club updated successfully!")
    } catch (error: any) {
      console.error("Error updating club:", error)
      alert(`Failed to update club: ${error.message}`)
    }
  }

  const handleDeleteClub = async () => {
    if (!deleteClub) return
    
    try {
      await deleteClubService(deleteClub.id)
      setClubs(clubs.filter((club) => club.id !== deleteClub.id))
      setDeleteClub(null)
    } catch (error) {
       console.error("Failed to delete club", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      facultyLead: "",
      isRecruiting: true,
      adminEmail: "",
      websiteUrl: "",
      memberCount: 0,
    })
    setFormErrors({})
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openEditDialog = (club: Club) => {
    setFormData({
      name: club.name,
      description: club.description,
      category: club.category,
      facultyLead: club.facultyLead,
      isRecruiting: club.isRecruiting,
      adminEmail: club.adminEmail || "", 
      websiteUrl: club.websiteUrl || "",
      memberCount: club.memberCount || 0,
    })
    setImagePreview(club.image)
    setEditingClub(club)
  }


  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Clubs</h1>
          <p className="text-muted-foreground">Create, edit, and manage college clubs</p>
        </div>
        {user?.role === "admin" && (
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
            <ClubForm 
                onSubmit={handleCreateClub} 
                submitLabel="Create Club" 
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setSelectedImage={setSelectedImage}
                fileInputRef={fileInputRef}
                categories={categories}
            />
          </DialogContent>
        </Dialog>
        )}
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
                  {user?.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteClub(club)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete club</span>
                  </Button>
                  )}
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
          <ClubForm 
            onSubmit={handleEditClub} 
            submitLabel="Save Changes" 
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            setSelectedImage={setSelectedImage}
            fileInputRef={fileInputRef}
            categories={categories}
          />
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

interface ClubFormData {
  name: string
  description: string
  category: string
  facultyLead: string
  isRecruiting: boolean
  adminEmail: string
  websiteUrl: string
  memberCount: number
}

interface ClubFormProps {
  formData: ClubFormData
  setFormData: (data: ClubFormData) => void
  formErrors: Record<string, string>
  onSubmit: () => void
  submitLabel: string
  imagePreview: string | null
  setImagePreview: (url: string | null) => void
  setSelectedImage: (file: File | null) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  categories: string[]
}

function ClubForm({ 
  formData, 
  setFormData, 
  formErrors, 
  onSubmit, 
  submitLabel, 
  imagePreview, 
  setImagePreview, 
  setSelectedImage, 
  fileInputRef, 
  categories 
}: ClubFormProps) {
  return (
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
        <Label htmlFor="websiteUrl" className="text-foreground">
          Club Website URL (Optional)
        </Label>
        <Input
          id="websiteUrl"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
          placeholder="https://example.com"
          className="bg-background border-input"
        />
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
        <Label htmlFor="image" className="text-foreground">
          Club Image / Banner
        </Label>
        <div className="flex items-center gap-4">
            <div className="relative h-20 w-32 overflow-hidden rounded-md border border-border bg-muted">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <span className="text-xs">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
                <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                            if (file.size > 800 * 1024) { // 800KB limit for Firestore safety (1MB doc limit)
                                alert("File size too large! Please choose an image under 800KB.")
                                if (fileInputRef.current) fileInputRef.current.value = ""
                                return
                            }

                            const reader = new FileReader()
                            reader.onloadend = () => {
                                const base64String = reader.result as string
                                setSelectedImage(null) // Not storing File object anymore
                                setImagePreview(base64String) // Preview IS the data now
                            }
                            reader.readAsDataURL(file)
                        }
                    }}
                    className="bg-background border-input cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Upload a banner image (JPG, PNG). Max 800KB.
                </p>
            </div>
        </div>
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
      <div className="space-y-2">
        <Label htmlFor="memberCount" className="text-foreground">
          Member Count
        </Label>
        <Input
          id="memberCount"
          type="number"
          min="0"
          value={formData.memberCount}
          onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
          className="bg-background border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail" className="text-foreground">
          Club Admin Email
        </Label>
        <Input
          id="adminEmail"
          value={formData.adminEmail}
          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
          placeholder="Enter email to assign existing user as admin"
          className="bg-background border-input"
        />
        {formErrors.adminEmail && <p className="text-sm text-destructive">{formErrors.adminEmail}</p>}
        <p className="text-xs text-muted-foreground">
          Enter email to change/assign Club Admin (optional for edits).
        </p>
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
}
