import { NextResponse } from "next/server"
import { getBestAutoDiscount } from "@/lib/autoDiscount"

export async function POST(req: Request) {
  try {
    const { items, subtotal } = await req.json()
    if (!items?.length) return NextResponse.json({ discount: null })
    const discount = await getBestAutoDiscount(items, Number(subtotal))
    return NextResponse.json({ discount })
  } catch (error: any) {
    return NextResponse.json({ discount: null })
  }
}
