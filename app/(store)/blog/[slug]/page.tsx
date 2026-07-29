import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import ProductCard from "@/components/store/ProductCard"
import { serialize } from "@/lib/utils"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug, isPublished: true } }).catch(() => null)
  if (!post) return { title: "Not Found" }
  return { title: post.title, description: post.excerpt || "", openGraph: { images: post.coverImage ? [post.coverImage] : [] } }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
    include: {
      category: true,
      products: { include: { product: { include: { images: true, variants: true, category: true } } } },
    },
  }).catch(() => null)

  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    author: { "@type": "Person", name: post.authorName },
    datePublished: post.publishedAt?.toISOString(),
    image: post.coverImage || undefined,
  }

  return (
    <div className="bg-novo-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {post.coverImage && (
        <div className="relative w-full aspect-[21/9] overflow-hidden">
          <Image src={post.coverImage} alt={post.title} fill sizes="100vw" className="object-cover" />
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-4 flex items-center gap-3 text-xs text-novo-text-muted">
          <a href="/blog" className="hover:text-novo-blue transition-colors">Journal</a>
          <span>/</span>
          {post.category && <span className="text-novo-blue font-bold uppercase tracking-widest">{post.category.name}</span>}
        </div>
        <h1 className="text-4xl font-heading font-bold text-novo-black mb-4 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-novo-text-muted mb-10 pb-8 border-b border-novo-border">
          <span>By {post.authorName}</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span>}
          {post.tags && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.split(",").map(t => (
                <span key={t} className="px-2 py-0.5 bg-novo-muted text-novo-text-muted text-xs rounded">{t.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="prose prose-lg max-w-none text-novo-text" dangerouslySetInnerHTML={{ __html: post.content }} />

        {post.products.length > 0 && (
          <div className="mt-16 pt-8 border-t border-novo-border">
            <h2 className="text-2xl font-heading font-bold mb-6">Featured Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serialize(post.products.map(bp => bp.product)).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
