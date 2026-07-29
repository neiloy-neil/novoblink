import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const affiliates = await prisma.affiliate.findMany({
    include: { _count: { select: { clicks: true, conversions: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(affiliates)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const affiliate = await prisma.affiliate.create({
    data: {
      name: data.name,
      email: data.email,
      code: data.code.toUpperCase(),
      commissionType: data.commissionType || "PERCENTAGE",
      commissionValue: Number(data.commissionValue || 10),
      isActive: data.isActive ?? true,
    },
  })
  return NextResponse.json(affiliate)
}
