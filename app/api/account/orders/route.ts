import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const orders = await prisma.order.findMany({
      where: { userId: (session.user as any).id },
      include: {
        items: {
          include: { product: { include: { images: { take: 1 } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
