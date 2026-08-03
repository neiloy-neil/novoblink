"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tag, Plus, Pencil, Trash2 } from "lucide-react"
import { ImageUploadInput } from "@/components/admin/ImageUploadInput"

type Category = {
  id: string; name: string; slug: string; isActive: boolean
  sortOrder: number; productCount: number
  attr1Label: string; attr2Label: string
  attr1Hint: string; attr2Hint: string
  image?: string; description?: string
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^\w-]+/g, "")
}

export function CategoryClient({ data }: { data: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(data)

  // ── Category create/edit dialog ──────────────────────────────
  const [catDialog, setCatDialog] = useState(false)
  const [catEditing, setCatEditing] = useState<Category | null>(null)
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catImage, setCatImage] = useState("")
  const [catDescription, setCatDescription] = useState("")
  const [catSortOrder, setCatSortOrder] = useState(0)
  const [catActive, setCatActive] = useState(true)
  const [catSaving, setCatSaving] = useState(false)

  function openNew() {
    setCatEditing(null)
    setCatName(""); setCatSlug(""); setCatImage(""); setCatDescription(""); setCatSortOrder(categories.length); setCatActive(true)
    setCatDialog(true)
  }

  function openEditCat(c: Category) {
    setCatEditing(c)
    setCatName(c.name); setCatSlug(c.slug); setCatImage(c.image || ""); setCatDescription(c.description || ""); setCatSortOrder(c.sortOrder); setCatActive(c.isActive)
    setCatDialog(true)
  }

  async function saveCat(e: React.FormEvent) {
    e.preventDefault()
    setCatSaving(true)
    try {
      const payload = { name: catName, slug: catSlug, image: catImage || null, description: catDescription || null, sortOrder: catSortOrder, isActive: catActive }
      const res = catEditing
        ? await fetch(`/api/admin/categories/${catEditing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || "Failed"); return }
      toast.success(catEditing ? "Category updated" : "Category created")
      setCatDialog(false)
      router.refresh()
    } finally { setCatSaving(false) }
  }

  async function deleteCategory(c: Category) {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error || "Delete failed"); return }
    toast.success(`"${c.name}" deleted`)
    router.refresh()
  }

  // ── Attribute config dialog ───────────────────────────────────
  const [attrOpen, setAttrOpen] = useState(false)
  const [attrEditing, setAttrEditing] = useState<Category | null>(null)
  const [attr1Label, setAttr1Label] = useState("")
  const [attr2Label, setAttr2Label] = useState("")
  const [attr1Hint, setAttr1Hint] = useState("")
  const [attr2Hint, setAttr2Hint] = useState("")
  const [attrSaving, setAttrSaving] = useState(false)

  function openAttr(c: Category) {
    setAttrEditing(c)
    setAttr1Label(c.attr1Label); setAttr2Label(c.attr2Label)
    setAttr1Hint(c.attr1Hint); setAttr2Hint(c.attr2Hint)
    setAttrOpen(true)
  }

  async function saveAttr(e: React.FormEvent) {
    e.preventDefault()
    if (!attrEditing) return
    setAttrSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${attrEditing.id}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attr1Label, attr2Label, attr1Hint, attr2Hint }),
      })
      if (res.ok) { toast.success("Attributes updated"); setAttrOpen(false); router.refresh() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } finally { setAttrSaving(false) }
  }

  return (
    <div className="space-y-4">

      {/* New Category button */}
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      {/* Category create/edit dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catEditing ? `Edit "${catEditing.name}"` : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCat} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <Input value={catName} onChange={(e) => { setCatName(e.target.value); if (!catEditing) setCatSlug(toSlug(e.target.value)) }} placeholder="Kitchen Accessories" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Slug *</label>
              <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="kitchen-accessories" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Image</label>
              <ImageUploadInput value={catImage} onChange={setCatImage} placeholder="Click or drag to upload category image" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input value={catDescription} onChange={(e) => setCatDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Sort Order</label>
                <Input type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(Number(e.target.value))} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input type="checkbox" id="catActive" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="catActive" className="text-sm font-medium cursor-pointer">Active</label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={catSaving}>
              {catSaving ? "Saving..." : catEditing ? "Update Category" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attribute config dialog */}
      <Dialog open={attrOpen} onOpenChange={setAttrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" /> Configure "{attrEditing?.name}" Attributes
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Set what "Size" and "Color" columns mean for this category — e.g. for Gadgets: "Storage" and "Color".
          </p>
          <form onSubmit={saveAttr} className="space-y-4 mt-2">
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
              <Input value={attr1Hint} onChange={(e) => setAttr1Hint(e.target.value)} placeholder="e.g. S, M, L, XL or 128GB, 256GB" />
            </div>
            <div>
              <label className="text-sm font-medium">Attribute 2 Options hint</label>
              <Input value={attr2Hint} onChange={(e) => setAttr2Hint(e.target.value)} placeholder="e.g. Red, Black, White" />
            </div>
            <Button type="submit" className="w-full" disabled={attrSaving}>
              {attrSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
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
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.productCount}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{c.attr1Label}</span>
                  {c.attr1Hint && <span className="text-muted-foreground ml-1 text-xs">({c.attr1Hint.slice(0, 20)})</span>}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{c.attr2Label}</span>
                  {c.attr2Hint && <span className="text-muted-foreground ml-1 text-xs">({c.attr2Hint.slice(0, 20)})</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Active" : "Hidden"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openAttr(c)}>
                      <Tag className="h-3.5 w-3.5 mr-1" /> Attrs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditCat(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteCategory(c)} disabled={c.productCount > 0} title={c.productCount > 0 ? "Has products — cannot delete" : "Delete"}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
