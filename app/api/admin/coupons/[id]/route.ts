import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive, value, minOrderAmount, maxUses, expiresAt } = body

    const data: Record<string, any> = {}
    if (typeof isActive === "boolean") data.isActive = isActive
    if (value !== undefined) data.value = parseFloat(value)
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : null
    if (maxUses !== undefined) data.maxUses = maxUses ? parseInt(maxUses) : null
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null

    const coupon = await prisma.coupon.update({ where: { id }, data })
    return NextResponse.json({ coupon })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    await prisma.coupon.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
