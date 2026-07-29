import prisma from "@/lib/prisma"
import { PageClient } from "./PageClient"

export default async function PagesAdminPage() {
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } })

  const formatted = pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    content: p.content,
    isPublished: p.isPublished,
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Pages</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Edit FAQ, Returns, Size Guide, Contact and other info pages without touching code.
          </p>
        </div>
      </div>
      <PageClient data={formatted} />
    </div>
  )
}
