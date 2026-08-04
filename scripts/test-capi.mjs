/**
 * Run: node scripts/test-capi.mjs
 * Sends a synthetic Purchase test event to Meta CAPI.
 * Requires these env vars to be exported first:
 *   export NEXT_PUBLIC_META_PIXEL_ID=1753613795678344
 *   export META_CAPI_ACCESS_TOKEN=<your_new_token>
 *   export META_CAPI_TEST_EVENT_CODE=TEST12345
 */

import crypto from "crypto"

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE

if (!PIXEL_ID || !ACCESS_TOKEN) {
  console.error("❌  Missing env vars. Export NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN first.")
  process.exit(1)
}

function sha256(v) {
  return crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex")
}

const body = {
  data: [{
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `test-${Date.now()}`,
    event_source_url: "https://novoblink.store/checkout",
    action_source: "website",
    user_data: {
      em: sha256("test@novoblink.store"),
      ph: sha256("8801700000000"),
      client_ip_address: "1.2.3.4",
      client_user_agent: "Mozilla/5.0 (Test)",
    },
    custom_data: {
      currency: "BDT",
      value: 399,
      content_type: "product",
      content_ids: ["KITCHEN-CLEANER-SPRAY-1PCS"],
      num_items: 1,
      order_id: "ORD-TEST-0001",
    },
  }],
}
if (TEST_CODE) body.test_event_code = TEST_CODE

console.log("📡  Sending test Purchase event to Meta CAPI...")
console.log("    Pixel ID:", PIXEL_ID)
console.log("    Test code:", TEST_CODE || "(none — will count as real event!)")

const res = await fetch(
  `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
)
const json = await res.json()

if (json.error) {
  console.error("❌  Meta returned an error:")
  console.error("   ", json.error.message)
  console.error("    Code:", json.error.code, "| Type:", json.error.type)
} else {
  console.log("✅  Success!")
  console.log("    Events received:", json.events_received)
  console.log("    Fbtrace ID:", json.fbtrace_id)
  console.log("")
  console.log("👉  Now go to Meta Events Manager → Test Events tab")
  console.log("    You should see a 'Purchase' event with source: Server")
}
