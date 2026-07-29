import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import AffiliatesClient from "./AffiliatesClient"

export default async function AffiliatesPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const affiliates = await prisma.affiliate.findMany({
    include: { _count: { select: { clicks: true, conversions: true } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Affiliates & Referrals</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage affiliates. Share links like NovoBlink.com.bd?ref=CODE</p>
      </div>
      <AffiliatesClient data={JSON.parse(JSON.stringify(affiliates))} />
    </div>
  )
}
