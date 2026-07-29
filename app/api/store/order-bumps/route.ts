import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const cartTotal = Number(req.nextUrl.searchParams.get("cartTotal") || 0)
  const bumps = await prisma.orderBump.findMany({
    where: {
      isActive: true,
      OR: [{ triggerMinTotal: null }, { triggerMinTotal: { lte: cartTotal } }],
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, price: true, images: { take: 1 } },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: 3,
  })
  return NextResponse.json(bumps)
}
