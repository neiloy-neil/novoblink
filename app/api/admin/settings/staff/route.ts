import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "STAFF"] }
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ staff })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { email, role } = body

    if (!email || !["ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ error: "Invalid email or role" }, { status: 400 })
    }

    const admin = createAdminClient()
    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      if (user.role === "ADMIN" || user.role === "STAFF") {
        return NextResponse.json({ error: "User is already a staff member" }, { status: 400 })
      }
      user = await prisma.user.update({ where: { email }, data: { role } })
      await admin.auth.admin.updateUserById(user.id, { app_metadata: { role } })
    } else {
      // No existing account — invite them via Supabase (sends a magic-link email to set a password).
      const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name: email.split("@")[0] },
      })
      if (inviteError || !data.user) {
        return NextResponse.json({ error: inviteError?.message || "Failed to invite user" }, { status: 500 })
      }

      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          role,
          name: email.split("@")[0],
        },
      })
      await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
