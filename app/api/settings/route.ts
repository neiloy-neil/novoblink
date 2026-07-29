import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Public endpoint — only exposes safe tracking/SEO keys
const PUBLIC_KEYS = [
  "ga4_id", "meta_pixel_id", "clarity_id", "meta_title", "meta_description",
  "store_name", "store_tagline", "store_description", "free_shipping_above",
  "support_email", "support_phone", "social_facebook", "social_instagram", "social_tiktok",
  "cod_deposit_enabled", "cod_deposit_amount", "shipping_charge",
  "enabled_payment_methods", "tax_enabled", "tax_rate",
]

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return NextResponse.json(map, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    })
  } catch {
    return NextResponse.json({})
  }
}
