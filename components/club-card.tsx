import Link from "next/link"
import Image from "next/image"
import type { Club } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Users, User, ArrowRight, ExternalLink } from "lucide-react"

interface ClubCardProps {
  club: Club
  linkPrefix?: string
}

export function ClubCard({ club, linkPrefix = "/student/clubs" }: ClubCardProps) {
  return (
    <Card className="group h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 bg-card border-border flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <Image
          src={club.image || "/placeholder.svg"}
          alt={club.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <StatusBadge variant={club.isRecruiting ? "success" : "default"}>
            {club.isRecruiting ? "Recruiting" : "Not Recruiting"}
          </StatusBadge>
          <span className="rounded-full bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur">
            {club.category}
          </span>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-foreground">{club.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-muted-foreground">{club.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{club.facultyLead}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{club.memberCount}</span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full gap-2 bg-transparent group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <Link href={`${linkPrefix}/${club.id}`}>
              Read More
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
