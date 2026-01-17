"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getAllUsers } from "@/lib/db/users"
import { getClubs } from "@/lib/db/clubs"
import type { User, Club } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AddUserDialog } from "@/components/admin/add-user-dialog"
// ... imports
import { Search, RotateCw } from "lucide-react"

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const fetchData = async () => {
    setLoading(true)
    const [fetchedUsers, fetchedClubs] = await Promise.all([
      getAllUsers(),
      getClubs()
    ])
    setUsers(fetchedUsers)
    setClubs(fetchedClubs)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getClubName = (clubId?: string) => {
    if (!clubId) return "N/A"
    return clubs.find(c => c.id === clubId)?.name || "Unknown Club"
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
    return matchesSearch && matchesRole
  })

  // RBAC: Only Super Admins can see this page
  if (user && user.role !== "admin") {
      return (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-lg">
              <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
              <p className="mt-2 text-muted-foreground">Only System Administrators can manage users.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage students, system admins, and club admins.</p>
        </div>
        <AddUserDialog onUserAdded={fetchData} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">System Admin</SelectItem>
                  <SelectItem value="club_admin">Club Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={fetchData}>
                <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span 
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                            user.role === "admin" ? "bg-destructive text-destructive-foreground hover:bg-destructive/80" : 
                            user.role === "club_admin" ? "bg-primary text-primary-foreground hover:bg-primary/80" : 
                            "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {user.role === "club_admin" ? "Club Admin" : 
                           user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.role === "student" && `${user.studentId || "-"} • ${user.department || "-"}`}
                        {user.role === "club_admin" && `Manages: ${getClubName(user.managedClubId)}`}
                        {user.role === "admin" && "Full Access"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
