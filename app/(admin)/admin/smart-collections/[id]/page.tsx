"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, Trash2, Loader2 } from "lucide-react"

type Rule = { field: string; operator: string; value: string }

const FIELDS = [
  { value: "price", label: "Price (৳)" },
  { value: "tag", label: "Product Tag" },
  { value: "category", label: "Category slug" },
  { value: "vendor", label: "Brand slug" },
  { value: "title", label: "Product name" },
]

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  price: [
    { value: "less_than", label: "is less than" },
    { value: "greater_than", label: "is greater than" },
    { value: "equals", label: "equals" },
  ],
  default: [
    { value: "equals", label: "equals" },
    { value: "contains", label: "contains" },
  ],
}

export default function EditSmartCollectionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", slug: "", description: "", ruleMatch: "all", sortBy: "created_desc", isActive: true })
  const [rules, setRules] = useState<Rule[]>([{ field: "price", operator: "less_than", value: "" }])

  useEffect(() => {
    fetch(`/api/admin/smart-collections/${id}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          name: d.name || "",
          slug: d.slug || "",
          description: d.description || "",
          ruleMatch: d.ruleMatch || "all",
          sortBy: d.sortBy || "created_desc",
          isActive: d.isActive ?? true,
        })
        if (Array.isArray(d.rules) && d.rules.length > 0) setRules(d.rules)
      })
      .catch(() => toast.error("Failed to load collection"))
      .finally(() => setFetching(false))
  }, [id])

  const addRule = () => setRules(r => [...r, { field: "price", operator: "less_than", value: "" }])
  const removeRule = (i: number) => setRules(r => r.filter((_, idx) => idx !== i))
  const updateRule = (i: number, patch: Partial<Rule>) =>
    setRules(r => r.map((rule, idx) => idx === i ? { ...rule, ...patch } : rule))

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/smart-collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rules }),
      })
      if (res.ok) {
        toast.success("Collection updated")
        router.push("/admin/smart-collections")
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save")
      }
    } finally { setSaving(false) }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Smart Collection</h1>
        <p className="text-sm text-muted-foreground mt-1">Products are added automatically based on rules</p>
      </div>

      <div className="space-y-4 border rounded-lg p-5">
        <h2 className="font-semibold text-sm">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Under ৳1000" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="under-1000" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description (optional)</label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Products under ৳1000" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Sort products by</label>
            <select value={form.sortBy} onChange={e => setForm(f => ({ ...f, sortBy: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="created_desc">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </div>
          <div className="flex items-end gap-3 pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              <span className="text-sm font-medium">Active (visible on store)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Rules</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Products must match
              <select value={form.ruleMatch} onChange={e => setForm(f => ({ ...f, ruleMatch: e.target.value }))} className="mx-1 border-b border-dashed border-foreground bg-transparent text-xs font-medium focus:outline-none">
                <option value="all">all</option>
                <option value="any">any</option>
              </select>
              of these rules
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addRule} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add rule</Button>
        </div>

        <div className="space-y-2">
          {rules.map((rule, i) => {
            const ops = OPERATORS[rule.field] || OPERATORS.default
            return (
              <div key={i} className="flex items-center gap-2">
                <select value={rule.field} onChange={e => updateRule(i, { field: e.target.value, operator: (OPERATORS[e.target.value] || OPERATORS.default)[0].value })} className="flex-1 h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select value={rule.operator} onChange={e => updateRule(i, { operator: e.target.value })} className="flex-1 h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Input value={rule.value} onChange={e => updateRule(i, { value: e.target.value })} placeholder="value" className="flex-1 h-9" />
                {rules.length > 1 && <button onClick={() => removeRule(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        <Button variant="outline" onClick={() => router.push("/admin/smart-collections")}>Cancel</Button>
      </div>
    </div>
  )
}
