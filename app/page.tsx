import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { GraduationCap, Users, Building2, Calendar, ArrowRight, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ClubHub</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login/student">Student Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login/admin">Admin Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <StatusBadge variant="default" className="animate-fade-in">
            Spring Recruitment 2026 is Open
          </StatusBadge>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Discover Your Perfect <span className="text-primary">College Club</span>
            </h1>
            <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
              Join the clubs that match your interests. From tech to arts, find your community and grow with like-minded
              peers.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="gap-2">
                <Link href="/login/student">
                  <Users className="h-4 w-4" />
                  Student Login
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 bg-transparent">
                <Link href="/login/admin">
                  <Shield className="h-4 w-4" />
                  Admin / Club Admin
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card/50 py-24">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">Everything You Need</h2>
              <p className="text-muted-foreground">Our platform streamlines the entire club recruitment process</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Browse Clubs</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Explore all college clubs with detailed information about activities and faculty leads
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Recruitment Events</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Stay updated with test dates, venues, and timings for all recruitment drives
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">Easy Registration</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Register for club recruitments with a single click and track your applications
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Login Options */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground">Get Started</h2>
              <p className="text-muted-foreground">Choose your portal to access the recruitment system</p>
            </div>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              <Card className="group relative overflow-hidden bg-card border-border transition-all hover:border-primary/50">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">Student Portal</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Browse clubs, view recruitment schedules, and register for club selections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      View all college clubs
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Check recruitment notifications
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Register for selections
                    </li>
                  </ul>
                  <Button asChild className="w-full gap-2">
                    <Link href="/login/student">
                      Student Login
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-card border-border transition-all hover:border-primary/50">
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                    <Shield className="h-7 w-7 text-foreground" />
                  </div>
                  <CardTitle className="text-xl text-foreground">Admin Portal</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage clubs, create events, and handle student registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Manage club information
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Create recruitment events
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Review registrations
                    </li>
                  </ul>
                  <Button variant="secondary" asChild className="w-full gap-2">
                    <Link href="/login/admin">
                      Admin Login
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">ClubHub - College Club Recruitment System</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ClubHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
