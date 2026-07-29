import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase"

const BUCKET = "product-images"
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to upload files" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "avif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP, AVIF allowed" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 })
    }

    const filename = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
