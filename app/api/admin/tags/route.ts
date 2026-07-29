import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const tags = await prisma.productTag.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(tags)
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const tag = await prisma.productTag.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() },
  })
  return NextResponse.json(tag)
}
