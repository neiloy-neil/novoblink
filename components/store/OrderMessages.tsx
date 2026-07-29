"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Message = {
  id: string
  fromAdmin: boolean
  message: string
  createdAt: string
  readAt: string | null
}

export default function OrderMessages({ orderId }: { orderId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  async function loadMessages() {
    try {
      const res = await fetch(`/api/store/orders/${orderId}/messages`)
      if (res.ok) setMessages(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMessages() }, [orderId])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/store/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(m => [...m, msg])
        setText("")
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to send message")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-novo-blue" /> Messages
      </h2>

      {loading ? (
        <p className="text-sm text-novo-text-muted">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-novo-text-muted mb-4">No messages yet. Send us a message about your order.</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.fromAdmin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.fromAdmin
                  ? "bg-novo-muted/50 text-novo-black rounded-tl-sm"
                  : "bg-novo-black text-white rounded-tr-sm"
              }`}>
                {m.fromAdmin && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-novo-text-muted mb-1">NovoBlink Support</p>
                )}
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 ${m.fromAdmin ? "text-novo-text-muted" : "text-white/60"}`}>
                  {new Date(m.createdAt).toLocaleString("en-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="flex-1 bg-novo-muted/30 border border-novo-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-novo-blue"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="w-10 h-10 shrink-0 bg-novo-black text-white rounded-full flex items-center justify-center hover:bg-novo-blue transition-colors disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </section>
  )
}
