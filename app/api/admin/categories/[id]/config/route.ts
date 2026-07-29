import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id: categoryId } = await params
    const body = await req.json()
    const { attr1Label, attr2Label, attr1Hint, attr2Hint } = body

    const config = await prisma.categoryAttributeConfig.upsert({
      where: { categoryId },
      create: {
        categoryId,
        attr1Label: attr1Label || "Size",
        attr2Label: attr2Label || "Color",
        attr1Hint: attr1Hint || null,
        attr2Hint: attr2Hint || null,
      },
      update: {
        ...(attr1Label !== undefined && { attr1Label }),
        ...(attr2Label !== undefined && { attr2Label }),
        ...(attr1Hint !== undefined && { attr1Hint }),
        ...(attr2Hint !== undefined && { attr2Hint }),
      },
    })
    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
