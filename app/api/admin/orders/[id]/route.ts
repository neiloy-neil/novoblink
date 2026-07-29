import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        items: { include: { product: { include: { images: true } } } },
        payment: true,
        delivery: true,
        statusLogs: { orderBy: { createdAt: "desc" } },
      },
    })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
