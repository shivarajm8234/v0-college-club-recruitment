"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/types"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "student" | "admin") => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

import { getUserProfile } from "@/lib/db/users"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid)
        
        if (userProfile) {
          setUser(userProfile)
        } else {
          // User exists in Auth but not in Firestore
          // We could redirect to a profile completion page or just set user to null
          console.warn("User Authenticated but profile not found in Firestore")
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string, role: "student" | "admin"): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userProfile = await getUserProfile(userCredential.user.uid)

      if (!userProfile) {
        await signOut(auth)
        return { success: false, error: "Profile not found. Please run system setup." }
      }

      if (role === "admin") {
        if (userProfile.role !== "admin" && userProfile.role !== "club_admin") {
          await signOut(auth)
          return { success: false, error: "Unauthorized access: Admin privileges required." }
        }
      } else if (userProfile.role !== role) {
        await signOut(auth)
        return { success: false, error: "Unauthorized access: Role mismatch." }
      }

      return { success: true }
    } catch (error: any) {
      // Only log unexpected errors
      if (error.code !== 'auth/invalid-credential' && error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password') {
        console.error("Login failed", error)
      }
      
      let errorMessage = "Login failed. Please check your credentials."
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         errorMessage = "Invalid email or password."
      }
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
