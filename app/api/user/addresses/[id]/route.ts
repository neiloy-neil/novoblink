import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { label, fullName, phone, division, district, area, address, isDefault } = body

    // Ensure the address belongs to the user
    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    // If setting to default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(division && { division }),
        ...(district && { district }),
        ...(area && { area }),
        ...(address && { address }),
        ...(isDefault !== undefined && { isDefault })
      }
    })

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error("PATCH /api/user/addresses/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure the address belongs to the user
    const existing = await prisma.address.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
    }

    await prisma.address.delete({ where: { id } })

    // If we deleted the default address, make the newest remaining address default
    if (existing.isDefault) {
      const fallback = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { id: 'desc' }
      })
      if (fallback) {
        await prisma.address.update({
          where: { id: fallback.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/user/addresses/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
