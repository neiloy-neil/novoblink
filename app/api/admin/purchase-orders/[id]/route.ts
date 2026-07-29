import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    })
    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }
    return NextResponse.json({ purchaseOrder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Marks a PO as RECEIVED — stocks the inventory and updates each variant's
// current cost basis. Marking as CANCELLED is a no-op on inventory.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const { status } = await req.json()

    if (!["RECEIVED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } })
    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending purchase orders can be updated" }, { status: 400 })
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      if (status === "RECEIVED") {
        for (const item of existing.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity },
              costPrice: item.costPrice, // latest-cost basis
            },
          })
        }
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: { status, receivedAt: status === "RECEIVED" ? new Date() : null },
      })
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
