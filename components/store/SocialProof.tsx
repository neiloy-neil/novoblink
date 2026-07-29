"use client"

import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"

type ProofEvent = {
  name: string
  district: string
  productName: string
  minutesAgo: number
}

export default function SocialProof({ productId }: { productId?: string }) {
  const [events, setEvents] = useState<ProofEvent[]>([])
  const [soldToday, setSoldToday] = useState(0)
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const url = productId ? `/api/store/social-proof?productId=${productId}` : `/api/store/social-proof`
    fetch(url).then(r => r.json()).then(data => {
      if (data.events?.length) { setEvents(data.events); setSoldToday(data.soldToday || 0) }
    }).catch(() => {})
  }, [productId])

  useEffect(() => {
    if (!events.length) return
    let idx = 0
    const show = () => {
      setCurrent(idx)
      setVisible(true)
      const hide = setTimeout(() => setVisible(false), 4000)
      idx = (idx + 1) % events.length
      return hide
    }
    const initialDelay = setTimeout(() => {
      show()
      const interval = setInterval(() => show(), 8000)
      return () => clearInterval(interval)
    }, 3000)
    return () => clearTimeout(initialDelay)
  }, [events])

  if (!events.length) return null

  const event = events[current]

  return (
    <>
      {/* Recently purchased toast */}
      <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="bg-white border border-novo-border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-xs">
          <div className="w-10 h-10 bg-novo-muted rounded-lg flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-novo-blue" />
          </div>
          <div>
            <p className="text-xs font-bold text-novo-black">{event?.name} from {event?.district}</p>
            <p className="text-xs text-novo-text-muted">Ordered {event?.productName}</p>
            <p className="text-[10px] text-novo-text-muted mt-0.5">{event?.minutesAgo < 60 ? `${event?.minutesAgo}m ago` : `${Math.floor((event?.minutesAgo || 0) / 60)}h ago`}</p>
          </div>
        </div>
      </div>

      {/* Sold today badge (shown inline on PDP when > 0) */}
      {soldToday > 0 && (
        <p className="text-xs font-bold text-novo-blue flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-novo-blue block animate-pulse" />
          {soldToday} sold in the last 24 hours
        </p>
      )}
    </>
  )
}
