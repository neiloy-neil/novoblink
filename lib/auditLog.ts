import prisma from "@/lib/prisma"

export async function logAudit({
  actorId,
  actorEmail,
  actorRole,
  action,
  entityType,
  entityId,
  before,
  after,
  ip,
}: {
  actorId?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  action: string
  entityType: string
  entityId?: string | null
  before?: Record<string, any> | null
  after?: Record<string, any> | null
  ip?: string | null
}) {
  try {
    await prisma.auditLog.create({
      data: { actorId, actorEmail, actorRole, action, entityType, entityId, before: before ?? undefined, after: after ?? undefined, ip },
    })
  } catch {
    // non-critical — never let audit failure block the main operation
  }
}
