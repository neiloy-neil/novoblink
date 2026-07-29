import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export async function renderContentPage(slug: string, fallbackTitle: string) {
  const page = await prisma.page.findUnique({ where: { slug } })

  if (!page || !page.isPublished) {
    return { title: fallbackTitle, content: null }
  }

  return { title: page.title, content: page.content }
}

export default function ContentPage({ title, content }: { title: string; content: string | null }) {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-10">{title}</h1>
      {content ? (
        <div
          className="prose prose-sm md:prose-base text-novo-text max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-novo-text-muted">This page hasn't been set up yet. Check back soon.</p>
      )}
    </div>
  )
}
