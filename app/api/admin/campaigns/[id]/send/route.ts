import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (campaign.status === "SENT") return NextResponse.json({ error: "Already sent" }, { status: 400 })

  await prisma.emailCampaign.update({ where: { id }, data: { status: "SENDING" } })

  try {
    let users: { email: string }[] = []
    if (campaign.recipientType === "ALL" || campaign.recipientType === "CUSTOMERS") {
      users = await prisma.user.findMany({ select: { email: true } })
    } else if (campaign.recipientType === "VIP") {
      const tagged = await prisma.customerTag.findMany({ where: { tag: "VIP" }, include: { user: { select: { email: true } } } })
      users = tagged.map(t => ({ email: t.user.email }))
    }

    let sent = 0
    for (const u of users) {
      try {
        await sendEmail({ to: u.email, subject: campaign.subject, html: campaign.bodyHtml })
        sent++
      } catch {}
    }

    await prisma.emailCampaign.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), totalSent: sent } })
    return NextResponse.json({ success: true, sent })
  } catch (e: any) {
    await prisma.emailCampaign.update({ where: { id }, data: { status: "DRAFT" } })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
