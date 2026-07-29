"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "@/hooks/useSession"
import { Star, Loader2, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type Review = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string | null }
  media?: { url: string }[]
}

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-novo-blue text-novo-blue" : "text-novo-border"}
        />
      ))}
    </div>
  )
}

export default function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || [])
        setAverage(d.average || 0)
        setCount(d.count || 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [productId])

  function addPhotos(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 4 - photos.length)
    setPhotos(p => [...p, ...newFiles])
    setPreviews(p => [...p, ...newFiles.map(f => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i])
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) {
      toast.error("Please select a star rating")
      return
    }
    setSubmitting(true)
    try {
      // Upload photos first
      const mediaUrls: string[] = []
      for (const file of photos) {
        const fd = new FormData()
        fd.append("file", file)
        const up = await fetch("/api/store/upload", { method: "POST", body: fd })
        if (up.ok) {
          const { url } = await up.json()
          mediaUrls.push(url)
        }
      }

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, mediaUrls }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review")
      } else {
        toast.success("Thanks! Your review is pending approval and will appear shortly.")
        setShowForm(false)
        setRating(0)
        setComment("")
        setPhotos([])
        setPreviews([])
        load()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <StarRow value={average} size={20} />
        <span className="text-sm text-novo-text-muted">
          {count > 0 ? `${average.toFixed(1)} out of 5 (${count} review${count === 1 ? "" : "s"})` : "No reviews yet"}
        </span>
      </div>

      {session?.user ? (
        showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 p-4 border border-novo-border rounded-xl bg-novo-muted/30">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star
                    width={24}
                    height={24}
                    className={n <= rating ? "fill-novo-blue text-novo-blue" : "text-novo-border"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product (optional)"
              rows={3}
              className="w-full bg-white border border-novo-border rounded-lg px-3 py-2 text-sm outline-none focus:border-novo-blue resize-none"
            />
            {/* Photo upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => addPhotos(e.target.files)}
              />
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-novo-border group">
                    <Image src={src} alt="preview" fill sizes="64px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border border-dashed border-novo-border flex flex-col items-center justify-center gap-1 text-novo-text-muted hover:border-novo-blue hover:text-novo-blue transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span className="text-[9px] font-bold uppercase">Photo</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-novo-text-muted hover:text-novo-black"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold uppercase tracking-widest text-novo-blue hover:underline"
          >
            Write a Review
          </button>
        )
      ) : (
        <p className="text-xs text-novo-text-muted">
          <a href="/login" className="underline hover:text-novo-blue">Sign in</a> to write a review.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-novo-text-muted">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-novo-text-muted">Be the first to review this product.</p>
      ) : (
        <div className="space-y-4 pt-2">
          {reviews.map((r) => (
            <div key={r.id} className="border-t border-novo-border pt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-novo-black">{r.user.name || "Anonymous"}</span>
                <span className="text-xs text-novo-text-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-BD")}
                </span>
              </div>
              <StarRow value={r.rating} />
              {r.comment && <p className="text-sm text-novo-text-muted mt-2">{r.comment}</p>}
              {r.media && r.media.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.media.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-novo-border hover:opacity-80 transition-opacity">
                      <Image src={m.url} alt="review photo" fill sizes="64px" className="object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
