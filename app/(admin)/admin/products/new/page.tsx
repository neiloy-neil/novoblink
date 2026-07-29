import ProductForm from "@/components/admin/ProductForm"
import prisma from "@/lib/prisma"

export default async function NewProductPage() {
  const categories = await prisma.category.findMany().catch(() => [])

  return (
    <div className="mx-auto max-w-5xl w-full">
      <ProductForm categories={categories} />
    </div>
  )
}
