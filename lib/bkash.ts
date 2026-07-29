let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const baseUrl = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
const username = process.env.BKASH_USERNAME
const password = process.env.BKASH_PASSWORD
const app_key = process.env.BKASH_APP_KEY
const app_secret = process.env.BKASH_APP_SECRET

export async function getBkashToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "username": username || "",
      "password": password || "",
    },
    body: JSON.stringify({
      app_key,
      app_secret
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Token Grant Failed: ${errorText}`)
  }

  const data = await res.json()
  
  if (data.id_token) {
    cachedToken = data.id_token
    // expires_in is in seconds, buffer 1 minute
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return cachedToken
  }

  throw new Error(`Failed to extract bKash token: ${JSON.stringify(data)}`)
}

export async function createPayment(amount: number, orderId: string) {
  const token = await getBkashToken();
  const res = await fetch(`${baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": token || "",
      "x-app-key": app_key || "",
    },
    body: JSON.stringify({
      mode: "0011", // checkout
      payerReference: orderId,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/bkash/callback?orderId=${orderId}`,
      amount: amount.toString(),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId,
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Create Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  if (data.bkashURL && data.paymentID) {
    return { bkashURL: data.bkashURL, paymentID: data.paymentID }
  }

  throw new Error(`Failed to create bKash payment: ${JSON.stringify(data)}`)
}

export async function executePayment(paymentID: string) {
  const token = await getBkashToken();
  const res = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": token || "",
      "x-app-key": app_key || "",
    },
    body: JSON.stringify({
      paymentID
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Execute Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  return data // typically includes transactionStatus, trxID, paymentID, amount, intent, etc.
}

export async function queryPayment(paymentID: string) {
  const token = await getBkashToken();
  const res = await fetch(`${baseUrl}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": token || "",
      "x-app-key": app_key || "",
    },
    body: JSON.stringify({
      paymentID
    })
  })

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`bKash Query Payment Failed: ${errorText}`)
  }

  const data = await res.json()
  return data
}
