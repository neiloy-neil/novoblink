import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { getCustomerRisk } from "@/lib/customerRisk"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get("phone")
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 })
  }

  const risk = await getCustomerRisk(phone)
  return NextResponse.json(risk)
}
