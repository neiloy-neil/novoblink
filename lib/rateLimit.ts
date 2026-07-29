import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

type RateLimitConfig = {
  windowMs: number  // window size in ms
  max: number       // max requests per window
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  checkout:      { windowMs: 60_000, max: 5  },   // 5 orders / min
  "apply-coupon": { windowMs: 60_000, max: 20 },  // 20 checks / min
  referral:      { windowMs: 60_000, max: 5  },   // 5 claims / min
}

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Sliding-window rate limiter backed by Prisma (no Redis required).
 * Returns a 429 NextResponse if over limit, otherwise null (allow).
 *
 * Usage:
 *   const limited = await rateLimit(req, "checkout")
 *   if (limited) return limited
 */
export async function rateLimit(
  req: Request,
  endpoint: string,
  overrides?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  const config = { ...DEFAULTS[endpoint], ...overrides }
  if (!config?.max) return null  // no config = allow

  const ip = getIp(req)
  const key = `${endpoint}:${ip}`
  const now = new Date()
  const windowEnd = new Date(now.getTime() + config.windowMs)

  try {
    // Atomically upsert: if window expired, reset; otherwise increment
    const existing = await prisma.rateLimit.findUnique({ where: { key } })

    if (!existing || existing.windowEnd < now) {
      // New window
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowEnd },
        update: { count: 1, windowEnd },
      })
      return null  // first request in window, always allow
    }

    if (existing.count >= config.max) {
      const retryAfter = Math.ceil((existing.windowEnd.getTime() - now.getTime()) / 1000)
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    })
    return null  // under limit
  } catch {
    // DB error — fail open (don't block legitimate traffic)
    return null
  }
}

/** Periodic cleanup of expired windows — call from a cron or background task */
export async function cleanExpiredRateLimits() {
  await prisma.rateLimit.deleteMany({ where: { windowEnd: { lt: new Date() } } })
}
