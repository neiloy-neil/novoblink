import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import WorkflowsClient from "./WorkflowsClient"

export default async function WorkflowsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const workflows = await prisma.workflow.findMany({
    include: { _count: { select: { runs: true } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Automation Workflows</h1>
        <p className="text-sm text-muted-foreground mt-1">Trigger automatic actions (emails, tags, credits) based on customer behaviour.</p>
      </div>
      <WorkflowsClient data={JSON.parse(JSON.stringify(workflows))} />
    </div>
  )
}
