import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session?.user?.id !== order.userId && !order.isGuest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const messages = await prisma.orderMessage.findMany({ where: { orderId: id }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(messages)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session?.user?.id !== order.userId && !order.isGuest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })
  const msg = await prisma.orderMessage.create({
    data: { orderId: id, fromAdmin: false, message: message.trim() }
  })
  return NextResponse.json(msg)
}
