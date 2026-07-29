import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { purchaseOrders: true } } },
    })
    return NextResponse.json({ suppliers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, phone, email, address, note } = body
    if (!name?.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), phone, email, address, note },
    })
    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
