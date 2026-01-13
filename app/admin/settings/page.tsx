"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Save, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoApproveRegistrations: false,
    requireEmailVerification: true,
    maxRegistrationsPerStudent: 3,
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Profile</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input value={user?.name || ""} disabled className="bg-muted border-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted border-input" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Role</Label>
              <Input value={user?.role || ""} disabled className="bg-muted border-input capitalize" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Notifications</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email alerts for new registrations</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">System Settings</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure system-wide settings for the recruitment platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">Auto-approve Registrations</p>
                  <p className="text-sm text-muted-foreground">Automatically approve all new registrations</p>
                </div>
                <Switch
                  checked={settings.autoApproveRegistrations}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoApproveRegistrations: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="font-medium text-foreground">Email Verification</p>
                  <p className="text-sm text-muted-foreground">Require students to verify their email</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Max Registrations Per Student</Label>
              <Input
                type="number"
                value={settings.maxRegistrationsPerStudent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxRegistrationsPerStudent: Number.parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={10}
                className="bg-background border-input max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">Maximum number of club registrations allowed per student</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        {saveSuccess && <span className="text-sm text-emerald-400">Settings saved successfully!</span>}
      </div>
    </div>
  )
}
