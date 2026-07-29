import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const collection = await prisma.smartCollection.findUnique({ where: { id } })
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(collection)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const { name, slug, description, image, rules, ruleMatch, sortBy, isActive } = body
  const collection = await prisma.smartCollection.update({
    where: { id },
    data: { name, slug, description, image, rules: rules || [], ruleMatch, sortBy, isActive },
  })
  return NextResponse.json(collection)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  await prisma.smartCollection.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
