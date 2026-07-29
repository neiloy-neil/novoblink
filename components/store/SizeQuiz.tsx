"use client"

import { useState } from "react"
import { X, ChevronRight, Ruler } from "lucide-react"

type Answer = { height: string; weight: string; build: string; fit: string }

const QUESTIONS = [
  {
    key: "height" as const,
    question: "What's your height?",
    options: [
      { label: "Under 5'3\" (160cm)", value: "short" },
      { label: "5'3\" – 5'7\" (160–170cm)", value: "medium" },
      { label: "5'7\" – 5'11\" (170–180cm)", value: "tall" },
      { label: "Over 5'11\" (180cm+)", value: "xtall" },
    ],
  },
  {
    key: "weight" as const,
    question: "What's your weight range?",
    options: [
      { label: "Under 55 kg", value: "xs" },
      { label: "55 – 70 kg", value: "s" },
      { label: "70 – 85 kg", value: "m" },
      { label: "85 – 100 kg", value: "l" },
      { label: "Over 100 kg", value: "xl" },
    ],
  },
  {
    key: "build" as const,
    question: "How would you describe your build?",
    options: [
      { label: "Slim / Athletic", value: "slim" },
      { label: "Average / Regular", value: "regular" },
      { label: "Broad / Muscular", value: "broad" },
      { label: "Plus / Full figure", value: "plus" },
    ],
  },
  {
    key: "fit" as const,
    question: "How do you prefer your clothes to fit?",
    options: [
      { label: "Slim / Fitted", value: "slim" },
      { label: "Regular / True to size", value: "regular" },
      { label: "Relaxed / Oversized", value: "oversized" },
    ],
  },
]

function recommendSize(a: Partial<Answer>): string {
  const weightMap: Record<string, number> = { xs: 0, s: 1, m: 2, l: 3, xl: 4 }
  let score = weightMap[a.weight || "m"] ?? 2
  if (a.build === "broad" || a.build === "plus") score += 1
  if (a.build === "slim") score -= 1
  if (a.fit === "oversized") score += 1
  if (a.fit === "slim") score -= 1
  score = Math.max(0, Math.min(4, score))
  return ["XS", "S", "M", "L", "XL"][score]
}

export default function SizeQuiz({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Answer>>({})
  const [result, setResult] = useState<string | null>(null)

  const current = QUESTIONS[step]

  const handleSelect = (value: string) => {
    const next = { ...answers, [current.key]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      setResult(recommendSize(next))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-novo-border p-6 max-w-md w-full relative">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-novo-text-muted hover:text-novo-black">
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Ruler className="w-5 h-5 text-novo-blue" />
        <h2 className="font-heading font-bold text-lg">Find Your Size</h2>
      </div>

      {result ? (
        <div className="text-center py-4">
          <p className="text-sm text-novo-text-muted mb-3">Based on your answers, we recommend</p>
          <div className="w-24 h-24 rounded-full bg-novo-black text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
            {result}
          </div>
          <p className="text-xs text-novo-text-muted mb-6">
            This is a general recommendation. Check the size guide for exact measurements.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep(0); setAnswers({}); setResult(null) }}
              className="text-xs border border-novo-border rounded-full px-4 py-2 hover:bg-novo-muted transition-colors"
            >
              Retake quiz
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-xs bg-novo-black text-white rounded-full px-4 py-2 hover:bg-novo-blue transition-colors"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 mb-6">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-novo-black" : "bg-novo-muted"}`} />
            ))}
          </div>
          <p className="font-medium text-base mb-4">{current.question}</p>
          <div className="space-y-2">
            {current.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left px-4 py-3 rounded-xl border border-novo-border hover:border-novo-black hover:bg-novo-muted/30 transition-all text-sm flex items-center justify-between group"
              >
                {opt.label}
                <ChevronRight className="w-4 h-4 text-novo-text-muted group-hover:text-novo-black transition-colors" />
              </button>
            ))}
          </div>
          <p className="text-xs text-novo-text-muted mt-4 text-center">
            Question {step + 1} of {QUESTIONS.length}
          </p>
        </>
      )}
    </div>
  )
}
