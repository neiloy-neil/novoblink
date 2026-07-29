import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export default async function CampaignsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")
  const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } }).catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Email Campaigns</h1></div>
        <Link href="/admin/campaigns/new"><Button>New Campaign</Button></Link>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Subject</th>
            <th className="px-4 py-2 text-left">Recipients</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Sent</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody>
            {campaigns.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No campaigns yet</td></tr>}
            {campaigns.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.subject}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.recipientType}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLORS[c.status] || ""}`}>{c.status}</span></td>
                <td className="px-4 py-2 text-right">{c.totalSent}</td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/campaigns/${c.id}`} className="text-xs text-primary hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
