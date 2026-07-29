import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { code, landingPage } = await req.json()
    if (!code) return NextResponse.json({ error: "No code" }, { status: 400 })
    const affiliate = await prisma.affiliate.findUnique({ where: { code: code.toUpperCase(), isActive: true } })
    if (!affiliate) return NextResponse.json({ error: "Invalid code" }, { status: 404 })
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || null
    const userAgent = req.headers.get("user-agent") || null
    await prisma.affiliateClick.create({ data: { affiliateId: affiliate.id, ip, userAgent, landingPage } })
    return NextResponse.json({ ok: true, affiliateId: affiliate.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
