import prisma from "@/lib/prisma"
import ProductCard from "@/components/store/ProductCard"
import { serialize } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

import { getActiveFlashSaleBatch, applyFlashSaleDiscount } from "@/lib/flashSale"
import ShopFilters from "@/components/store/ShopFilters"
import ShopTopControls from "@/components/store/ShopTopControls"
import SearchTracker from "@/components/store/SearchTracker"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string
    brandId?: string
    size?: string
    color?: string
    sort?: string
    take?: string
    sale?: string
    minPrice?: string
    maxPrice?: string
    search?: string
    view?: string
  }>
}) {
  const params = await searchParams
  const categoryId = params.categoryId || ""
  const brandId = params.brandId || ""
  const size = params.size || ""
  const color = params.color || ""
  const sort = params.sort || "newest"
  const saleOnly = params.sale === "true"
  const minPrice = params.minPrice || ""
  const maxPrice = params.maxPrice || ""
  const search = params.search || ""
  const view = params.view || "grid"
  const take = parseInt(params.take || "12")

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-asc") orderBy = { price: "asc" }
  if (sort === "price-desc") orderBy = { price: "desc" }

  const where: any = { isActive: true }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ]
  }
  if (categoryId) where.categoryId = categoryId
  if (brandId) where.brandId = brandId
  if (saleOnly) where.comparePrice = { not: null }
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = Number(minPrice)
    if (maxPrice) where.price.lte = Number(maxPrice)
  }
  if (size || color) {
    where.variants = { some: {} }
    if (size) where.variants.some.size = size
    if (color) where.variants.some.color = color
  }

  const [products, totalProducts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: true, variants: true },
      orderBy,
      take,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { isActive: true } }).catch(() => []),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }).catch(() => []),
  ])

  const hasMore = totalProducts > take

  const [flashSaleMap, reviewAggs] = await Promise.all([
    getActiveFlashSaleBatch(products.map((p: any) => ({ id: p.id, categoryId: p.categoryId }))).catch(() => new Map()),
    prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p: any) => p.id) }, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }).catch(() => []),
  ])
  const reviewMap = Object.fromEntries(reviewAggs.map((r: any) => [r.productId, r]))

  const current = { categoryId, brandId, size, color, sort, view, minPrice, maxPrice, sale: params.sale || "", search, take: params.take || "12" }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-500">
      {search && <SearchTracker query={search} />}
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-novo-border pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-2">
            {search ? `"${search}"` : "Shop All"}
          </h1>
          <p className="text-sm text-novo-text-muted">
            {search ? `${totalProducts} result${totalProducts !== 1 ? "s" : ""}` : `Showing ${products.length} of ${totalProducts} products`}
          </p>
        </div>

        <ShopTopControls current={current} />
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Filters sidebar — handles both desktop (inline) and mobile (drawer) */}
        <ShopFilters
          categories={categories as any}
          brands={brands as any}
          current={current}
        />

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-novo-muted rounded-2xl border border-novo-border">
              <p className="text-novo-text-muted">No products found matching your criteria.</p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2 bg-white border border-novo-border rounded-full hover:border-novo-blue text-sm font-medium transition-colors"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <>
              {view === "list" ? (
                <div className="flex flex-col gap-4">
                  {serialize(products).map((product: any) => {
                    const sale = flashSaleMap.get(product.id)
                    const flashSalePrice = sale ? applyFlashSaleDiscount(Number(product.price), sale) : undefined
                    const img = product.images?.[0]?.url || "/placeholder.jpg"
                    const displayPrice = flashSalePrice ?? Number(product.price)
                    return (
                      <Link key={product.id} href={`/shop/${product.slug}`} className="flex gap-5 border border-novo-border rounded-2xl p-4 hover:border-novo-blue transition-colors group bg-white">
                        <div className="relative w-28 h-36 shrink-0 rounded-xl overflow-hidden bg-novo-muted">
                          <Image src={img} alt={product.name} fill sizes="112px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col justify-between py-1 flex-1">
                          <div>
                            <p className="text-xs text-novo-text-muted uppercase tracking-widest mb-1">{product.category?.name}</p>
                            <h3 className="font-heading font-bold text-novo-black text-lg leading-tight line-clamp-2">{product.name}</h3>
                            {product.description && (
                              <p className="text-sm text-novo-text-muted mt-2 line-clamp-2">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="font-bold text-novo-black">৳{displayPrice.toLocaleString()}</span>
                            {product.comparePrice && Number(product.comparePrice) > displayPrice && (
                              <span className="text-sm text-novo-text-muted line-through">৳{Number(product.comparePrice).toLocaleString()}</span>
                            )}
                            {sale && (
                              <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                                {sale.discountType === "PERCENTAGE" ? `${sale.discountValue}% off` : `৳${sale.discountValue} off`}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
                  {serialize(products).map((product: any) => {
                    const sale = flashSaleMap.get(product.id)
                    const flashSalePrice = sale ? applyFlashSaleDiscount(Number(product.price), sale) : undefined
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        flashSalePrice={flashSalePrice}
                        flashSaleLabel={
                          sale
                            ? sale.discountType === "PERCENTAGE"
                              ? `${sale.discountValue}% off`
                              : `৳${sale.discountValue} off`
                            : undefined
                        }
                        avgRating={reviewMap[product.id]?._avg?.rating}
                        reviewCount={reviewMap[product.id]?._count?.rating}
                      />
                    )
                  })}
                </div>
              )}

              {hasMore && (
                <div className="mt-16 text-center border-t border-novo-border pt-8">
                  <p className="text-xs text-novo-text-muted mb-4">
                    Showing {products.length} of {totalProducts}
                  </p>
                  <Link
                    href={`/shop?take=${take + 12}${categoryId ? `&categoryId=${categoryId}` : ""}${size ? `&size=${size}` : ""}${color ? `&color=${color}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}${minPrice ? `&minPrice=${minPrice}` : ""}${maxPrice ? `&maxPrice=${maxPrice}` : ""}${view !== "grid" ? `&view=${view}` : ""}`}
                    scroll={false}
                    className="inline-block px-12 py-3 bg-novo-surface border border-novo-border text-novo-black font-medium hover:border-novo-black rounded-full transition-colors"
                  >
                    Load More
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

