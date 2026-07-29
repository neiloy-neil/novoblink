import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const collections = await prisma.smartCollection.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(collections)
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  const body = await req.json()
  const { name, slug, description, image, rules, ruleMatch, sortBy, isActive } = body
  const collection = await prisma.smartCollection.create({
    data: { name, slug, description, image, rules: rules || [], ruleMatch: ruleMatch || "all", sortBy: sortBy || "created_desc", isActive: isActive !== false },
  })
  return NextResponse.json(collection)
}
