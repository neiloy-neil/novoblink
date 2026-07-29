import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to mark reviews as helpful" }, { status: 401 })
  }

  const { reviewId } = await req.json()
  if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 })

  // One vote per user per review
  const existing = await prisma.reviewHelpfulVote.findUnique({
    where: { reviewId_userId: { reviewId, userId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already marked as helpful" }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.reviewHelpfulVote.create({ data: { reviewId, userId: session.user.id } }),
    prisma.review.update({ where: { id: reviewId }, data: { helpful: { increment: 1 } } }),
  ])

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { helpful: true } })
  return NextResponse.json({ helpful: review?.helpful ?? 0 })
}
