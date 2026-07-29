import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { event, productId, orderId, value } = await req.json()
    if (!event) return NextResponse.json({ error: "event required" }, { status: 400 })

    let sessionId = req.cookies.get("session_id")?.value
    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    const session = await auth()
    prisma.funnelEvent.create({
      data: { event, productId: productId || null, orderId: orderId || null, userId: session?.user?.id || null, sessionId, value: value || null }
    }).catch(() => {})

    const res = NextResponse.json({ success: true })
    if (!req.cookies.get("session_id")) {
      res.cookies.set("session_id", sessionId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" })
    }
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
