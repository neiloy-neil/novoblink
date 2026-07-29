"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function CampaignComposer({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initialData?.name || "",
    subject: initialData?.subject || "",
    previewText: initialData?.previewText || "",
    recipientType: initialData?.recipientType || "ALL",
    bodyHtml: initialData?.bodyHtml || "",
  })
  const [preview, setPreview] = useState(false)

  const save = async (send = false) => {
    if (!form.name || !form.subject || !form.bodyHtml) {
      toast.error("Name, subject and body are required")
      return
    }
    setLoading(true)
    try {
      let id = initialData?.id
      if (!id) {
        const res = await fetch("/api/admin/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        id = data.id
      } else {
        await fetch(`/api/admin/campaigns/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      if (send) {
        const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: "POST" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(`Sent to ${data.sent} recipients`)
      } else {
        toast.success("Campaign saved")
      }
      router.push("/admin/campaigns")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Campaign Name (internal)</label>
              <input className="w-full h-10 px-3 rounded-md border bg-transparent text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer Sale 2026" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subject Line</label>
              <input className="w-full h-10 px-3 rounded-md border bg-transparent text-sm" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Summer deals inside..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Preview Text</label>
              <input className="w-full h-10 px-3 rounded-md border bg-transparent text-sm" value={form.previewText} onChange={e => setForm(f => ({ ...f, previewText: e.target.value }))} placeholder="Short preview shown in inbox..." />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Email Body (HTML)</label>
                <button type="button" onClick={() => setPreview(p => !p)} className="text-xs text-primary">{preview ? "Edit" : "Preview"}</button>
              </div>
              {preview ? (
                <div className="border rounded p-4 min-h-48 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.bodyHtml }} />
              ) : (
                <textarea className="w-full px-3 py-2 rounded-md border bg-transparent text-sm font-mono" rows={12} value={form.bodyHtml} onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))} placeholder="<h1>Hello!</h1><p>Your email content here...</p>" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Recipients</CardTitle></CardHeader>
          <CardContent>
            <select className="w-full h-10 px-3 rounded-md border bg-transparent text-sm" value={form.recipientType} onChange={e => setForm(f => ({ ...f, recipientType: e.target.value }))}>
              <option value="ALL">All Customers</option>
              <option value="CUSTOMERS">Registered Customers</option>
              <option value="VIP">VIP Customers</option>
              <option value="MEMBERS">Members</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-6">
            <Button className="w-full" onClick={() => save(false)} disabled={loading}>Save as Draft</Button>
            <Button variant="destructive" className="w-full" onClick={() => save(true)} disabled={loading}>Send Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
