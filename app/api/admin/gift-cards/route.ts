import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sendGiftCardEmail } from "@/lib/email"
import crypto from "crypto"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const cards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(cards)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  const code = data.code || `GC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

  const card = await prisma.giftCard.create({
    data: {
      code,
      amount: Number(data.amount),
      balance: Number(data.amount),
      senderName: data.senderName || null,
      senderEmail: data.senderEmail || null,
      recipientEmail: data.recipientEmail,
      message: data.message || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })

  if (data.sendEmail !== false) {
    sendGiftCardEmail({
      to: card.recipientEmail,
      recipientName: data.recipientName || card.recipientEmail,
      senderName: card.senderName || "Someone",
      code: card.code,
      amount: Number(card.amount),
      message: card.message,
      expiresAt: card.expiresAt,
    }).catch(() => {})
  }

  return NextResponse.json(card)
}
