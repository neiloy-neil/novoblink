import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ affiliate: null })

  const affiliate = await prisma.affiliate.findFirst({
    where: { userId: session.user.id },
    include: { _count: { select: { conversions: true } } },
  }).catch(() => null)

  if (!affiliate) return NextResponse.json({ affiliate: null })
  return NextResponse.json({ affiliate: JSON.parse(JSON.stringify(affiliate)) })
}
