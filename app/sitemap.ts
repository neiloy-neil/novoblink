import { MetadataRoute } from "next"
import prisma from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://NovoBlink.com.bd"

  const [products, categories, blogPosts, pages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, createdAt: true } }).catch(() => []),
    prisma.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
    prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/brands`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/showcase`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const categoryPages: MetadataRoute.Sitemap = (categories as any[]).map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/shop/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }))

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((b) => ({
    url: `${siteUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const contentPages: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${siteUrl}/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages, ...contentPages]
}
