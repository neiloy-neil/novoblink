import ProductForm from "@/components/admin/ProductForm"
import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categories = await prisma.category.findMany().catch(() => [])

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    }
  }).catch(() => null)

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl w-full">
      <ProductForm initialData={serialize(product)} categories={categories} />
    </div>
  )
}
