"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"

type Post = { id: string; title: string; slug: string; authorName: string; isPublished: boolean; createdAt: string; category: { name: string } | null }

const empty = { title: "", slug: "", excerpt: "", content: "", coverImage: "", authorName: "Admin", tags: "", isPublished: false }

export default function BlogAdminClient({ data }: { data: Post[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(p: Post) {
    setEditing(p)
    setForm({ title: p.title, slug: p.slug, excerpt: "", content: "", coverImage: "", authorName: p.authorName, tags: "", isPublished: p.isPublished })
    setOpen(true)
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? "Post updated" : "Post created")
      setOpen(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> New Post</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Post" : "New Blog Post"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : autoSlug(e.target.value) })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from title" />
            </div>
            <div>
              <label className="text-sm font-medium">Excerpt</label>
              <Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description shown in listing..." />
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image URL</label>
              <Input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium">Content (HTML)</label>
              <textarea rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm font-mono resize-y" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Author</label>
                <Input value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="fashion, tips, style" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pub" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="pub" className="text-sm font-medium">Published</label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save Post"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No posts yet</TableCell></TableRow>}
            {data.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.authorName}</TableCell>
                <TableCell><Badge variant={p.isPublished ? "default" : "secondary"}>{p.isPublished ? "Published" : "Draft"}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {p.isPublished && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></a>}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
