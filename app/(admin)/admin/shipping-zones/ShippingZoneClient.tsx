"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MapPin, Search, ChevronDown, ChevronRight } from "lucide-react"
import { BD_GEO } from "@/lib/bd-geo"

type Zone = { id: string; name: string; districts: string; charge: number; freeShippingAbove: number | null; isActive: boolean; sortOrder: number }

const empty: Omit<Zone, "id"> = { name: "", districts: "", charge: 60, freeShippingAbove: null, isActive: true, sortOrder: 0 }

// Parse districts string → set of selected district names
function parseDistricts(str: string): Set<string> {
  return new Set(str.split(",").map(s => s.trim()).filter(Boolean))
}

// Render district set → sorted comma string
function serializeDistricts(set: Set<string>): string {
  return Array.from(set).sort().join(", ")
}

function DistrictPicker({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [search, setSearch] = useState("")
  const [openDivisions, setOpenDivisions] = useState<Record<string, boolean>>({})
  const q = search.toLowerCase().trim()

  const filtered = useMemo(() => {
    if (!q) return BD_GEO
    return BD_GEO.map(div => ({
      ...div,
      districts: div.districts.filter(d => d.name.toLowerCase().includes(q)),
    })).filter(div => div.districts.length > 0)
  }, [q])

  function toggleDivision(divName: string, open?: boolean) {
    setOpenDivisions(p => ({ ...p, [divName]: open ?? !p[divName] }))
  }

  function isDivisionFullySelected(divName: string) {
    const div = BD_GEO.find(d => d.name === divName)
    return div?.districts.every(d => selected.has(d.name))
  }

  function isDivisionPartiallySelected(divName: string) {
    const div = BD_GEO.find(d => d.name === divName)
    return !isDivisionFullySelected(divName) && div?.districts.some(d => selected.has(d.name))
  }

  function toggleDivisionSelect(divName: string) {
    const div = BD_GEO.find(d => d.name === divName)
    if (!div) return
    const next = new Set(selected)
    const allSelected = isDivisionFullySelected(divName)
    div.districts.forEach(d => allSelected ? next.delete(d.name) : next.add(d.name))
    onChange(next)
  }

  function toggleDistrict(name: string) {
    const next = new Set(selected)
    next.has(name) ? next.delete(name) : next.add(name)
    onChange(next)
  }

  const totalSelected = selected.size

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Districts / Coverage Area</label>
        {totalSelected > 0 && (
          <span className="text-xs text-muted-foreground">{totalSelected} district{totalSelected !== 1 ? "s" : ""} selected</span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) setOpenDivisions(p => Object.fromEntries(BD_GEO.map(d => [d.name, true]))) }}
          placeholder="Search districts…"
          className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tree */}
      <div className="border rounded-md overflow-y-auto max-h-64 bg-white">
        {filtered.map(div => {
          const isOpen = !!openDivisions[div.name] || !!q
          const fullSel = isDivisionFullySelected(div.name)
          const partSel = isDivisionPartiallySelected(div.name)
          return (
            <div key={div.name} className="border-b last:border-b-0">
              {/* Division row */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fullSel}
                  ref={el => { if (el) el.indeterminate = !!partSel && !fullSel }}
                  onChange={() => toggleDivisionSelect(div.name)}
                  className="h-3.5 w-3.5 rounded accent-amber-500"
                  onClick={e => e.stopPropagation()}
                />
                <span className="flex-1 text-sm font-semibold text-slate-700" onClick={() => toggleDivision(div.name)}>
                  {div.name}
                </span>
                <span className="text-xs text-muted-foreground mr-1">
                  {div.districts.filter(d => selected.has(d.name)).length}/{div.districts.length}
                </span>
                <span onClick={() => toggleDivision(div.name)}>
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                </span>
              </div>

              {/* District rows */}
              {isOpen && (
                <div className="pl-6">
                  {div.districts.map(d => (
                    <label key={d.name} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(d.name)}
                        onChange={() => toggleDistrict(d.name)}
                        className="h-3.5 w-3.5 rounded accent-amber-500"
                      />
                      <span>{d.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-center text-muted-foreground">No districts found</div>
        )}
      </div>

      {/* Selected tags preview */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
          {Array.from(selected).sort().map(d => (
            <span key={d} className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 rounded px-1.5 py-0.5">
              {d}
              <button type="button" onClick={() => toggleDistrict(d)} className="hover:text-red-500 font-bold leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ShippingZoneClient({ data }: { data: Zone[] }) {
  const router = useRouter()
  const [zones, setZones] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState(empty)
  const [selectedDistricts, setSelectedDistricts] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setSelectedDistricts(new Set())
    setOpen(true)
  }

  function openEdit(z: Zone) {
    setEditing(z)
    setForm({ name: z.name, districts: z.districts, charge: z.charge, freeShippingAbove: z.freeShippingAbove, isActive: z.isActive, sortOrder: z.sortOrder })
    setSelectedDistricts(parseDistricts(z.districts))
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (selectedDistricts.size === 0) { toast.error("Select at least one district"); return }
    setSaving(true)
    try {
      const payload = { ...form, districts: serializeDistricts(selectedDistricts) }
      const url = editing ? `/api/admin/shipping-zones/${editing.id}` : "/api/admin/shipping-zones"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? "Zone updated" : "Zone created")
      setOpen(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shipping zone?")) return
    await fetch(`/api/admin/shipping-zones/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Zone</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {editing ? "Edit Zone" : "New Shipping Zone"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Zone Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dhaka City, Outside Dhaka" required />
            </div>

            <DistrictPicker selected={selectedDistricts} onChange={setSelectedDistricts} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Delivery Charge (৳)</label>
                <Input type="number" min={0} value={form.charge} onChange={e => setForm({ ...form, charge: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Free Shipping Above (৳)</label>
                <Input type="number" min={0} value={form.freeShippingAbove ?? ""} onChange={e => setForm({ ...form, freeShippingAbove: e.target.value ? Number(e.target.value) : null })} placeholder="Leave blank = global" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm font-medium">Active</label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Zone"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Districts</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Free Above</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No zones yet. Global shipping charge from Settings is used.
                </TableCell>
              </TableRow>
            )}
            {zones.map(z => {
              const distList = z.districts.split(",").map(s => s.trim()).filter(Boolean)
              return (
                <TableRow key={z.id}>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {distList.slice(0, 5).map(d => (
                        <span key={d} className="inline-block text-xs bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">{d}</span>
                      ))}
                      {distList.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{distList.length - 5} more</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">৳{z.charge}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {z.freeShippingAbove ? `৳${z.freeShippingAbove}` : <span className="text-muted-foreground">Global</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={z.isActive ? "default" : "secondary"}>{z.isActive ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(z)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(z.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
