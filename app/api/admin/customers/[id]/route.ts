import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      loyaltyPoints: true,
      customerTags: true,
    },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { addTag, removeTag } = await req.json()

  if (addTag) {
    await prisma.customerTag.upsert({
      where: { userId_tag: { userId: id, tag: addTag } },
      create: { userId: id, tag: addTag },
      update: {},
    })
  }
  if (removeTag) {
    await prisma.customerTag.deleteMany({ where: { userId: id, tag: removeTag } })
  }

  return NextResponse.json({ ok: true })
}
