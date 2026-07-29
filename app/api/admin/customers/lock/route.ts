import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { userId, lock } = await req.json()
  if (!userId || typeof lock !== "boolean") {
    return NextResponse.json({ error: "Missing userId or lock" }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isLocked: lock },
    select: { id: true, isLocked: true, name: true, role: true },
  })

  // Sync into Supabase app_metadata so middleware blocks immediately
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: user.role, isLocked: lock },
  })

  return NextResponse.json({ ok: true, user })
}
