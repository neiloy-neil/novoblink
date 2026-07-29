import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await prisma.brand.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        where: { isActive: true },
        include: { images: { take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 60,
      },
    },
  })
  if (!brand) notFound()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Brand hero */}
      {brand.banner && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden mb-6">
          <Image src={brand.banner} alt={brand.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            {brand.logo && <Image src={brand.logo} alt={brand.name} width={120} height={60} className="object-contain" />}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        {brand.logo && !brand.banner && (
          <Image src={brand.logo} alt={brand.name} width={64} height={64} className="object-contain rounded-lg border p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          {brand.description && <p className="text-muted-foreground mt-1 text-sm">{brand.description}</p>}
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
              {brand.website}
            </a>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{brand.products.length} products</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {brand.products.map(product => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
              )}
            </div>
            <p className="text-sm font-medium line-clamp-2">{product.name}</p>
            <p className="text-sm font-bold mt-0.5">৳{Number(product.price).toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {brand.products.length === 0 && (
        <p className="text-center text-muted-foreground py-16">No products available for this brand yet.</p>
      )}
    </div>
  )
}
