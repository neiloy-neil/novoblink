import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const label = await prisma.shippingLabel.update({
    where: { id },
    data: {
      trackingCode: body.trackingCode ?? undefined,
      labelUrl: body.labelUrl ?? undefined,
      status: body.status ?? undefined,
    },
  })
  return NextResponse.json(label)
}
