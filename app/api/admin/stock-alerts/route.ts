import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const alerts = await prisma.stockAlert.findMany({
      where: { notified: false },
      orderBy: { createdAt: "desc" },
      include: { variant: { include: { product: { select: { name: true, slug: true } } } } },
    })
    return NextResponse.json({ alerts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
