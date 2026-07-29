import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  const body = await req.json()
  const { name, subject, previewText, bodyHtml, recipientType, scheduledAt } = body
  const campaign = await prisma.emailCampaign.create({
    data: { name, subject, previewText, bodyHtml, recipientType: recipientType || "ALL", scheduledAt: scheduledAt || null }
  })
  return NextResponse.json(campaign)
}
