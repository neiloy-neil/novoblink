import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const brands = await prisma.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  return NextResponse.json(brands)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const brand = await prisma.brand.create({
    data: {
      name: body.name,
      slug,
      logo: body.logo || null,
      banner: body.banner || null,
      description: body.description || null,
      website: body.website || null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  })
  return NextResponse.json(brand)
}
