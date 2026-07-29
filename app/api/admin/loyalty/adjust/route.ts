import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { userId, points, description } = body

    if (!userId || typeof points !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const loyaltyPoint = await prisma.loyaltyPoint.create({
      data: {
        userId,
        points,
        description: description || "Admin adjustment",
        type: "ADJUSTED",
      },
    })

    return NextResponse.json({ loyaltyPoint }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
