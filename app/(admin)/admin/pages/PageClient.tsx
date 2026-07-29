"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

type Page = {
  id: string
  slug: string
  title: string
  content: string
  isPublished: boolean
  updatedAt: string
}

export function PageClient({ data }: { data: Page[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Page | null>(null)
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPublished, setIsPublished] = useState(true)

  function openCreate() {
    setEditing(null)
    setSlug(""); setTitle(""); setContent(""); setIsPublished(true)
    setIsDialogOpen(true)
  }

  function openEdit(p: Page) {
    setEditing(p)
    setSlug(p.slug); setTitle(p.title); setContent(p.content); setIsPublished(p.isPublished)
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editing ? `/api/admin/pages/${editing.id}` : "/api/admin/pages"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, content, isPublished }),
      })
      if (res.ok) {
        toast.success(editing ? "Page updated" : "Page created")
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save page")
      }
    } catch {
      toast.error("Error saving page")
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete page "${title}"?`)) return
    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Page deleted")
        router.refresh()
      } else {
        toast.error("Failed to delete page")
      }
    } catch {
      toast.error("Error deleting page")
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger render={<Button onClick={openCreate}>New Page</Button>} />
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">Slug (URL)</label>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="faq"
                  disabled={!!editing}
                />
                <p className="text-xs text-muted-foreground mt-1">/{slug || "your-slug"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Title</label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frequently Asked Questions" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Content (HTML)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="<h2>Question</h2><p>Answer</p>"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              Published (visible on the storefront)
            </label>
            <Button type="submit" className="w-full">{editing ? "Save Changes" : "Create Page"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No pages yet.</TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Link href={`/${p.slug}`} target="_blank" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      /{p.slug} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isPublished ? "default" : "secondary"}>
                      {p.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.updatedAt).toLocaleDateString("en-BD")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id, p.title)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
