import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } })
    return NextResponse.json({ coupons })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = body

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    const coupon = await prisma.coupon.create({
      data: { code, type, value, minOrderAmount, maxUses, expiresAt: expiresAt ? new Date(expiresAt) : null },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
