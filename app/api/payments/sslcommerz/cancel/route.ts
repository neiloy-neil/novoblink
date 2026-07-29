import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://novoblink.vercel.app"
  return NextResponse.redirect(`${siteUrl}/checkout?ssl=cancel`, 303)
}
