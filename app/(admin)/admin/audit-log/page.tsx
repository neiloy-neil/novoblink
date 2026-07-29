import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ entity?: string; actor?: string }> }) {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const { entity, actor } = await searchParams

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entityType: entity } : {}),
      ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const ACTION_COLORS: Record<string, string> = {
    "order.created": "bg-green-100 text-green-800",
    "order.status_changed": "bg-blue-100 text-blue-800",
    "return.status_changed": "bg-orange-100 text-orange-800",
    "product.updated": "bg-purple-100 text-purple-800",
    "settings.updated": "bg-gray-100 text-gray-800",
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Full trail of system and admin actions. Last 200 entries.</p>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">When</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No audit entries yet</td></tr>
            )}
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/10">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{log.actorEmail || "System"}</span>
                  {log.actorRole && <span className="ml-1.5 text-xs text-muted-foreground">({log.actorRole})</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.entityId?.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
