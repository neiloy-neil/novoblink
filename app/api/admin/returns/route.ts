import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const returns = await prisma.returnRequest.findMany({
    where: status ? { status: status as any } : {},
    include: {
      order: { select: { orderNumber: true, shippingName: true, shippingPhone: true } },
      items: { include: { orderItem: { select: { productName: true, size: true, color: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(returns)
}
