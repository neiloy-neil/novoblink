"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s }
}

export default function FlashSaleCountdown({
  saleName,
  discountLabel,
  endsAt,
  compact = false,
}: {
  saleName: string
  discountLabel: string
  endsAt: string
  compact?: boolean
}) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft(endsAt)
      setTimeLeft(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!timeLeft) return null

  const pad = (n: number) => String(n).padStart(2, "0")

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 bg-novo-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        <Zap className="w-3 h-3" />
        {discountLabel} · {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-novo-error/10 border border-novo-error/20 rounded-xl">
      <Zap className="w-5 h-5 text-novo-error shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-novo-error">{saleName}</p>
        <p className="text-xs text-novo-text-muted mt-0.5">{discountLabel} — ends in</p>
      </div>
      <div className="flex items-center gap-1 font-mono font-bold text-novo-error text-sm">
        <span className="bg-novo-error/10 px-2 py-1 rounded">{pad(timeLeft.h)}</span>
        <span>:</span>
        <span className="bg-novo-error/10 px-2 py-1 rounded">{pad(timeLeft.m)}</span>
        <span>:</span>
        <span className="bg-novo-error/10 px-2 py-1 rounded">{pad(timeLeft.s)}</span>
      </div>
    </div>
  )
}
