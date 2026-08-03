"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare, Search, Check, X, Trash2, Eye, EyeOff, Clock } from "lucide-react"

type QA = {
  id: string
  question: string
  answer: string | null
  isPublished: boolean
  createdAt: string
  answeredAt: string | null
  guestName: string | null
  guestEmail: string | null
  product: { id: string; name: string; slug: string }
}

type Filter = "all" | "unanswered" | "unpublished"

export default function QAPage() {
  const [qas, setQas] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<QA | null>(null)
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ filter })
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/qa?${params}`)
    const data = await res.json()
    setQas(data)
    setLoading(false)
  }, [filter, search])

  useEffect(() => { load() }, [load])

  function openQA(qa: QA) {
    setSelected(qa)
    setAnswer(qa.answer || "")
  }

  async function handleSaveAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/qa/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() || null, isPublished: selected.isPublished }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Answer saved")
      setSelected(null)
      load()
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  async function togglePublish(qa: QA, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/admin/qa/${qa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: qa.answer, isPublished: !qa.isPublished }),
      })
      if (!res.ok) throw new Error()
      toast.success(qa.isPublished ? "Hidden from store" : "Published to store")
      load()
    } catch { toast.error("Failed") }
  }

  async function handleDelete(qa: QA, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this question?")) return
    await fetch(`/api/admin/qa/${qa.id}`, { method: "DELETE" })
    toast.success("Deleted")
    load()
  }

  const unansweredCount = qas.filter(q => !q.answer).length
  const unpublishedCount = qas.filter(q => !q.isPublished).length

  const filters: { label: string; value: Filter; count?: number }[] = [
    { label: "All", value: "all" },
    { label: "Unanswered", value: "unanswered", count: unansweredCount },
    { label: "Unpublished", value: "unpublished", count: unpublishedCount },
  ]

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Product Q&amp;A</h2>
        <p className="text-sm text-muted-foreground mt-1">Answer customer questions and control what appears on product pages.</p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                filter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
              {f.count != null && f.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${filter === f.value ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or products…"
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : qas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No questions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qas.map(qa => (
            <div
              key={qa.id}
              onClick={() => openQA(qa)}
              className="bg-white border rounded-xl p-4 cursor-pointer hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Product */}
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 truncate">
                    {qa.product.name}
                  </p>
                  {/* Question */}
                  <p className="font-medium text-slate-900 text-sm leading-snug">{qa.question}</p>
                  {/* Answer preview */}
                  {qa.answer ? (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                      <span className="font-semibold text-slate-700">A: </span>{qa.answer}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Awaiting answer
                    </p>
                  )}
                  {/* Meta */}
                  <p className="text-xs text-muted-foreground mt-2">
                    {qa.guestName ? `${qa.guestName} (guest)` : "Registered user"} · {format(new Date(qa.createdAt), "MMM d, yyyy")}
                  </p>
                </div>

                {/* Badges + Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <Badge variant={qa.answer ? "default" : "secondary"} className="text-xs">
                      {qa.answer ? "Answered" : "Pending"}
                    </Badge>
                    <Badge variant={qa.isPublished ? "default" : "outline"} className="text-xs">
                      {qa.isPublished ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title={qa.isPublished ? "Hide" : "Publish"}
                      onClick={e => togglePublish(qa, e)}
                    >
                      {qa.isPublished ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Delete"
                      onClick={e => handleDelete(qa, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answer dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Answer Question
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <form onSubmit={handleSaveAnswer} className="space-y-4 mt-1">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">{selected.product.name}</p>
                <p className="font-medium text-slate-900 text-sm">{selected.question}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  From: {selected.guestName || "Registered user"}
                  {selected.guestEmail && ` (${selected.guestEmail})`}
                  {" · "}{format(new Date(selected.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your Answer</label>
                <Textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here…"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Leave blank to remove the answer.</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="publish"
                  checked={selected.isPublished}
                  onChange={e => setSelected({ ...selected, isPublished: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="publish" className="text-sm font-medium">Publish on product page</label>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(null)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Saving…" : "Save Answer"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
