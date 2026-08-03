"use client"

import { useRef, useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"

export function ImageUploadInput({
  value,
  onChange,
  placeholder = "Click or drag to upload",
  className = "",
}: {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    setError("")
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Upload failed")
      onChange(d.url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (value) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img src={value} alt="Uploaded image" className="h-28 w-28 rounded-md object-cover border" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-0.5 hover:bg-black transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-black transition-colors"
        >
          Change
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg p-5 cursor-pointer text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors select-none"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "" }}
        />
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">{placeholder}</span>
            <span className="text-[11px]">JPG, PNG, WEBP, AVIF · Max 5 MB</span>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
