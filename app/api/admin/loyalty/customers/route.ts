import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const users = await prisma.user.findMany({
      include: {
        loyaltyPoints: true,
      },
    })

    const customers = users.map((user) => {
      let earned = 0
      let redeemed = 0
      user.loyaltyPoints.forEach((lp) => {
        if (lp.points > 0) earned += lp.points
        else redeemed += Math.abs(lp.points)
      })

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        currentBalance: earned - redeemed,
        totalEarned: earned,
        totalRedeemed: redeemed,
      }
    }).sort((a, b) => b.currentBalance - a.currentBalance)

    return NextResponse.json({ customers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
