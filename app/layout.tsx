import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import Analytics from "@/components/Analytics";
import prisma from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-mono" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://NovoBlink.com.bd"

export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = "NovoBlink | Tech That Moves You"
  let siteDescription = "Bangladesh's premier online gadget store — smartphones, laptops, audio, and accessories. Free delivery above ৳1000."
  let storeName = "NovoBlink"

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["meta_title", "meta_description", "store_name"] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    if (map["meta_title"]) siteTitle = map["meta_title"]
    if (map["meta_description"]) siteDescription = map["meta_description"]
    // storeName is always "NovoBlink" — shared DB has clothing store's value
  } catch { /* DB unavailable — use defaults */ }

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s | ${storeName}`,
    },
    description: siteDescription,
    keywords: ["gadget store Bangladesh", "buy smartphone online BD", "laptop online Bangladesh", "earphones headphones BD", "smartwatch Bangladesh", "online shopping BD", `${storeName}`, "tech accessories Bangladesh"],
    authors: [{ name: storeName }],
    creator: storeName,
    openGraph: {
      type: "website",
      locale: "en_BD",
      url: SITE_URL,
      siteName: storeName,
      title: siteTitle,
      description: siteDescription,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${storeName} — Tech That Moves You` }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, playfair.variable, spaceGrotesk.variable)}>
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased text-novo-text bg-novo-bg selection:bg-novo-blue/30">
        <Analytics />
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
