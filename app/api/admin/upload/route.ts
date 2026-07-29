import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import { createAdminClient } from "@/lib/supabase"

const BUCKET = "product-images"

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = createAdminClient()

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5242880 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "avif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, AVIF allowed" }, { status: 400 })
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, arrayBuffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
