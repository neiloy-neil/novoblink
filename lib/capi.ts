import crypto from "crypto"

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

// Normalise a BD phone number to E.164-ish digits for Meta: 880XXXXXXXXX
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("880")) return digits
  if (digits.startsWith("0")) return "880" + digits.slice(1)
  return "880" + digits
}

interface CAPIUserData {
  email?: string
  phone?: string
  client_ip_address?: string
  client_user_agent?: string
  fbp?: string   // _fbp cookie
  fbc?: string   // _fbc cookie
}

interface CAPIEvent {
  event_name: string
  event_time: number
  /** Use order.id / product.id so the browser Pixel can send the same value and Meta deduplicates */
  event_id: string
  event_source_url: string
  user_data?: CAPIUserData
  custom_data?: Record<string, unknown>
}

export async function sendCAPIEvent(event: CAPIEvent): Promise<void> {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
  const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE

  if (!PIXEL_ID || !ACCESS_TOKEN) return

  const { email, phone, ...passthroughUserData } = event.user_data || {}

  // Hash PII before sending — Meta requires SHA-256, lowercase, trimmed
  const hashedUserData: Record<string, string | undefined> = { ...passthroughUserData }
  if (email) hashedUserData.em = sha256(email)
  if (phone) hashedUserData.ph = sha256(normalisePhone(phone))

  const body: Record<string, unknown> = {
    data: [{
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      event_source_url: event.event_source_url,
      action_source: "website",
      user_data: hashedUserData,
      custom_data: event.custom_data,
    }],
  }
  if (TEST_CODE) body.test_event_code = TEST_CODE

  await fetch(
    `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  ).catch(() => {}) // fire-and-forget; never block the checkout response
}
