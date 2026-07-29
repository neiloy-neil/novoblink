import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { supplier: true, items: true },
    })
    return NextResponse.json({ purchaseOrders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { supplierId, items, note } = body

    if (!supplierId || !items?.length) {
      return NextResponse.json({ error: "Supplier and at least one item are required" }, { status: 400 })
    }

    const totalCost = items.reduce((sum: number, item: any) => sum + Number(item.costPrice) * Number(item.quantity), 0)

    const poCount = await prisma.purchaseOrder.count()
    const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, "0")}`

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        note,
        totalCost,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            costPrice: item.costPrice,
          })),
        },
      },
      include: { items: true, supplier: true },
    })

    return NextResponse.json({ purchaseOrder }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
