import prisma from "@/lib/prisma"

const BASE = "https://us1.api.mailchimp.com/3.0"

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY || ""
  const listId = process.env.MAILCHIMP_LIST_ID || ""
  const dc = apiKey.split("-")[1] || "us1"
  const base = `https://${dc}.api.mailchimp.com/3.0`
  return { apiKey, listId, base }
}

export async function mailchimpSubscribe(email: string, name?: string, tags?: string[]) {
  const { apiKey, listId, base } = getConfig()
  if (!apiKey || !listId) return

  const [firstName, ...rest] = (name || "").split(" ")
  await fetch(`${base}/lists/${listId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
      merge_fields: { FNAME: firstName, LNAME: rest.join(" ") },
      tags: tags || [],
    }),
  })

  await prisma.marketingSubscriber.upsert({
    where: { email },
    create: { email, name, provider: "mailchimp", listId, tags: tags || [], syncedAt: new Date() },
    update: { tags: tags || [], syncedAt: new Date() },
  })
}

export async function mailchimpAddTags(email: string, tags: string[]) {
  const { apiKey, listId, base } = getConfig()
  if (!apiKey || !listId) return

  const hash = require("crypto").createHash("md5").update(email.toLowerCase()).digest("hex")
  await fetch(`${base}/lists/${listId}/members/${hash}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({ tags: tags.map((t) => ({ name: t, status: "active" })) }),
  })
}

export async function mailchimpUnsubscribe(email: string) {
  const { apiKey, listId, base } = getConfig()
  if (!apiKey || !listId) return

  const hash = require("crypto").createHash("md5").update(email.toLowerCase()).digest("hex")
  await fetch(`${base}/lists/${listId}/members/${hash}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({ status: "unsubscribed" }),
  })

  await prisma.marketingSubscriber.updateMany({
    where: { email, provider: "mailchimp" },
    data: { status: "unsubscribed", syncedAt: new Date() },
  })
}
