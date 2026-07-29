import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const userId = (session.user as any).id
    const points = await prisma.loyaltyPoint.findMany({ where: { userId } })
    const balance = points.reduce((sum, p) => sum + p.points, 0)
    return NextResponse.json({ balance })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
