"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Star, Check, X, Trash2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type Review = {
  id: string
  rating: number
  comment: string | null
  isApproved: boolean
  helpful: number
  createdAt: string
  user: { name: string | null; email: string | null }
  product: { name: string; slug: string }
  media: { url: string; type: string }[]
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </span>
  )
}

export default function ReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending")
  const [loading, setLoading] = useState(false)

  async function changeFilter(f: "pending" | "approved" | "all") {
    setFilter(f)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?status=${f}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch { toast.error("Failed to load") }
    finally { setLoading(false) }
  }

  async function act(id: string, action: "approve" | "reject" | "delete") {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setReviews(prev => prev.filter(r => r.id !== id))
      toast.success(action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Deleted")
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
  }

  const pending = reviews.filter(r => !r.isApproved).length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-1">Moderate customer product reviews.</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => changeFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending}</span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/20">
          No {filter === "all" ? "" : filter} reviews
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border rounded-lg bg-white p-5 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} />
                    <Badge variant={r.isApproved ? "default" : "secondary"}>
                      {r.isApproved ? "Approved" : "Pending"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium">{r.user.name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{r.user.email}</p>
                </div>
                <a
                  href={`/shop/${r.product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  {r.product.name} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {r.comment && (
                <p className="text-sm text-gray-700 bg-muted/30 rounded p-3">{r.comment}</p>
              )}

              {r.media.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.media.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="relative w-16 h-16 rounded border overflow-hidden hover:opacity-80 transition-opacity">
                      <Image src={m.url} alt="review media" fill sizes="64px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {!r.isApproved && (
                  <Button size="sm" onClick={() => act(r.id, "approve")} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                {r.isApproved && (
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "reject")} className="gap-1">
                    <X className="w-3.5 h-3.5" /> Unapprove
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => act(r.id, "delete")} className="gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
