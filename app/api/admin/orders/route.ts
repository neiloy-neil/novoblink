import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const paymentMethod = searchParams.get("paymentMethod") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = {
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { shippingName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: true, payment: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
