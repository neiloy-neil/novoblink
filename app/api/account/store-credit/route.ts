import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ balance: 0 })

  const credit = await prisma.storeCredit.findUnique({
    where: { userId: session.user.id },
  }).catch(() => null)

  return NextResponse.json({ balance: Number(credit?.balance ?? 0) })
}
