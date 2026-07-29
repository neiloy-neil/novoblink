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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tag } from "lucide-react"

type Category = {
  id: string; name: string; slug: string; isActive: boolean
  sortOrder: number; productCount: number
  attr1Label: string; attr2Label: string
  attr1Hint: string; attr2Hint: string
}

export function CategoryClient({ data }: { data: Category[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [attr1Label, setAttr1Label] = useState("")
  const [attr2Label, setAttr2Label] = useState("")
  const [attr1Hint, setAttr1Hint] = useState("")
  const [attr2Hint, setAttr2Hint] = useState("")
  const [saving, setSaving] = useState(false)

  function openEdit(c: Category) {
    setEditing(c)
    setAttr1Label(c.attr1Label); setAttr2Label(c.attr2Label)
    setAttr1Hint(c.attr1Hint); setAttr2Hint(c.attr2Hint)
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attr1Label, attr2Label, attr1Hint, attr2Hint }),
      })
      if (res.ok) {
        toast.success("Category attributes updated")
        setOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save")
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Configure "{editing?.name}" Attributes
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Set what "Size" and "Color" columns mean for this category — e.g. for Gadgets: "Storage" and "Color".
          </p>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Attribute 1 Label</label>
                <Input value={attr1Label} onChange={(e) => setAttr1Label(e.target.value)} placeholder="Size" />
                <p className="text-xs text-muted-foreground mt-1">Maps to the "size" column</p>
              </div>
              <div>
                <label className="text-sm font-medium">Attribute 2 Label</label>
                <Input value={attr2Label} onChange={(e) => setAttr2Label(e.target.value)} placeholder="Color" />
                <p className="text-xs text-muted-foreground mt-1">Maps to the "color" column</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Attribute 1 Options hint</label>
              <Input value={attr1Hint} onChange={(e) => setAttr1Hint(e.target.value)} placeholder="e.g. S, M, L, XL or 128GB, 256GB, 512GB" />
            </div>
            <div>
              <label className="text-sm font-medium">Attribute 2 Options hint</label>
              <Input value={attr2Hint} onChange={(e) => setAttr2Hint(e.target.value)} placeholder="e.g. Red, Black, White or Midnight Black" />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Attr 1 (Size column)</TableHead>
              <TableHead>Attr 2 (Color column)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.productCount}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{c.attr1Label}</span>
                  {c.attr1Hint && <span className="text-muted-foreground ml-1 text-xs">({c.attr1Hint.slice(0, 20)}...)</span>}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{c.attr2Label}</span>
                  {c.attr2Hint && <span className="text-muted-foreground ml-1 text-xs">({c.attr2Hint.slice(0, 20)}...)</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Hidden"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    Configure
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
