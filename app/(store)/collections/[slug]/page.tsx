import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { serialize } from "@/lib/utils"
import ProductCard from "@/components/store/ProductCard"

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = await prisma.smartCollection.findUnique({ where: { slug, isActive: true } }).catch(() => null)
  if (!collection) notFound()

  const rules = collection.rules as any[]
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { take: 1 }, category: true, variants: true, productTags: true },
  }).catch(() => [])

  const applyRule = (product: any, rule: any): boolean => {
    const { field, operator, value } = rule
    let fieldValue: any
    if (field === "price") fieldValue = Number(product.price)
    else if (field === "tag") fieldValue = product.productTags?.map((t: any) => t.name) || []
    else if (field === "category") fieldValue = product.category?.slug || ""
    else return false
    if (operator === "less_than") return Number(fieldValue) < Number(value)
    if (operator === "greater_than") return Number(fieldValue) > Number(value)
    if (operator === "equals") return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue) === String(value)
    if (operator === "contains") return Array.isArray(fieldValue) ? fieldValue.some((v: string) => v.includes(value)) : String(fieldValue).includes(value)
    return false
  }

  const matched = allProducts.filter(p => {
    if (!rules?.length) return true
    if (collection.ruleMatch === "any") return rules.some(r => applyRule(p, r))
    return rules.every(r => applyRule(p, r))
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        {collection.image && <img src={collection.image} alt={collection.name} className="w-full h-48 object-cover rounded-lg mb-6" />}
        <h1 className="text-3xl font-heading font-bold">{collection.name}</h1>
        {collection.description && <p className="text-muted-foreground mt-2">{collection.description}</p>}
        <p className="text-sm text-muted-foreground mt-1">{matched.length} products</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {serialize(matched).map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
