import { Role, DiscountType } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Admin User ───────────────────────────────────────────────
  // Reconcile against Supabase auth.users (source of truth for the id) rather
  // than just checking Prisma — a stale Prisma row can exist with an id that
  // has no matching Supabase auth user (e.g. left over from the NextAuth era).
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
  let authUser = existingAuthUsers.users.find((u) => u.email === 'admin@store.com')

  if (!authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@store.com',
      password: 'Admin@1234',
      email_confirm: true,
      app_metadata: { role: 'ADMIN' },
      user_metadata: { name: 'Admin' },
    })
    if (error) throw error
    authUser = data.user
  } else {
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      app_metadata: { role: 'ADMIN' },
      user_metadata: { name: 'Admin' },
    })
  }

  const stalePrismaAdmin = await prisma.user.findUnique({ where: { email: 'admin@store.com' } })
  if (stalePrismaAdmin && stalePrismaAdmin.id !== authUser.id) {
    await prisma.user.delete({ where: { id: stalePrismaAdmin.id } })
  }

  const admin = await prisma.user.upsert({
    where: { id: authUser.id },
    update: { role: Role.ADMIN },
    create: {
      id: authUser.id,
      name: 'Admin',
      email: 'admin@store.com',
      role: Role.ADMIN,
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ─── Categories ───────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'men' },
      update: {},
      create: {
        name: 'Men',
        slug: 'men',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&auto=format&fit=crop',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'women' },
      update: {},
      create: {
        name: 'Women',
        slug: 'women',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'kids' },
      update: {},
      create: {
        name: 'Kids',
        slug: 'kids',
        image: 'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=600&auto=format&fit=crop',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sale' },
      update: {},
      create: {
        name: 'Sale',
        slug: 'sale',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop',
        sortOrder: 5,
      },
    }),
  ])
  console.log('✅ Categories:', categories.map(c => c.name).join(', '))

  // ─── Products ─────────────────────────────────────────────────
  const productData = [
    {
      name: 'Classic White Shirt',
      slug: 'classic-white-shirt',
      price: 850,
      comparePrice: 1200,
      categorySlug: 'men',
      featured: true,
      description: 'A timeless classic white shirt crafted from premium 100% cotton. Crisp, breathable, and versatile — dress it up or keep it casual.',
      images: [
        { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop', alt: 'Classic White Shirt front' },
        { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop', alt: 'Classic White Shirt detail' },
      ],
      colors: [{ color: 'White', hex: '#FFFFFF' }, { color: 'Light Blue', hex: '#A8C4E0' }],
    },
    {
      name: 'Slim Fit Chinos',
      slug: 'slim-fit-chinos',
      price: 1400,
      comparePrice: 1800,
      categorySlug: 'men',
      featured: false,
      description: 'Modern slim fit chinos with a clean silhouette. Made from stretch cotton for all-day comfort without compromising on style.',
      images: [
        { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop', alt: 'Slim Fit Chinos' },
        { url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop', alt: 'Slim Fit Chinos detail' },
      ],
      colors: [{ color: 'Khaki', hex: '#C3A882' }, { color: 'Olive', hex: '#6B6B47' }],
    },
    {
      name: 'Floral Maxi Dress',
      slug: 'floral-maxi-dress',
      price: 1800,
      comparePrice: 2500,
      categorySlug: 'women',
      featured: true,
      description: 'Effortlessly elegant floral maxi dress perfect for warm days. Features a flowing silhouette and vibrant print that turns heads.',
      images: [
        { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop', alt: 'Floral Maxi Dress' },
        { url: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&auto=format&fit=crop', alt: 'Floral Maxi Dress detail' },
      ],
      colors: [{ color: 'Floral Blue', hex: '#5B8DB8' }, { color: 'Floral Pink', hex: '#E8A0BF' }],
    },
    {
      name: 'Casual Linen Kurti',
      slug: 'casual-linen-kurti',
      price: 950,
      comparePrice: 1300,
      categorySlug: 'women',
      featured: true,
      description: 'Lightweight linen kurti with subtle embroidery details. Breathable and comfortable, ideal for Bangladesh\'s warm climate.',
      images: [
        { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop', alt: 'Casual Linen Kurti' },
        { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4545?w=800&auto=format&fit=crop', alt: 'Casual Linen Kurti detail' },
      ],
      colors: [{ color: 'Ivory', hex: '#FFFFF0' }, { color: 'Dusty Rose', hex: '#DCAE96' }],
    },
    {
      name: 'Kids Cartoon Tee',
      slug: 'kids-cartoon-tee',
      price: 450,
      comparePrice: 600,
      categorySlug: 'kids',
      featured: false,
      description: 'Fun and vibrant cartoon print tee for kids. Made from soft, skin-friendly cotton that\'s easy to wash and keeps its color.',
      images: [
        { url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop', alt: 'Kids Cartoon Tee' },
        { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop', alt: 'Kids Cartoon Tee worn' },
      ],
      colors: [{ color: 'Yellow', hex: '#FFD700' }, { color: 'Sky Blue', hex: '#87CEEB' }],
    },
    {
      name: 'Boys Denim Jacket',
      slug: 'boys-denim-jacket',
      price: 1200,
      comparePrice: 1600,
      categorySlug: 'kids',
      featured: false,
      description: 'Classic denim jacket for boys with a cool worn-in look. Durable construction with snap buttons and chest pockets.',
      images: [
        { url: 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=800&auto=format&fit=crop', alt: 'Boys Denim Jacket' },
        { url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop', alt: 'Boys Denim Jacket detail' },
      ],
      colors: [{ color: 'Denim Blue', hex: '#4A6FA5' }, { color: 'Dark Wash', hex: '#2C3E6B' }],
    },
    {
      name: 'Leather Belt',
      slug: 'leather-belt',
      price: 650,
      comparePrice: 900,
      categorySlug: 'accessories',
      featured: false,
      description: 'Premium genuine leather belt with a classic gold-tone buckle. A wardrobe essential that elevates any outfit.',
      images: [
        { url: 'https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=800&auto=format&fit=crop', alt: 'Leather Belt' },
        { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop', alt: 'Leather Belt detail' },
      ],
      colors: [{ color: 'Black', hex: '#1a1a1a' }, { color: 'Tan', hex: '#C68642' }],
    },
    {
      name: 'Canvas Tote Bag',
      slug: 'canvas-tote-bag',
      price: 550,
      comparePrice: 750,
      categorySlug: 'accessories',
      featured: true,
      description: 'Sturdy canvas tote bag with reinforced handles and a spacious interior. Perfect for daily errands, beach days, or grocery runs.',
      images: [
        { url: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=800&auto=format&fit=crop', alt: 'Canvas Tote Bag' },
        { url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop', alt: 'Canvas Tote Bag interior' },
      ],
      colors: [{ color: 'Natural', hex: '#E8DCC8' }, { color: 'Black', hex: '#1a1a1a' }],
    },
    {
      name: 'Oversized Polo Tee',
      slug: 'oversized-polo-tee',
      price: 700,
      comparePrice: 1000,
      categorySlug: 'sale',
      featured: false,
      description: 'Relaxed oversized polo tee with a modern drop-shoulder fit. Breathable pique fabric keeps you cool all day.',
      images: [
        { url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop', alt: 'Oversized Polo Tee' },
        { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop', alt: 'Oversized Polo Tee worn' },
      ],
      colors: [{ color: 'Navy', hex: '#1F3A5F' }, { color: 'Forest Green', hex: '#2D5A27' }],
    },
    {
      name: 'Striped Formal Shirt',
      slug: 'striped-formal-shirt',
      price: 990,
      comparePrice: 1400,
      categorySlug: 'men',
      featured: true,
      description: 'Sharp striped formal shirt with a tailored fit. Made from wrinkle-resistant fabric, perfect for office and events.',
      images: [
        { url: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop', alt: 'Striped Formal Shirt' },
        { url: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800&auto=format&fit=crop', alt: 'Striped Formal Shirt detail' },
      ],
      colors: [{ color: 'Blue Stripe', hex: '#3A5F8A' }, { color: 'Grey Stripe', hex: '#808080' }],
    },
  ]

  const sizes = ['S', 'M', 'L', 'XL']

  for (const pd of productData) {
    const category = categories.find(c => c.slug === pd.categorySlug)!
    const existing = await prisma.product.findUnique({ where: { slug: pd.slug } })
    if (existing) {
      // Update images if using placeholders
      const imgs = await prisma.productImage.findMany({ where: { product: { slug: pd.slug } } })
      if (imgs.length > 0 && imgs[0].url.includes('placehold.co')) {
        await prisma.productImage.deleteMany({ where: { product: { slug: pd.slug } } })
        await prisma.productImage.createMany({
          data: pd.images.map((img, i) => ({ ...img, productId: existing.id, sortOrder: i })),
        })
        console.log('🔄 Updated images:', pd.name)
      }
      continue
    }

    const product = await prisma.product.create({
      data: {
        name: pd.name,
        slug: pd.slug,
        description: pd.description,
        price: pd.price,
        comparePrice: pd.comparePrice,
        categoryId: category.id,
        tags: 'new, trending',
        isActive: true,
        isFeatured: pd.featured,
        images: {
          create: pd.images.map((img, i) => ({ ...img, sortOrder: i })),
        },
        variants: {
          create: sizes.flatMap(size =>
            pd.colors.map(c => ({
              size,
              color: c.color,
              colorHex: c.hex,
              sku: `${pd.slug}-${size}-${c.color}`.toUpperCase().replace(/\s+/g, '-'),
              stock: Math.floor(Math.random() * 20) + 5,
              price: null,
            }))
          ),
        },
      },
    })
    console.log('✅ Product:', product.name)
  }

  // ─── Coupons ──────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: DiscountType.PERCENTAGE,
      value: 10,
      minOrderAmount: 500,
      maxUses: 100,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  })

  await prisma.coupon.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: {
      code: 'FLAT100',
      type: DiscountType.FLAT,
      value: 100,
      minOrderAmount: 500,
      maxUses: 200,
      isActive: true,
      expiresAt: new Date('2027-12-31'),
    },
  })
  console.log('✅ Coupons: WELCOME10, FLAT100')

  // ─── Banner ───────────────────────────────────────────────────
  const bannerCount = await prisma.banner.count()
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'New Summer Collection',
          image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&auto=format&fit=crop',
          link: '/shop',
          isActive: true,
          sortOrder: 0,
        },
        {
          title: "Women's Edit",
          image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&auto=format&fit=crop',
          link: '/shop?category=women',
          isActive: true,
          sortOrder: 1,
        },
        {
          title: 'Street Style Essentials',
          image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&auto=format&fit=crop',
          link: '/shop?category=men',
          isActive: true,
          sortOrder: 2,
        },
      ],
    })
    console.log('✅ Banners created (3)')
  }

  // ─── Settings ─────────────────────────────────────────────────
  const settings = [
    { key: 'store_name', value: 'NovoBlink' },
    { key: 'currency', value: 'BDT' },
    { key: 'points_per_taka', value: '10' },
    { key: 'points_redemption_rate', value: '10' },
    { key: 'free_shipping_above', value: '1000' },
    { key: 'shipping_charge', value: '80' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }
  console.log('✅ Settings saved')

  console.log('\n🎉 Seed complete!')
  console.log('   Admin email:    admin@store.com')
  console.log('   Admin password: Admin@1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
