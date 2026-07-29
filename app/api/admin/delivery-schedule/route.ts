import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const schedules = await prisma.deliverySchedule.findMany({ orderBy: { district: "asc" } })
  return NextResponse.json(schedules)
}

export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const district = data.district || null
  const schedule = await prisma.deliverySchedule.upsert({
    where: { district: district ?? undefined },
    create: {
      district,
      leadDays: Number(data.leadDays ?? 2),
      cutoffHour: Number(data.cutoffHour ?? 14),
      blackoutDates: data.blackoutDates || [],
      workingDays: data.workingDays || [1, 2, 3, 4, 5, 6],
    },
    update: {
      leadDays: Number(data.leadDays ?? 2),
      cutoffHour: Number(data.cutoffHour ?? 14),
      blackoutDates: data.blackoutDates || [],
      workingDays: data.workingDays || [1, 2, 3, 4, 5, 6],
    },
  })
  return NextResponse.json(schedule)
}
