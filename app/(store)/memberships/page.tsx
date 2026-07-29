import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import MembershipsPageClient from "./MembershipsPageClient"

export default async function MembershipsPage() {
  const [plans, session] = await Promise.all([
    prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    auth(),
  ])

  let activeSub = null
  if (session?.user.id) {
    activeSub = await prisma.membershipSubscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { plan: true },
    })
  }

  return <MembershipsPageClient plans={JSON.parse(JSON.stringify(plans))} activeSub={JSON.parse(JSON.stringify(activeSub))} />
}
