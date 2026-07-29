import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const courier = searchParams.get("courier") || ""
    const status = searchParams.get("status") || ""

    const where: any = {}
    if (courier) where.courier = courier
    if (status) where.status = status

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            user: true,
          }
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ deliveries })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
