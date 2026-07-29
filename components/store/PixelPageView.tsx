"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function PixelPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined") return

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

    // Re-fire Meta Pixel PageView on every client-side navigation
    window.fbq?.("track", "PageView")

    // Update GA4 page_path so single-page navigation is tracked
    // GA4_ID is read from the global gtag config already set by Analytics component
    if (window.gtag) {
      // Find the GA4 measurement ID that was initialized
      const dataLayer: any[] = (window as any).dataLayer || []
      const configEntry = dataLayer.find((e: any) => Array.isArray(e) && e[0] === "config")
      const measurementId = configEntry?.[1]
      if (measurementId) {
        window.gtag("config", measurementId, { page_path: url })
      }
    }
  }, [pathname, searchParams])

  return null
}
