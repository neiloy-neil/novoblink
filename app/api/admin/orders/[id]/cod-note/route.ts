import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { codCallNote } = await req.json()

  const order = await prisma.order.update({
    where: { id },
    data: { codCallNote: codCallNote ?? null },
    select: { id: true, codCallNote: true },
  })

  return NextResponse.json({ order })
}
