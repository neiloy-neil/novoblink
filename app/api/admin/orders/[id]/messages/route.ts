import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const messages = await prisma.orderMessage.findMany({ where: { orderId: id }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(messages)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 })
  // Mark all customer messages as read
  await prisma.orderMessage.updateMany({
    where: { orderId: id, fromAdmin: false, readAt: null },
    data: { readAt: new Date() }
  })
  const msg = await prisma.orderMessage.create({
    data: { orderId: id, fromAdmin: true, message: message.trim() }
  })
  return NextResponse.json(msg)
}
