"use client"

import { useState, useEffect } from "react"
import { X, Ruler } from "lucide-react"

type SizeGuide = {
  unit: string
  columns: string[]
  rows: string[][]
  notes: string | null
}

export default function SizeGuideModal({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false)
  const [guide, setGuide] = useState<SizeGuide | null>(null)
  const [myMeasure, setMyMeasure] = useState("")
  const [recommended, setRecommended] = useState("")

  useEffect(() => {
    if (open && !guide) {
      fetch(`/api/admin/size-guide?categoryId=${categoryId}`)
        .then(r => r.json())
        .then(d => { if (d && d.columns) setGuide(d) })
        .catch(() => {})
    }
  }, [open, categoryId, guide])

  function findMySize() {
    if (!guide || !myMeasure) return
    const val = Number(myMeasure)
    const chestCol = guide.columns.findIndex(c => c.toLowerCase().includes("chest"))
    if (chestCol < 0) return
    for (const row of guide.rows) {
      const range = row[chestCol]
      if (!range) continue
      const [min, max] = range.split("-").map(Number)
      if (!isNaN(min) && !isNaN(max) && val >= min && val <= max) {
        setRecommended(row[0])
        return
      }
    }
    setRecommended("No exact match — try the closest size")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-novo-text-muted underline underline-offset-4 hover:text-novo-blue transition-colors flex items-center gap-1"
      >
        <Ruler className="w-3.5 h-3.5" /> Size Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-novo-border">
              <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Ruler className="w-5 h-5 text-novo-blue" /> Size Guide</h2>
              <button onClick={() => setOpen(false)} className="text-novo-text-muted hover:text-novo-black transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {!guide && <p className="text-novo-text-muted text-sm">Loading size guide...</p>}

              {guide && (
                <>
                  {/* Measurement table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-novo-border">
                          {guide.columns.map((col, i) => (
                            <th key={i} className="py-2 px-3 text-left text-xs font-bold uppercase tracking-widest text-novo-text-muted">{col} {i > 0 ? `(${guide.unit})` : ""}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {guide.rows.map((row, i) => (
                          <tr key={i} className="border-b border-novo-border/50 hover:bg-novo-muted/30 transition-colors">
                            {row.map((cell, j) => (
                              <td key={j} className={`py-2.5 px-3 ${j === 0 ? "font-bold" : "text-novo-text-muted"}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Size finder */}
                  {guide.columns.some(c => c.toLowerCase().includes("chest")) && (
                    <div className="bg-novo-muted/30 rounded-xl p-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-novo-black mb-3">Find My Size</h3>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-novo-text-muted block mb-1">Your chest measurement ({guide.unit})</label>
                          <input
                            type="number"
                            value={myMeasure}
                            onChange={e => { setMyMeasure(e.target.value); setRecommended("") }}
                            className="w-full bg-white border border-novo-border rounded-lg px-3 py-2 text-sm outline-none focus:border-novo-blue"
                            placeholder="e.g. 92"
                          />
                        </div>
                        <button
                          onClick={findMySize}
                          className="mt-5 px-4 py-2 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-novo-blue transition-colors h-fit"
                        >
                          Find
                        </button>
                      </div>
                      {recommended && (
                        <p className="mt-3 text-sm font-bold text-novo-black">
                          Recommended size: <span className="text-novo-blue">{recommended}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {guide.notes && (
                    <p className="text-xs text-novo-text-muted border-t border-novo-border pt-4">{guide.notes}</p>
                  )}
                </>
              )}

              {!guide && <div className="text-sm text-novo-text-muted">Size guide not available for this category yet.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
