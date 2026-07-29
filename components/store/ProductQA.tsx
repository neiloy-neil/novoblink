"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MessageCircleQuestion, ChevronDown, ChevronUp } from "lucide-react"

type QA = {
  id: string
  question: string
  answer: string | null
  guestName: string | null
  createdAt: string
}

export default function ProductQA({ productId, qas }: { productId: string; qas: any[] }) {
  const [question, setQuestion] = useState("")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? qas : qas.slice(0, 3)
  const answered = qas.filter((q) => q.answer)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/store/product-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, question, guestName: name }),
      })
      if (res.ok) { setDone(true); toast.success("Question submitted! We'll answer it soon.") }
      else toast.error("Failed to submit question")
    } catch {
      toast.error("Failed to submit question")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {answered.length === 0 && qas.length === 0 && (
        <p className="text-sm text-novo-text-muted">No questions yet. Be the first to ask!</p>
      )}

      {visible.filter((q) => q.answer).map((qa) => (
        <div key={qa.id} className="border border-novo-border rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <MessageCircleQuestion className="w-4 h-4 text-novo-blue shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{qa.question}</p>
          </div>
          <div className="pl-6 text-sm text-novo-text-muted border-l-2 border-novo-blue/30 ml-2">
            {qa.answer}
          </div>
        </div>
      ))}

      {qas.filter((q) => q.answer).length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-xs text-novo-blue font-bold uppercase tracking-widest"
        >
          {showAll ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {answered.length} answers</>}
        </button>
      )}

      {!done ? (
        <form onSubmit={handleSubmit} className="border border-novo-border rounded-xl p-4 space-y-3 bg-novo-muted/10">
          <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Ask a question</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full bg-white border border-novo-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-novo-blue"
          />
          <textarea
            required
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            className="w-full bg-white border border-novo-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-novo-blue resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Question"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-novo-success font-medium">Your question was submitted. We'll answer it soon!</p>
      )}
    </div>
  )
}
