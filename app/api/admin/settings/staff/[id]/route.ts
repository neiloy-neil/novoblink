import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await request.json()
    const { role } = body

    if (!["ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    })

    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(id, { app_metadata: { role } })

    return NextResponse.json({ user })
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
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.user.update({
      where: { id },
      data: { role: "CUSTOMER" }, // Remove staff access, make them regular customer
    })

    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(id, { app_metadata: { role: "CUSTOMER" } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
