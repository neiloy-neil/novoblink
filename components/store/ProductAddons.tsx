"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

type Addon = {
  id: string
  label: string
  type: string
  options: any
  priceModifier: number | string
  isRequired: boolean
}

export default function ProductAddons({ addons, productId }: { addons: any[]; productId: string }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectValues, setSelectValues] = useState<Record<string, string>>({})

  const total = addons
    .filter((a) => selected[a.id])
    .reduce((s, a) => s + Number(a.priceModifier), 0)

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Add-ons</h3>
      {addons.map((addon) => (
        <div
          key={addon.id}
          className={`border rounded-xl p-4 transition-all cursor-pointer ${selected[addon.id] ? "border-novo-black bg-novo-muted/20" : "border-novo-border hover:border-novo-black/30"}`}
          onClick={() => setSelected({ ...selected, [addon.id]: !selected[addon.id] })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected[addon.id] ? "bg-novo-black border-novo-black" : "border-novo-border"}`}>
                {selected[addon.id] && <Plus className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div>
                <p className="font-semibold text-sm">{addon.label}</p>
              </div>
            </div>
            <span className="font-mono font-bold text-sm shrink-0 ml-2">+৳{Number(addon.priceModifier).toLocaleString()}</span>
          </div>
          {selected[addon.id] && addon.type === "SELECT" && addon.options.length > 0 && (
            <div className="mt-3 pt-3 border-t border-novo-border" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectValues[addon.id] || ""}
                onChange={(e) => setSelectValues({ ...selectValues, [addon.id]: e.target.value })}
                className="w-full bg-white border border-novo-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-novo-blue"
              >
                <option value="">Select option…</option>
                {addon.options.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
      {total > 0 && (
        <p className="text-sm text-novo-text-muted">
          Add-ons total: <span className="font-bold text-novo-black">+৳{total.toLocaleString()}</span>
        </p>
      )}
    </div>
  )
}
