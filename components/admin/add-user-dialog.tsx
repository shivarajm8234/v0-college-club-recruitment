"use client"

import { useState } from "react"
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { createUserProfile } from "@/lib/db/users"
import { getClubs } from "@/lib/db/clubs"
import type { Club, User } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"

// Reuse config but ensure we don't conflict with main app
const firebaseConfig = {
  apiKey: "AIzaSyCaTCtZu8i-edyo2y6O0T92B3jRCEGUDrM",
  authDomain: "clubrecruitmentmanagement.firebaseapp.com",
  projectId: "clubrecruitmentmanagement",
  storageBucket: "clubrecruitmentmanagement.firebasestorage.app",
  messagingSenderId: "582750387246",
  appId: "1:582750387246:web:6ede84d8fd4f720ceeb3bf",
  measurementId: "G-0887NMLXDB"
};

export function AddUserDialog({ onUserAdded }: { onUserAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [role, setRole] = useState<"student" | "admin" | "club_admin">("student")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    studentId: "",
    department: "",
    managedClubId: "",
  })

  // Fetch clubs when opening dialog if role is club_admin
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      const fetchedClubs = await getClubs()
      setClubs(fetchedClubs)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Initialize a secondary app to create user without logging out current admin
      const secondaryAppName = "secondaryApp"
      let secondaryApp
      try {
        secondaryApp = getApp(secondaryAppName)
      } catch (e) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName)
      }

      const secondaryAuth = getAuth(secondaryApp)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password)
      
      // We must sign out from the secondary app immediately so it doesn't interfere (though it shouldn't affect main auth)
      await signOut(secondaryAuth)
      
       // Clean up the secondary app
      // Note: deleteApp is async.
      // Ideally we reuse it, but for cleanliness we can delete it. 
      // Reuse pattern is better if we expect frequent creates, but strictly 'deleteApp' is safer to prevent memory leaks if used infrequently.
      // Let's keep it simple: create, use, delete.
      await deleteApp(secondaryApp)


      const newUser: User = {
        id: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: role,
        studentId: role === "student" ? formData.studentId : undefined,
        department: role === "student" ? formData.department : undefined,
        managedClubId: role === "club_admin" ? formData.managedClubId : undefined,
      }

      await createUserProfile(newUser)
      
      setOpen(false)
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        studentId: "",
        department: "",
        managedClubId: "",
      })
      onUserAdded()

    } catch (error: any) {
      console.error("Error creating user:", error)
      alert(`Failed to create user: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. They will be able to log in immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">System Admin</SelectItem>
                <SelectItem value="club_admin">Club Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {role === "student" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input 
                  id="studentId" 
                  required 
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  required 
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                />
              </div>
            </>
          )}

          {role === "club_admin" && (
            <div className="space-y-2">
              <Label>Managed Club</Label>
              <Select 
                value={formData.managedClubId} 
                onValueChange={(v) => setFormData({...formData, managedClubId: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
