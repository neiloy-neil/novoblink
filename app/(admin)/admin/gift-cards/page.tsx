import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import GiftCardsClient from "./GiftCardsClient"

export default async function GiftCardsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const cards = await prisma.giftCard.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Gift Cards</h1>
        <p className="text-sm text-muted-foreground mt-1">Issue and manage gift cards. Recipients receive an email with their redemption code.</p>
      </div>
      <GiftCardsClient data={JSON.parse(JSON.stringify(cards))} />
    </div>
  )
}
