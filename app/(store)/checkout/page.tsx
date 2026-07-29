import CheckoutForm from "@/components/store/CheckoutForm"
import { ShieldCheck } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export default async function CheckoutPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [settings, checkoutFields, loyaltyData, creditData] = await Promise.all([
    prisma.setting.findMany({
      where: { key: { in: ["free_shipping_above", "shipping_charge", "enabled_payment_methods", "tax_enabled", "tax_rate", "tax_label", "gift_wrap_enabled", "gift_wrap_charge", "loyalty_points_per_taka", "loyalty_redemption_rate"] } },
    }).catch(() => []),
    prisma.checkoutField.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    userId ? prisma.loyaltyPoint.aggregate({ where: { userId }, _sum: { points: true } }).catch(() => null) : null,
    userId ? prisma.storeCredit.findUnique({ where: { userId } }).catch(() => null) : null,
  ])

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const freeShippingThreshold = Number(map.free_shipping_above || 1000)
  const shippingChargeAmount = Number(map.shipping_charge || 60)
  const enabledMethods = map.enabled_payment_methods
    ? map.enabled_payment_methods.split(",").map((s) => s.trim())
    : ["COD", "BKASH", "NAGAD"]
  const taxEnabled = map.tax_enabled === "true"
  const taxRate = Number(map.tax_rate || 0)
  const taxLabel = map.tax_label || "VAT"
  const giftWrapEnabled = map.gift_wrap_enabled === "true"
  const giftWrapCharge = Number(map.gift_wrap_charge || 50)

  const loyaltyBalance = loyaltyData?._sum?.points ?? 0
  // 100 points = ৳1 by default (configurable)
  const loyaltyRedemptionRate = Number(map.loyalty_redemption_rate || 100)
  const loyaltyMaxDiscount = Math.floor(loyaltyBalance / loyaltyRedemptionRate)

  const storeCreditBalance = Number(creditData?.balance ?? 0)

  const serialisedFields = JSON.parse(JSON.stringify(checkoutFields))

  return (
    <div className="bg-novo-bg min-h-screen pt-8 pb-24 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-novo-black mb-2">Checkout</h1>
          <p className="text-xs text-novo-text-muted flex items-center gap-1 uppercase tracking-widest font-medium">
            <ShieldCheck className="w-4 h-4 text-novo-success" /> Secure 256-bit SSL Encryption
          </p>
        </div>

        <CheckoutForm
          freeShippingThreshold={freeShippingThreshold}
          shippingChargeAmount={shippingChargeAmount}
          enabledPaymentMethods={enabledMethods}
          taxEnabled={taxEnabled}
          taxRate={taxRate}
          taxLabel={taxLabel}
          giftWrapEnabled={giftWrapEnabled}
          giftWrapCharge={giftWrapCharge}
          checkoutFields={serialisedFields}
          loyaltyBalance={loyaltyBalance}
          loyaltyMaxDiscount={loyaltyMaxDiscount}
          storeCreditBalance={storeCreditBalance}
          userId={userId}
        />
      </div>
    </div>
  )
}
