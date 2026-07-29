let pathaoAccessToken: string | null = null;
let pathaoTokenExpiry: number | null = null;

const baseUrl = process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com"
const client_id = process.env.PATHAO_CLIENT_ID
const client_secret = process.env.PATHAO_CLIENT_SECRET
const username = process.env.PATHAO_USERNAME
const password = process.env.PATHAO_PASSWORD

export async function getPathaoToken() {
  if (pathaoAccessToken && pathaoTokenExpiry && Date.now() < pathaoTokenExpiry) {
    return pathaoAccessToken;
  }

  const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      client_id,
      client_secret,
      username,
      password,
      grant_type: "password"
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Pathao Token Grant Failed: ${errText}`)
  }

  const data = await res.json()
  
  if (data.access_token) {
    pathaoAccessToken = data.access_token
    // Default to 1 day if expires_in not provided
    const expiresInSec = data.expires_in || 86400 
    pathaoTokenExpiry = Date.now() + (expiresInSec - 60) * 1000
    return pathaoAccessToken
  }

  throw new Error(`Failed to extract Pathao token: ${JSON.stringify(data)}`)
}

export async function getCities() {
  const token = await getPathaoToken()
  const res = await fetch(`${baseUrl}/aladdin/api/v1/countries/1/city-list`, { // Usually 1 for Bangladesh
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  })
  const data = await res.json()
  return data.data?.data || [] // Pathao API often wraps arrays in data.data
}

export async function getZones(cityId: number) {
  const token = await getPathaoToken()
  const res = await fetch(`${baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  })
  const data = await res.json()
  return data.data?.data || []
}

export async function getAreas(zoneId: number) {
  const token = await getPathaoToken()
  const res = await fetch(`${baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  })
  const data = await res.json()
  return data.data?.data || []
}

export async function createParcel(order: any) {
  const token = await getPathaoToken()
  
  // Format description
  const description = order.items?.map((item: any) => `${item.productName} (${item.quantity})`).join(", ") || "Clothing Items"
  
  // Try to parse city/zone/area as integers, fallback to 0 (which might fail validation on Pathao's side, but expected if mapped incorrectly)
  const cityId = parseInt(order.shippingDistrict) || 1 // 1 = Dhaka
  const zoneId = parseInt(order.shippingArea) || 1
  const areaId = parseInt(order.shippingAddress) || 1 // Fallback

  const payload = {
    store_id: process.env.PATHAO_STORE_ID || 1, // Store ID is required for Pathao
    merchant_order_id: order.orderNumber,
    recipient_name: order.shippingName,
    recipient_phone: order.shippingPhone,
    recipient_address: order.shippingAddress,
    recipient_city: cityId,
    recipient_zone: zoneId,
    recipient_area: areaId,
    delivery_type: 48, // Standard delivery
    item_type: 2, // 1 for Document, 2 for Parcel
    special_instruction: order.note || "",
    item_quantity: order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 1,
    item_weight: 0.5,
    amount_to_collect: order.paymentMethod === "COD" ? Number(order.total) : 0,
    item_description: description
  }

  const res = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Pathao Create Parcel Failed: ${errText}`)
  }

  const data = await res.json()
  
  if (data.type === "error") {
    throw new Error(`Pathao API Error: ${JSON.stringify(data)}`)
  }

  return {
    consignment_id: data.data?.consignment_id,
    tracking_code: data.data?.delivery_id
  }
}

export async function trackParcel(consignmentId: string) {
  const token = await getPathaoToken()
  const res = await fetch(`${baseUrl}/aladdin/api/v1/orders/${consignmentId}/info`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  })
  
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Pathao Track Parcel Failed: ${errText}`)
  }

  const data = await res.json()
  return data.data
}
