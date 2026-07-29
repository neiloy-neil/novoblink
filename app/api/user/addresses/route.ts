import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { id: 'asc' }
      ]
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("GET /api/user/addresses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { label, fullName, phone, division, district, area, address, isDefault } = body

    if (!fullName || !phone || !division || !district || !area || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if this is the first address
    const existingCount = await prisma.address.count({
      where: { userId: session.user.id }
    })
    const shouldBeDefault = existingCount === 0 ? true : Boolean(isDefault)

    // If making default, unset other defaults
    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label || "Home",
        fullName,
        phone,
        division,
        district,
        area,
        address,
        isDefault: shouldBeDefault,
      }
    })

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error("POST /api/user/addresses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
