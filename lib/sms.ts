export const smsTemplates = {
  orderConfirmed: (orderNumber: string, total: number) =>
    `NovoBlink: Your order ${orderNumber} is confirmed! Total: ৳${total}. Track: NovoBlink.com/track`,
  orderShipped: (orderNumber: string, tracking: string) =>
    `NovoBlink: Order ${orderNumber} shipped! Tracking: ${tracking}`,
  orderDelivered: (orderNumber: string) =>
    `NovoBlink: Order ${orderNumber} delivered! Hope you love it. Review: NovoBlink.com`,
  orderCancelled: (orderNumber: string) =>
    `NovoBlink: Order ${orderNumber} cancelled. Questions? NovoBlink.com/contact`,
}

export async function sendSms(phone: string, message: string, event: string) {
  const provider = process.env.SMS_PROVIDER || "console"

  if (provider === "console") {
    console.log(`[SMS] To: ${phone} | ${message}`)
  } else if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: from!, Body: message }),
    })
    if (!res.ok) console.error("[SMS] Twilio error:", await res.text())
  } else if (provider === "sslwireless") {
    const res = await fetch("https://core.ssl.com.bd/smsapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_token: process.env.SSL_SMS_TOKEN,
        sid: process.env.SSL_SMS_SID,
        msisdn: phone,
        sms: message,
        csmsid: `DRIP_${Date.now()}`,
      }),
    })
    if (!res.ok) console.error("[SMS] SSL Wireless error:", await res.text())
  }

  // Log to DB (fire and forget)
  import("@/lib/prisma").then(({ default: prisma }) => {
    prisma.smsLog.create({ data: { phone, message, event, provider } }).catch(() => {})
  })
}
