import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

// Lets staff create an order on a customer's behalf — for orders taken over
// phone, Facebook Messenger, or WhatsApp, which is how most small BD sellers
// actually operate. Mirrors /api/store/checkout's validation but skips the
// deposit requirement since the admin is directly vouching for the order.
export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { items, address, paymentMethod, shippingCharge, note, markPaid, asDraft } = body

    if (!items?.length) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 })
    }
    if (!asDraft && (!address?.name || !address?.phone)) {
      return NextResponse.json({ error: "Items and customer name/phone are required" }, { status: 400 })
    }

    const variantIds = items.map((i: any) => i.variantId)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { price: true, isActive: true } } },
    })
    const variantMap = Object.fromEntries(variants.map((v) => [v.id, v]))

    for (const item of items) {
      const variant = variantMap[item.variantId]
      if (!variant) {
        return NextResponse.json({ error: `Variant not found for "${item.name}"` }, { status: 400 })
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json({
          error: `Only ${variant.stock} unit(s) of "${item.name}" (${item.size}) left in stock`,
        }, { status: 400 })
      }
    }

    const subtotal = items.reduce((sum: number, item: any) => {
      const variant = variantMap[item.variantId]
      return sum + Number(variant.price ?? variant.product.price) * item.quantity
    }, 0)
    const shipping = Number(shippingCharge) || 0
    const total = subtotal + shipping

    const order = await prisma.$transaction(async (tx) => {
      if (!asDraft) {
        for (const item of items) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
          if (!variant || variant.stock < item.quantity) {
            throw new Error(`Insufficient stock for item: ${item.name} (${item.size})`)
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      const orderCount = await tx.order.count()
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, "0")}`

      const created = await tx.order.create({
        data: {
          orderNumber,
          status: asDraft ? "DRAFT" : "CONFIRMED", // DRAFT for quotes, CONFIRMED for live orders
          paymentStatus: markPaid ? "PAID" : "UNPAID",
          paymentMethod: paymentMethod || "COD",
          total,
          subtotal,
          shippingCharge: shipping,
          discount: 0,
          note: note || "Manual order (phone/Messenger/WhatsApp)",
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingAddress: address.fullAddress || "",
          shippingArea: address.area || "",
          shippingDistrict: address.district || "",
          shippingDivision: address.division || "",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(variantMap[item.variantId].price ?? variantMap[item.variantId].product.price),
              size: item.size || "Default",
              color: item.color || "Default",
            })),
          },
        },
      })

      await tx.orderStatusLog.create({
        data: { orderId: created.id, status: asDraft ? "DRAFT" : "CONFIRMED", note: asDraft ? "Saved as draft" : "Created manually by admin" },
      })

      return created
    })

    return NextResponse.json({ orderId: order.id })
  } catch (error: any) {
    console.error("Manual order error", error)
    const isStockError = error.message?.includes("stock")
    return NextResponse.json({ error: error.message }, { status: isStockError ? 400 : 500 })
  }
}
