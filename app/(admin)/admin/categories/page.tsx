import prisma from "@/lib/prisma"
import { CategoryClient } from "./CategoryClient"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { attributeConfig: true, _count: { select: { products: true } } },
  })

  const formatted = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    attr1Label: c.attributeConfig?.attr1Label || "Size",
    attr2Label: c.attributeConfig?.attr2Label || "Color",
    attr1Hint: c.attributeConfig?.attr1Hint || "",
    attr2Hint: c.attributeConfig?.attr2Hint || "",
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure each category's variant attribute labels so they make sense for any product type — clothes, gadgets, shoes, etc.
        </p>
      </div>
      <CategoryClient data={formatted} />
    </div>
  )
}
