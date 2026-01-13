"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { User } from "@/types"
import { mockStudents, mockAdmins } from "@/data/mock-data"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: "student" | "admin") => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string, role: "student" | "admin"): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (role === "student") {
      const student = mockStudents.find((s) => s.email === email)
      if (student && password === "password") {
        setUser(student)
        return true
      }
    } else {
      const admin = mockAdmins.find((a) => a.email === email)
      if (admin && password === "admin123") {
        setUser(admin)
        return true
      }
    }
    return false
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
