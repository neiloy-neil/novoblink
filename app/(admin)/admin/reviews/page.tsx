import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import ReviewsClient from "./ReviewsClient"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function ReviewsPage() {
  const { session } = await requireAdmin()
  if (!session) redirect("/login")

  const reviews = await prisma.review.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
      media: true,
    },
  })

  const serialized = reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))
  return <ReviewsClient initialReviews={serialized} />
}
