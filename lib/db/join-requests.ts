
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore"
import type { JoinRequest } from "@/types"

export async function createJoinRequest(request: JoinRequest): Promise<void> {
  // Use composite ID for idempotency: req_{clubId}_{userId}
  await setDoc(doc(db, "join_requests", request.id), request)
}

export async function getJoinRequestsForClub(clubId: string): Promise<JoinRequest[]> {
  try {
    const q = query(collection(db, "join_requests"), where("clubId", "==", clubId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as JoinRequest)
  } catch (error) {
    console.error("Error fetching join requests:", error)
    return []
  }
}

export async function checkJoinRequest(userId: string, clubId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, "join_requests"),
      where("userId", "==", userId),
      where("clubId", "==", clubId)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking join request:", error)
    return false
  }
}
