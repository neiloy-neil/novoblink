import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { action } = await req.json() // "approve" | "reject" | "delete"

  if (action === "delete") {
    await prisma.review.delete({ where: { id } })
    await logAudit({ actorId: session!.user.id, actorEmail: session!.user.email, actorRole: session!.user.role, action: "review.deleted", entityType: "Review", entityId: id })
    return NextResponse.json({ ok: true })
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: action === "approve" },
  })

  await logAudit({ actorId: session!.user.id, actorEmail: session!.user.email, actorRole: session!.user.role, action: `review.${action}d`, entityType: "Review", entityId: id })

  return NextResponse.json({ review })
}
