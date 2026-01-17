"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Save, User } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    studentId: "",
  })

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        department: user.department || "",
        studentId: user.studentId || user.id, // Display ID or Fallback to Auth ID
      })
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setSuccess(false)

    try {
      const userRef = doc(db, "users", user.id)
      
      // Update only allowed fields
      await updateDoc(userRef, {
        name: formData.name,
        department: formData.department,
        // email and role are immutable here
      })

      setSuccess(true)
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
     return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
     )
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Link
        href="/student"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
             </div>
             <div>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your personal information and settings</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            {/* Read Only Fields */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <Input 
                    id="email" 
                    value={user.email} 
                    disabled 
                    className="bg-muted text-muted-foreground"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="role" className="text-muted-foreground">Account Role</Label>
                <Input 
                    id="role" 
                    value={user.role.toUpperCase()} 
                    disabled 
                    className="bg-muted text-muted-foreground"
                />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="studentId" className="text-muted-foreground">Student ID (Academic)</Label>
                <Input 
                    id="studentId" 
                    value={formData.studentId} 
                    disabled 
                    className="bg-muted text-muted-foreground font-mono"
                />
                <p className="text-xs text-muted-foreground">Contact admin to change your Student ID.</p>
            </div>

            {/* Editable Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department / Branch</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science"
                required
              />
            </div>

            {success && (
                <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-600 text-sm flex items-center justify-center">
                    Profile updated successfully!
                </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
