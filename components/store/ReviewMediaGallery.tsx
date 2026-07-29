"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type ReviewWithMedia = {
  id: string
  userId: string
  rating: number
  comment: string | null
  media: { id: string; url: string; type: string }[]
}

export default function ReviewMediaGallery({ reviews }: { reviews: ReviewWithMedia[] }) {
  const allMedia = reviews.flatMap((r) =>
    r.media.map((m) => ({ ...m, reviewerName: "Customer", rating: r.rating }))
  )

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (allMedia.length === 0) return null

  const prev = () => setLightboxIdx((i) => (i !== null ? Math.max(0, i - 1) : null))
  const next = () => setLightboxIdx((i) => (i !== null ? Math.min(allMedia.length - 1, i + 1) : null))

  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted mb-3">
        Customer Photos & Videos ({allMedia.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allMedia.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => setLightboxIdx(idx)}
            className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-novo-border hover:border-novo-blue transition-colors"
          >
            {m.type === "VIDEO" ? (
              <video src={m.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={m.url} alt={`Review by ${m.reviewerName}`} className="w-full h-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white">
            <X className="w-8 h-8" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 text-white disabled:opacity-30" disabled={lightboxIdx === 0}>
            <ChevronLeft className="w-10 h-10" />
          </button>
          <div className="max-w-lg max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {allMedia[lightboxIdx].type === "VIDEO" ? (
              <video src={allMedia[lightboxIdx].url} controls className="max-h-[80vh] rounded-xl" />
            ) : (
              <img src={allMedia[lightboxIdx].url} alt="Review media" className="max-h-[80vh] rounded-xl object-contain" />
            )}
            <p className="text-white text-sm text-center mt-3 opacity-70">
              {"★".repeat(allMedia[lightboxIdx].rating)} by {allMedia[lightboxIdx].reviewerName || "Customer"}
            </p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 text-white disabled:opacity-30" disabled={lightboxIdx === allMedia.length - 1}>
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  )
}
