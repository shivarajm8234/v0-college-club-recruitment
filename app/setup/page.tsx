"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { mockAdmins, mockStudents } from "@/data/mock-data"
import { seedDatabase } from "@/lib/db/seed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function SetupPage() {
  const [status, setStatus] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (msg: string) => setStatus(prev => [...prev, msg])

  const initializeSystem = async () => {
    setLoading(true)
    setStatus([])
    
    try {
      addLog("Starting initialization...")

      // 1. Create Admin Users (and seed data once logged in)

      // 2. Create Admin Users
      addLog("Creating Admin users...")
      for (const admin of mockAdmins) {
        try {
          // Check if we can login first (user exists)
          // Actually, just try create, if fails, it accounts for existence.
          // Password: "admin123" (needs 6 chars) -> Updated to "123456" as per user request
          const password = "123456"
          let userCredential
          
          try {
             userCredential = await createUserWithEmailAndPassword(auth, admin.email, password)
             addLog(`✅ Created Auth user: ${admin.email}`)
          } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
              addLog(`⚠️ User ${admin.email} already exists in Auth.`)
              // Try to sign in to get the UID to update profile
              try {
                const userCredential = await signInWithEmailAndPassword(auth, admin.email, password)
                 await setDoc(doc(db, "users", userCredential.user.uid), {
                  ...admin,
                  id: userCredential.user.uid
                })
                addLog(`✅ Updated Firestore profile for existing user: ${admin.name}`)
              } catch (signInError: any) {
                 addLog(`❌ Could not sign in as ${admin.email} to update profile: ${signInError.message}`)
              }
               continue; 
            } else {
              throw e
            }
          }

            if (userCredential) {
              // Create/Update Firestore Profile with correctly linked UID
              await setDoc(doc(db, "users", userCredential.user.uid), {
                ...admin,
                id: userCredential.user.uid // Overwrite mock ID with real Auth UID
              })
              addLog(`✅ Linked Firestore profile for: ${admin.name}`)
              
              // Seed Database if this is the first admin (to ensure we have permissions)
              if (admin.email === "shivarajmani2005@gmail.com" || admin.email === "ttsamant09@gmail.com") {
                   addLog("Seeding Firestore data (as Admin)...")
                   const seedResult = await seedDatabase()
                   if (seedResult) {
                     addLog("✅ Firestore data seeded successfully.")
                   } else {
                     addLog("❌ Failed to seed Firestore data.")
                   }
              }
            }

        } catch (error: any) {
          addLog(`❌ Error processing admin ${admin.email}: ${error.message}`)
        }
      }

      // 3. Create Student Users
      addLog("Creating Student users...")
      for (const student of mockStudents) {
         try {
          const password = "student123"
          let userCredential
          
          try {
             userCredential = await createUserWithEmailAndPassword(auth, student.email, password)
             addLog(`✅ Created Auth user: ${student.email}`)
          } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
              addLog(`⚠️ User ${student.email} already exists.`)
              continue
            } else {
              throw e
            }
          }

          if (userCredential) {
            await setDoc(doc(db, "users", userCredential.user.uid), {
              ...student,
              id: userCredential.user.uid
            })
            addLog(`✅ Linked Firestore profile for: ${student.name}`)
          }
        } catch (error: any) {
          addLog(`❌ Error processing student ${student.email}: ${error.message}`)
        }
      }

      addLog("🎉 Initialization Complete! You can now log in.")

    } catch (error: any) {
      addLog(`❌ Fatal Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const seedRVCEClubs = async () => {
      setLoading(true)
      setStatus([])
      addLog("Starting RVCE Clubs Seeding...")
      
      let secondaryApp: any = null;

      try {
          // Ensure we are logged in as admin first
          try {
             // Try logging in with the specific super admin we want to use for seeding
             // We'll try the new one first, or fallback.
             // For simplicity, let's just try logging in as the user who is likely running this.
             // But since we are automating, let's hardcode one that definitely exists.
             // We'll use ttsamant09 since we just added them.
             const adminCredential = await signInWithEmailAndPassword(auth, "ttsamant09@gmail.com", "123456")
             addLog("✅ Authenticated as Admin (ttsamant09).")

             // CRITICAL FIX: Ensure the Admin has a Firestore profile, otherwise isAdmin() rule fails!
             const adminDocRef = doc(db, "users", adminCredential.user.uid)
             // We can't use getDoc here if we don't have permissions, but we can try to SET it if we are the owner.
             // Rules allow create/update if isOwner.
             await setDoc(adminDocRef, {
                 id: adminCredential.user.uid,
                 email: "ttsamant09@gmail.com",
                 name: "Super Admin (New)",
                 role: "admin"
             }, { merge: true })
             addLog("✅ Verified/Created Super Admin Profile.")

          } catch (loginError: any) {
             addLog(`⚠️ Login/Profile Error: ${loginError.message}`)
          }

          // Initialize Secondary App for creating users without logging out
          const { initializeApp, deleteApp } = await import("firebase/app")
          const { firebaseConfig } = await import("@/lib/firebase")
          const { getAuth, setPersistence, inMemoryPersistence } = await import("firebase/auth")
          
          secondaryApp = initializeApp(firebaseConfig, "SecondaryApp")
          const secondaryAuth = getAuth(secondaryApp)
          await setPersistence(secondaryAuth, inMemoryPersistence)

          for (const club of rvceClubs) {
              const id = club.name.toLowerCase().replace(/\s+/g, '-')
              const adminEmail = `${id.replace(/-/g, '')}.admin@rvce.edu.in`
              const adminPassword = "123456" 

              // 1. Create Club Document
              await setDoc(doc(db, "clubs", id), {
                  id: id,
                  name: club.name,
                  description: club.description,
                  category: club.category,
                  facultyLead: "TBD",
                  memberCount: 0,
                  image: `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(club.name)}`,
                  isRecruiting: true,
                  adminEmail: adminEmail 
              })
              addLog(`✅ Added Club: ${club.name}`)

              // 2. Create Club Admin User via Secondary App
              try {
                  // Check if user already exists handled by try/catch on create
                  let uid = ""
                  try {
                      const userCred = await createUserWithEmailAndPassword(secondaryAuth, adminEmail, adminPassword)
                      uid = userCred.user.uid
                      addLog(`✅ Created Auth User: ${adminEmail}`)
                  } catch (createErr: any) {
                       if (createErr.code === 'auth/email-already-in-use') {
                           addLog(`⚠️ User ${adminEmail} already exists.`)
                           // We can't easily get the UID of an existing user client-side without logging in as them.
                           // But we don't want to log in as them.
                           // So we will skip Firestore profile update for existing users to avoid breaking things.
                           // Or we could try to 'signIn' on secondary auth?
                           try {
                               const existingUserCred = await signInWithEmailAndPassword(secondaryAuth, adminEmail, adminPassword)
                               uid = existingUserCred.user.uid
                               addLog(`✅ Retrieved UID for existing user: ${adminEmail}`)
                           } catch (signinErr) {
                               addLog(`❌ Could not sign in secondary user to get UID: ${adminEmail}`)
                           }
                       } else {
                           throw createErr
                       }
                  }

                  if (uid) {
                      // 3. Create/Update Firestore Profile using PRIMARY db (as Super Admin)
                      await setDoc(doc(db, "users", uid), {
                        id: uid,
                        email: adminEmail,
                        name: `${club.name} Admin`,
                        role: "club_admin",
                        managedClubId: id
                      })
                      addLog(`✅ Created/Updated Admin Profile for: ${club.name}`)
                  }

                  // Start fresh for next user (sign out secondary)
                  await secondaryAuth.signOut()

              } catch (adminErr: any) {
                  addLog(`❌ Error creating admin for ${club.name}: ${adminErr.message}`)
              }
          }
          addLog("🎉 All RVCE Clubs and Admins added successfully!")
      } catch (e: any) {
          addLog(`❌ Error seeding clubs: ${e.message}`)
      } finally {
          if (secondaryApp) {
              // Cleanup secondary app
              const { deleteApp } = await import("firebase/app") 
              await deleteApp(secondaryApp).catch(err => console.error("Error deleting secondary app", err))
          }
          setLoading(false)
      }
  }

  /* New: Seed Venues & Slots */
  const seedVenues = async () => {
    setLoading(true)
    setStatus([])
    addLog("Starting Venue Seeding...")

    try {
        const { mockVenues, mockVenueSlots } = await import("@/data/mock-data")

        // 1. Seed Venues
        addLog("Creating Venues...")
        for (const venue of mockVenues) {
            await setDoc(doc(db, "venues", venue.id), venue)
            addLog(`✅ Added Venue: ${venue.name}`)
        }

        // 2. Seed Slots
        addLog("Creating Venue Slots...")
        for (const slot of mockVenueSlots) {
             const slotId = `${slot.venueId}_${slot.date}_${slot.time.replace(/[:\s]/g, '-')}`
             await setDoc(doc(db, "venue_slots", slotId), slot)
             addLog(`✅ Added Slot: ${slot.date} @ ${slot.venueId}`)
        }
        
        addLog("🎉 Venues and Slots seeded successfully!")
    } catch (e: any) {
        addLog(`❌ Error seeding venues: ${e.message}`)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>System Initialization</CardTitle>
          <CardDescription>
            Create initial Admin/Student accounts and populate the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 font-mono text-sm h-64 overflow-y-auto space-y-1">
            {status.length === 0 ? (
              <p className="text-muted-foreground">Ready to initialize...</p>
            ) : (
              status.map((log, i) => (
                <p key={i} className={log.includes("❌") ? "text-destructive" : log.includes("⚠️") ? "text-amber-500" : "text-green-600"}>
                  {log}
                </p>
              ))
            )}
          </div>
          
          <Button onClick={initializeSystem} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Initialize System"
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground text-center pt-4">
            <p>Admin Password: <strong>123456</strong></p>
            <p>Student Password: <strong>student123</strong></p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button onClick={seedRVCEClubs} disabled={loading} variant="outline">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Seed RVCE Clubs"}
            </Button>
            <Button onClick={seedVenues} disabled={loading} variant="outline">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Seed Venues"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const rvceClubs = [
  // Cultural
  {
    name: "Footprints",
    description: "Official dance association of RVCE (Western, Eastern and Classical wings).",
    category: "Cultural",
  },
  {
    name: "RAAG",
    description: "Youth and cultural club that organises fests like Festhos and Hostel Day.",
    category: "Cultural",
  },
  {
    name: "RVCE Music Club",
    description: "Music activities including classical and contemporary genres.",
    category: "Cultural",
  },
  {
    name: "Literary Club",
    description: "Magazine and literary activities.",
    category: "Literary",
  },
  // Technical
  {
    name: "RVCE Robotics Club",
    description: "Designing and building robots for various competitions.",
    category: "Technical",
  },
  {
    name: "Frequency Club",
    description: "Electronics and technical creativity club.",
    category: "Technical",
  },
  {
    name: "SAE Collegiate Club",
    description: "Student team building vehicles for SAE competitions.",
    category: "Technical",
  },
  {
    name: "Solar Car Team",
    description: "Project team focused on designing solar-powered vehicles.",
    category: "Technical",
  },
  // Adventure & Sports
  {
    name: "Avventura",
    description: "Adventure club organizing trekking, rafting, cycling, and rock climbing.",
    category: "Adventure",
  },
  {
    name: "RVCE Yoga Club",
    description: "Promoting physical and mental well-being through Yoga.",
    category: "Sports",
  },
  {
    name: "Sports Club",
    description: "Coordination of volleyball, football, cricket, kabaddi, athletics, badminton, table tennis, carrom, and chess.",
    category: "Sports",
  },
  // Service & Professional
  {
    name: "Rotaract Club",
    description: "Service organization fostering leadership and community service.",
    category: "Service",
  },
  {
    name: "ASCE Student Chapter",
    description: "American Society of Civil Engineers student chapter.",
    category: "Professional",
  },
  {
    name: "IEEE Student Chapter",
    description: "Institute of Electrical and Electronics Engineers student chapter.",
    category: "Professional",
  },
  {
    name: "ISTE Student Chapter",
    description: "Indian Society for Technical Education student chapter.",
    category: "Professional",
  },
  {
    name: "CSI Student Chapter",
    description: "Computer Society of India student chapter.",
    category: "Professional",
  }
]
