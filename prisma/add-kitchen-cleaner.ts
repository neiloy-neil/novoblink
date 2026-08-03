import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🗑️  Removing all existing products and their dependencies...')

  // Delete in dependency order to avoid FK constraint violations
  await prisma.reviewMedia.deleteMany()
  await prisma.reviewHelpfulVote.deleteMany()
  await prisma.review.deleteMany()
  await prisma.reviewQA.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.digitalDownload.deleteMany()
  await prisma.orderShipmentItem.deleteMany()
  await prisma.returnItem.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.stockAlert.deleteMany()
  await prisma.locationStock.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.productAddon.deleteMany()
  await prisma.orderBump.deleteMany()
  await prisma.priceRule.deleteMany({ where: { productId: { not: null } } })
  await prisma.subscription.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.frequentlyBoughtTogether.deleteMany()
  await prisma.blogPostProduct.deleteMany()
  await prisma.bundleItem.deleteMany()
  await prisma.flashSale.deleteMany()
  await prisma.product.deleteMany()

  console.log('✅ All products removed')

  // Upsert Kitchen Accessories category
  const category = await prisma.category.upsert({
    where: { slug: 'kitchen-accessories' },
    update: { name: 'Kitchen Accessories', isActive: true },
    create: {
      name: 'Kitchen Accessories',
      slug: 'kitchen-accessories',
      sortOrder: 1,
      isActive: true,
    },
  })
  console.log('✅ Category:', category.name)

  // Create Kitchen Cleaner Spray
  const product = await prisma.product.create({
    data: {
      name: 'Kitchen Cleaner Spray',
      slug: 'kitchen-cleaner-spray',
      description: `Say goodbye to stubborn kitchen grease! Our Kitchen Cleaner Spray eliminates sticky, greasy buildup on exhaust fans and stovetops within just 5 minutes. Works on multiple surfaces including tiles, cabinets, and chimneys. Reduces scrubbing effort significantly with minimal manual effort. 100% Quality Satisfaction guaranteed.`,
      price: 400,
      categoryId: category.id,
      tags: 'kitchen, cleaner, spray, grease, cleaning',
      isActive: true,
      isFeatured: true,
      weight: 490,
      images: {
        create: [
          {
            url: 'https://need2buybd.com/wp-content/uploads/2025/11/kitchen-cleaner-1200x1200.jpg',
            alt: 'Kitchen Cleaner Spray',
            sortOrder: 0,
          },
          {
            url: 'https://need2buybd.com/wp-content/uploads/2025/11/Ut3lgsvjT0MOngRmpgwMcmskhocR0RET1AWyUbgl-2.jpg',
            alt: 'Kitchen Cleaner Spray in use',
            sortOrder: 1,
          },
          {
            url: 'https://need2buybd.com/wp-content/uploads/2025/11/e2fdd6b6ecaa254925c863d2e25b331e.jpg_960x960q80.jpg_.png',
            alt: 'Kitchen Cleaner Spray result',
            sortOrder: 2,
          },
        ],
      },
      variants: {
        create: [
          {
            size: '1pcs',
            color: 'Default',
            sku: 'KITCHEN-CLEANER-SPRAY-1PCS',
            stock: 100,
            price: 400,
          },
          {
            size: '2pcs Combo',
            color: 'Default',
            sku: 'KITCHEN-CLEANER-SPRAY-2PCS',
            stock: 100,
            price: 750,
          },
          {
            size: '4pcs Combo',
            color: 'Default',
            sku: 'KITCHEN-CLEANER-SPRAY-4PCS',
            stock: 100,
            price: 1199,
          },
        ],
      },
    },
  })

  console.log('✅ Product created:', product.name)
  console.log('   Variants: 1pcs (৳400), 2pcs Combo (৳750), 4pcs Combo (৳1,199)')
  console.log('\n🎉 Done! Kitchen Cleaner Spray is now the only product in the store.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
