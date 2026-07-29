import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const returns = await prisma.returnRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true } },
      items: {
        include: {
          orderItem: { select: { productName: true, size: true, color: true } },
        },
      },
    },
  })

  return NextResponse.json({ returns })
}
