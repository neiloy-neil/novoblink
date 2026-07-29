import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCustomerRisk } from "@/lib/customerRisk"

// Lets the checkout UI warn the customer about a COD deposit requirement
// before they place the order, rather than surprising them afterward.
export async function POST(req: Request) {
  try {
    const { phone, total } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 })
    }

    const [depositSetting, amountSetting, risk] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "cod_deposit_enabled" } }),
      prisma.setting.findUnique({ where: { key: "cod_deposit_amount" } }),
      getCustomerRisk(phone),
    ])

    const globallyEnabled = depositSetting?.value === "true"
    const isHighRisk = risk.riskLevel === "HIGH"
    const required = globallyEnabled || isHighRisk
    const amount = required ? Math.min(Number(amountSetting?.value || 100), Number(total) || Infinity) : 0

    return NextResponse.json({ required, amount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
