import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Called by the client when a cart has been idle for a while — stores a snapshot.
export async function POST(req: Request) {
  try {
    const { sessionId, email, phone, items, subtotal } = await req.json()
    if (!sessionId || !items?.length) return NextResponse.json({ ok: true })

    await prisma.abandonedCart.upsert({
      where: { sessionId },
      create: { sessionId, email: email || null, phone: phone || null, items, subtotal },
      update: { email: email || undefined, phone: phone || undefined, items, subtotal, updatedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: true }) }
}
