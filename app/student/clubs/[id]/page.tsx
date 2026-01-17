import { getClubs, getClubById } from "@/lib/db/clubs"
import { getRecruitmentEvents } from "@/lib/db/events"
import ClubDetailClient from "./club-detail-client"

export async function generateStaticParams() {
  const clubs = await getClubs()
  return clubs.map((club) => ({
    id: club.id,
  }))
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const club = await getClubById(id)
  const events = await getRecruitmentEvents(id)
  return <ClubDetailClient id={id} initialClub={club} initialEvents={events} />
}
