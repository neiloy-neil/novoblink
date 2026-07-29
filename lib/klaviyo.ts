import prisma from "@/lib/prisma"

const BASE = "https://a.klaviyo.com/api"

function headers() {
  return {
    "Content-Type": "application/json",
    revision: "2024-02-15",
    Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY || ""}`,
  }
}

export async function klaviyoTrackEvent(event: string, email: string, properties: Record<string, any> = {}) {
  if (!process.env.KLAVIYO_API_KEY) return

  await fetch(`${BASE}/events/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: "event",
        attributes: {
          metric: { data: { type: "metric", attributes: { name: event } } },
          profile: { data: { type: "profile", attributes: { email } } },
          properties,
        },
      },
    }),
  })
}

export async function klaviyoSubscribe(email: string, name?: string, listId?: string) {
  const lid = listId || process.env.KLAVIYO_LIST_ID
  if (!process.env.KLAVIYO_API_KEY || !lid) return

  const [firstName, ...rest] = (name || "").split(" ")
  await fetch(`${BASE}/profile-subscription-bulk-create-jobs/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          list_id: lid,
          subscriptions: [{ email, first_name: firstName, last_name: rest.join(" ") }],
        },
      },
    }),
  })

  await prisma.marketingSubscriber.upsert({
    where: { email },
    create: { email, name, provider: "klaviyo", listId: lid, syncedAt: new Date() },
    update: { syncedAt: new Date() },
  })
}

export async function klaviyoOrderPlaced(email: string, order: {
  orderNumber: string
  total: number
  items: { productName: string; quantity: number; price: number }[]
}) {
  await klaviyoTrackEvent("Placed Order", email, {
    $event_id: order.orderNumber,
    $value: order.total,
    Items: order.items,
  })
}
