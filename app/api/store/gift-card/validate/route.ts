import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

  const card = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase() } })
  if (!card) return NextResponse.json({ error: "Gift card not found" }, { status: 404 })
  if (!card.isActive) return NextResponse.json({ error: "This gift card has been deactivated" }, { status: 400 })
  if (card.expiresAt && new Date() > card.expiresAt) return NextResponse.json({ error: "This gift card has expired" }, { status: 400 })
  if (Number(card.balance) <= 0) return NextResponse.json({ error: "This gift card has no remaining balance" }, { status: 400 })

  return NextResponse.json({ code: card.code, balance: Number(card.balance), amount: Number(card.amount) })
}
