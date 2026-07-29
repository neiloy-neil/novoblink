import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

async function recalcTotal(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  })
  if (!order) return
  const subtotal = order.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const total = subtotal + Number(order.shippingCharge) + Number(order.giftWrapCharge) - Number(order.discount)
  await prisma.order.update({ where: { id: orderId }, data: { subtotal, total } })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const { variantId, quantity, price } = await req.json()
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    })
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    const unitPrice = price ?? Number(variant.price ?? variant.product.price)

    const item = await prisma.orderItem.create({
      data: {
        orderId: id,
        productId: variant.productId,
        variantId,
        quantity,
        price: unitPrice,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
      }
    })
    await prisma.productVariant.update({ where: { id: variantId }, data: { stock: { decrement: quantity } } })
    await recalcTotal(id)
    await prisma.auditLog.create({
      data: { action: "order.item_added", entityType: "Order", entityId: id, actorId: session?.user?.id, after: { variantId, quantity, price: unitPrice } }
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const { itemId, quantity } = await req.json()
  try {
    const existing = await prisma.orderItem.findUnique({ where: { id: itemId } })
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    const delta = quantity - existing.quantity
    await prisma.orderItem.update({ where: { id: itemId }, data: { quantity } })
    await prisma.productVariant.update({ where: { id: existing.variantId }, data: { stock: { decrement: delta } } })
    await recalcTotal(id)
    await prisma.auditLog.create({
      data: { action: "order.item_updated", entityType: "Order", entityId: id, actorId: session?.user?.id, before: { quantity: existing.quantity }, after: { quantity } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const { itemId } = await req.json()
  try {
    const existing = await prisma.orderItem.findUnique({ where: { id: itemId } })
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    // Check order still has other items
    const itemCount = await prisma.orderItem.count({ where: { orderId: id } })
    if (itemCount <= 1) return NextResponse.json({ error: "Cannot remove last item" }, { status: 400 })
    await prisma.orderItem.delete({ where: { id: itemId } })
    await prisma.productVariant.update({ where: { id: existing.variantId }, data: { stock: { increment: existing.quantity } } })
    await recalcTotal(id)
    await prisma.auditLog.create({
      data: { action: "order.item_removed", entityType: "Order", entityId: id, actorId: session?.user?.id, before: { variantId: existing.variantId, quantity: existing.quantity } }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
