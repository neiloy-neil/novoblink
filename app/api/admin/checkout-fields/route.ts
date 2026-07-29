import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const fields = await prisma.checkoutField.findMany({ orderBy: [{ step: "asc" }, { sortOrder: "asc" }] })
  return NextResponse.json(fields)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const field = await prisma.checkoutField.create({
    data: {
      label: body.label,
      placeholder: body.placeholder || null,
      type: body.type || "TEXT",
      options: body.options || [],
      isRequired: body.isRequired || false,
      step: body.step || 1,
      sortOrder: body.sortOrder || 0,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(field)
}
