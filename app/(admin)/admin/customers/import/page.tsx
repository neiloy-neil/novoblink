"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function parseCSVPreview(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const headers = lines[0]?.split(",").map(h => h.trim().replace(/['"]/g, "")) || []
  const rows = lines.slice(1, 6).map(line => line.split(",").map(v => v.trim().replace(/^"|"$/g, "")))
  return { headers, rows }
}

export default function CustomerImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setResult(null)
    const text = await f.text()
    setPreview(parseCSVPreview(text))
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/customers/import", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      toast.success(`Imported ${data.imported} customers`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Import Customers</h1>
          <p className="text-sm text-muted-foreground">Upload a CSV with columns: name, email, phone, role</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Upload CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {file ? <p className="text-sm font-medium">{file.name}</p> : <p className="text-sm text-muted-foreground">Click to upload CSV file</p>}
          </div>

          {preview && (
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 5 rows)</p>
              <div className="overflow-x-auto border rounded">
                <table className="text-xs w-full">
                  <thead className="bg-muted"><tr>{preview.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
                  <tbody>{preview.rows.map((row, i) => <tr key={i} className="border-t">{row.map((v, j) => <td key={j} className="px-3 py-1.5">{v}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <Button onClick={handleImport} disabled={loading} className="mt-4">
                {loading ? "Importing..." : "Import Customers"}
              </Button>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-muted text-sm space-y-1">
              <p className="font-semibold">Import Complete</p>
              <p className="text-green-600">Imported: {result.imported}</p>
              <p className="text-yellow-600">Skipped (already exist): {result.skipped}</p>
              {result.errors.length > 0 && (
                <div><p className="text-red-600">Errors: {result.errors.length}</p>
                  <ul className="mt-1 space-y-0.5">{result.errors.slice(0, 5).map((e, i) => <li key={i} className="text-red-500 text-xs">{e}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
