import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createAdminClient } from "@/lib/supabase"
import { mailchimpSubscribe } from "@/lib/mailchimp"
import { klaviyoSubscribe } from "@/lib/klaviyo"
import { sendWelcomeEmail } from "@/lib/email"

// Called right after a successful supabase.auth.signUp() on the client.
// Creates the matching Prisma profile row and mirrors the role into
// Supabase app_metadata so middleware can read it at the edge.
export async function POST(req: Request) {
  try {
    const { id, name, email, phone } = await req.json()

    if (!id || !name || !email) {
      return NextResponse.json({ error: "id, name and email are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name, phone: phone || null },
      create: { id, name, email, phone: phone || null, role: "CUSTOMER" },
    })

    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(id, {
      app_metadata: { role: user.role },
      user_metadata: { name },
    })

    // Fire-and-forget: welcome email + marketing list subscriptions
    sendWelcomeEmail({ to: email, name }).catch(() => {})
    mailchimpSubscribe(email, name, ["customer"]).catch(() => {})
    klaviyoSubscribe(email, name).catch(() => {})

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
