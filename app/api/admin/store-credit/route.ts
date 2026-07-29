import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { sendStoreCreditIssued } from "@/lib/email"

export async function GET(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (userId) {
    const credit = await prisma.storeCredit.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
    })
    return NextResponse.json(credit || { balance: 0, transactions: [] })
  }
  const credits = await prisma.storeCredit.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(credits)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, amount, reason, type = "CREDIT" } = await req.json()
  if (!userId || !amount) return NextResponse.json({ error: "userId and amount required" }, { status: 400 })

  const delta = type === "DEBIT" ? -Math.abs(Number(amount)) : Math.abs(Number(amount))

  const credit = await prisma.storeCredit.upsert({
    where: { userId },
    create: { userId, balance: delta > 0 ? delta : 0 },
    update: { balance: { increment: delta } },
  })

  await prisma.storeCreditTransaction.create({
    data: {
      userId,
      storeCreditId: credit.id,
      amount: Math.abs(Number(amount)),
      type,
      reason: reason || null,
      issuedBy: session.user.id,
    },
  })

  if (type === "CREDIT") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (user?.email) {
      sendStoreCreditIssued({
        to: user.email,
        customerName: user.name || "Customer",
        amount: Math.abs(Number(amount)),
        reason: reason || "Store credit",
        balance: Number(credit.balance),
      }).catch(() => {})
    }
  }

  return NextResponse.json(credit)
}
