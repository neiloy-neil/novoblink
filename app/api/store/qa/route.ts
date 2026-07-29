import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const qas = await prisma.reviewQA.findMany({
    where: { productId, isPublished: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(qas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const body = await req.json()
  const qa = await prisma.reviewQA.create({
    data: {
      productId: body.productId,
      userId: session?.user.id || null,
      guestName: body.guestName || null,
      guestEmail: body.guestEmail || null,
      question: body.question,
    },
  })
  return NextResponse.json(qa)
}
