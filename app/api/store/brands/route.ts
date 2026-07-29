import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logo: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(brands)
}
