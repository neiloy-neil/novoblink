import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const status = req.nextUrl.searchParams.get("status")
  const subscriptions = await prisma.subscription.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      plan: { include: { product: { select: { name: true, slug: true } } } },
    },
    orderBy: { nextOrderAt: "asc" },
  })
  return NextResponse.json(subscriptions)
}
