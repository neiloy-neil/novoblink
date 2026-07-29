import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { productId, sessionId } = await req.json()
    if (!productId) return NextResponse.json({ ok: false })
    const session = await auth()
    await prisma.productView.create({
      data: {
        productId,
        sessionId: sessionId || null,
        userId: session?.user.id || null,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
