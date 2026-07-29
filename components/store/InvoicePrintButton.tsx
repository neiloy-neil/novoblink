"use client"

import { Printer } from "lucide-react"

export default function InvoicePrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2.5 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors flex items-center gap-2"
    >
      <Printer className="w-4 h-4" /> Download / Print
    </button>
  )
}
