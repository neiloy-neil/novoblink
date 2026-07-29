import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { productId, question, guestName } = await req.json()
    if (!productId || !question?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }
    const qa = await prisma.reviewQA.create({
      data: { productId, question: question.trim(), guestName: guestName?.trim() || null },
    })
    return NextResponse.json({ id: qa.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
