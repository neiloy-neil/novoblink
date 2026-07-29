import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const expenses = await prisma.expense.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
    })
    return NextResponse.json({ expenses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { category, amount, date, note } = body

    if (!category || !amount) {
      return NextResponse.json({ error: "Category and amount are required" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        note,
      },
    })
    return NextResponse.json({ expense }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
