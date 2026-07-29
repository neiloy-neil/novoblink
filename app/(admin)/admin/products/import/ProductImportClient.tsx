"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const REQUIRED_COLS = ["name", "price", "category", "sku", "size", "color"]
const ALL_COLS = [...REQUIRED_COLS, "slug", "comparePrice", "tags", "stock", "costPrice", "variantPrice", "imageUrl"]

type ParsedRow = Record<string, string>
type Result = { row: number; status: "ok" | "error" | "skip"; message?: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"))
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]))
  })
}

export default function ProductImportClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [summary, setSummary] = useState<{ total: number; created: number; skipped: number; errors: number; dryRun: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setHeaders(parsed[0] ? Object.keys(parsed[0]) : [])
      setResults([])
      setSummary(null)
    }
    reader.readAsText(file)
  }

  async function run(dryRun: boolean) {
    if (!rows.length) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dryRun }),
      })
      const data = await res.json()
      setResults(data.results || [])
      setSummary({ total: data.total, created: data.created, skipped: data.skipped, errors: data.errors, dryRun: data.dryRun })
    } catch (e: any) {
      alert(e.message)
    } finally { setLoading(false) }
  }

  const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c))

  return (
    <div className="space-y-6">
      {/* Template download */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
        <div>
          <p className="text-sm font-medium">CSV Template</p>
          <p className="text-xs text-muted-foreground">Required: {REQUIRED_COLS.join(", ")}</p>
          <p className="text-xs text-muted-foreground">Optional: slug, comparePrice, tags, stock, costPrice, variantPrice, imageUrl</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const csv = ALL_COLS.join(",") + "\nExample T-Shirt,,1500,,Tops,,summer casual,TSHIRT-001,M,White,50,800,,https://...\n"
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a"); a.href = url; a.download = "product_import_template.csv"; a.click()
        }}>
          <FileText className="h-4 w-4 mr-2" /> Download Template
        </Button>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">{fileName || "Click to upload CSV file"}</p>
        <p className="text-sm text-muted-foreground mt-1">UTF-8 encoded, comma-separated</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{rows.length} rows detected</p>
            {missingCols.length > 0 && (
              <p className="text-sm text-destructive">Missing required columns: {missingCols.join(", ")}</p>
            )}
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="text-xs w-full">
              <thead className="bg-muted/30 border-b">
                <tr>{headers.map(h => <th key={h} className={`px-3 py-2 text-left font-medium ${REQUIRED_COLS.includes(h) ? "text-foreground" : "text-muted-foreground"}`}>{h}{REQUIRED_COLS.includes(h) ? " *" : ""}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>{headers.map(h => <td key={h} className="px-3 py-2 truncate max-w-[120px]">{row[h]}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="text-xs text-muted-foreground px-3 py-2">…and {rows.length - 5} more rows</p>}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => run(true)} disabled={loading || missingCols.length > 0}>
              {loading ? "Running..." : "Dry Run (preview)"}
            </Button>
            <Button onClick={() => run(false)} disabled={loading || missingCols.length > 0} className="bg-destructive hover:bg-destructive/90">
              {loading ? "Importing..." : `Import ${rows.length} rows`}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {summary && (
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline">{summary.dryRun ? "DRY RUN" : "COMMITTED"}</Badge>
            <Badge variant="default" className="bg-green-600">{summary.created} {summary.dryRun ? "would create" : "created"}</Badge>
            <Badge variant="secondary">{summary.skipped} skipped</Badge>
            {summary.errors > 0 && <Badge variant="destructive">{summary.errors} errors</Badge>}
          </div>
          <div className="rounded-md border overflow-hidden max-h-60 overflow-y-auto">
            {results.map(r => (
              <div key={r.row} className={`flex items-center gap-3 px-3 py-2 text-sm border-b last:border-0 ${r.status === "error" ? "bg-red-50" : r.status === "skip" ? "bg-yellow-50" : "bg-green-50"}`}>
                {r.status === "ok" ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : r.status === "skip" ? <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                <span className="text-muted-foreground w-12 shrink-0">Row {r.row}</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
