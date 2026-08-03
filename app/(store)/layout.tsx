import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import WishlistSync from "@/components/store/WishlistSync"
import AbandonedCartTracker from "@/components/store/AbandonedCartTracker";
import PixelPageView from "@/components/store/PixelPageView";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { getActiveFlashSaleBatch, applyFlashSaleDiscount } from "@/lib/flashSale";

const SETTING_KEYS = [
  "free_shipping_above",
  "store_name",
  "store_tagline",
  "store_description",
  "support_email",
  "support_phone",
  "social_facebook",
  "social_instagram",
  "social_tiktok",
]

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const now = new Date()
  const [settings, categories, sitewideSale] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }).catch(() => []),
    prisma.flashSale.findFirst({
      where: { scope: "SITEWIDE", isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { createdAt: "desc" },
    }).catch(() => null),
  ])

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const freeShippingThreshold = settingsMap.free_shipping_above ? parseInt(settingsMap.free_shipping_above, 10) : null

  const branding = {
    storeName: "NovoBlink",
    storeTagline: "Tech That Moves You",
    storeDescription:
      settingsMap.store_description ||
      "Bangladesh's premier online gadget store — smartphones, laptops, audio, and accessories.",
    supportEmail: settingsMap.support_email || "support@novoblink.com.bd",
    supportPhone: settingsMap.support_phone || "+880 1700 000000",
    socialFacebook: settingsMap.social_facebook || "",
    socialInstagram: settingsMap.social_instagram || "",
    socialTiktok: settingsMap.social_tiktok || "",
  }

  return (
    <div className="min-h-screen flex flex-col bg-novo-bg text-novo-text">
      <Navbar
        freeShippingThreshold={freeShippingThreshold}
        storeName={branding.storeName}
        storeTagline={branding.storeTagline}
        categories={categories}
        activeFlashSale={sitewideSale ? {
          name: sitewideSale.name,
          discountType: sitewideSale.discountType,
          discountValue: Number(sitewideSale.discountValue),
          endsAt: sitewideSale.endsAt.toISOString(),
        } : null}
      />
      <WishlistSync />
      <AbandonedCartTracker />
      <Suspense fallback={null}><PixelPageView /></Suspense>
      <main className="flex-1">
        {children}
      </main>
      <Footer branding={branding} categories={categories} />
    </div>
  );
}
