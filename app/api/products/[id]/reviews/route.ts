import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params

  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { name: true } }, media: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  return NextResponse.json({
    reviews,
    average: agg._avg.rating ?? 0,
    count: agg._count.rating,
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to write a review" }, { status: 401 })
  }

  const { id: productId } = await params
  const { rating, comment } = await req.json()

  const numRating = Number(rating)
  if (!numRating || numRating < 1 || numRating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  // Verify the user actually purchased and received this product
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.user.id, status: "DELIVERED" },
    },
  })

  if (!purchased) {
    return NextResponse.json(
      { error: "You can only review products you've purchased and received" },
      { status: 403 }
    )
  }

  const isNew = !(await prisma.review.findUnique({ where: { userId_productId: { userId: session.user.id, productId } } }))

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: {
      userId: session.user.id,
      productId,
      rating: numRating,
      comment: comment?.trim() || null,
      isApproved: false,
    },
    update: {
      rating: numRating,
      comment: comment?.trim() || null,
    },
  })

  // Award 10 loyalty points for first-time review
  if (isNew) {
    await prisma.loyaltyPoint.create({
      data: { userId: session.user.id, points: 10, type: "EARNED", description: "Review reward" },
    }).catch(() => {})
  }

  return NextResponse.json({ review, pointsAwarded: isNew ? 10 : 0 }, { status: 201 })
}
