import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const status = req.nextUrl.searchParams.get("status") || "pending"
  const where = status === "pending" ? { isApproved: false } : status === "approved" ? { isApproved: true } : {}

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
      media: true,
    },
  })

  return NextResponse.json({ reviews })
}
