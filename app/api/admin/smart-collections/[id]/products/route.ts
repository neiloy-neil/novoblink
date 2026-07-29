import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const collection = await prisma.smartCollection.findUnique({ where: { id } })
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rules = collection.rules as any[]
  const ruleMatch = collection.ruleMatch

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { take: 1 }, category: true, productTags: true },
    take: 200,
  })

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

  const matched = products.filter(p => {
    if (!rules?.length) return true
    if (ruleMatch === "any") return rules.some(r => applyRule(p, r))
    return rules.every(r => applyRule(p, r))
  })

  return NextResponse.json(matched.map(p => ({ ...p, price: Number(p.price) })))
}
