import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()

// ─── helpers ────────────────────────────────────────────────
const uid = () => db.query(`SELECT gen_random_uuid() AS id`).then(r => r.rows[0].id)

// ─── 1. CLEAR (order matters for FK) ────────────────────────
console.log('Clearing old data…')
await db.query(`TRUNCATE TABLE banners CASCADE`)
await db.query(`TRUNCATE TABLE categories CASCADE`)
await db.query(`TRUNCATE TABLE products CASCADE`)
console.log('  ✓ cleared')

// ─── 2. CATEGORIES ──────────────────────────────────────────
console.log('Seeding categories…')
const cats = [
  { name: 'Smartphones',    slug: 'smartphones',     image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format', sort: 1 },
  { name: 'Laptops',        slug: 'laptops',          image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format', sort: 2 },
  { name: 'Audio',          slug: 'audio',            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format', sort: 3 },
  { name: 'Smart Watches',  slug: 'smart-watches',    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format', sort: 4 },
  { name: 'Accessories',    slug: 'accessories',      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format', sort: 5 },
]

const catIds = {}
for (const c of cats) {
  const id = await uid()
  await db.query(
    `INSERT INTO categories (id, name, slug, image, "isActive", "sortOrder", "createdAt")
     VALUES ($1,$2,$3,$4,true,$5,now())`,
    [id, c.name, c.slug, c.image, c.sort]
  )
  catIds[c.slug] = id
  console.log(`  ✓ ${c.name}`)
}

// ─── 3. PRODUCTS ─────────────────────────────────────────────
console.log('Seeding products…')
const products = [
  // Smartphones
  {
    name: 'Samsung Galaxy A55 5G',
    slug: 'samsung-galaxy-a55-5g',
    description: 'The Galaxy A55 5G features a stunning 6.6" Super AMOLED display, 50MP camera, and all-day battery life. Smooth performance with Exynos 1480 chipset.',
    price: 45000, comparePrice: 49000, cat: 'smartphones', featured: true,
    image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&auto=format',
    variants: [
      { size: '128GB', color: 'Awesome Iceblue',  colorHex: '#A8D8EA', stock: 15 },
      { size: '256GB', color: 'Awesome Iceblue',  colorHex: '#A8D8EA', stock: 8 },
      { size: '256GB', color: 'Awesome Navy',     colorHex: '#1B2A4A', stock: 10 },
    ],
  },
  {
    name: 'iPhone 15 128GB',
    slug: 'iphone-15-128gb',
    description: 'Apple iPhone 15 with Dynamic Island, 48MP camera system, and USB-C. Experience the next generation of iPhone.',
    price: 115000, comparePrice: 120000, cat: 'smartphones', featured: true,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format',
    variants: [
      { size: '128GB', color: 'Black Titanium', colorHex: '#3D3D3D', stock: 6 },
      { size: '128GB', color: 'Pink',           colorHex: '#F2A7BB', stock: 4 },
      { size: '256GB', color: 'Black Titanium', colorHex: '#3D3D3D', stock: 5 },
    ],
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro',
    slug: 'xiaomi-redmi-note-13-pro',
    description: '200MP camera, 5000mAh battery, and 67W turbo charging. The ultimate mid-range powerhouse.',
    price: 32000, comparePrice: null, cat: 'smartphones', featured: false,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format',
    variants: [
      { size: '8GB/256GB', color: 'Midnight Black', colorHex: '#1C1C1C', stock: 20 },
      { size: '8GB/256GB', color: 'Forest Green',   colorHex: '#2D5A27', stock: 12 },
    ],
  },

  // Laptops
  {
    name: 'HP Laptop 15s Intel i5',
    slug: 'hp-laptop-15s-intel-i5',
    description: '15.6" FHD display, Intel Core i5 12th Gen, 8GB RAM, 512GB SSD. Perfect for students and professionals.',
    price: 68000, comparePrice: 75000, cat: 'laptops', featured: true,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format',
    variants: [
      { size: '8GB/512GB',  color: 'Silver', colorHex: '#C0C0C0', stock: 10 },
      { size: '16GB/512GB', color: 'Silver', colorHex: '#C0C0C0', stock: 5 },
    ],
  },
  {
    name: 'Asus VivoBook 16X OLED',
    slug: 'asus-vivobook-16x-oled',
    description: '16" 3.2K OLED display, AMD Ryzen 7, 16GB RAM, 512GB SSD. Vivid visuals for creators.',
    price: 82000, comparePrice: 90000, cat: 'laptops', featured: false,
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format',
    variants: [
      { size: '16GB/512GB', color: 'Indie Black', colorHex: '#2B2B2B', stock: 7 },
    ],
  },

  // Audio
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh-1000xm5',
    description: 'Industry-leading noise cancellation, 30-hour battery, and exceptional sound quality. The benchmark in wireless headphones.',
    price: 35000, comparePrice: 40000, cat: 'audio', featured: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format',
    variants: [
      { size: 'One Size', color: 'Black',  colorHex: '#1A1A1A', stock: 15 },
      { size: 'One Size', color: 'Silver', colorHex: '#D4D4D4', stock: 8 },
    ],
  },
  {
    name: 'JBL Tune 770NC Wireless',
    slug: 'jbl-tune-770nc',
    description: 'Active noise cancelling, 70-hour playtime, and JBL Pure Bass sound. Foldable design for easy portability.',
    price: 14000, comparePrice: 16000, cat: 'audio', featured: false,
    image: 'https://images.unsplash.com/photo-1546435770-a3e736317d47?w=800&auto=format',
    variants: [
      { size: 'One Size', color: 'Black', colorHex: '#1A1A1A', stock: 25 },
      { size: 'One Size', color: 'Blue',  colorHex: '#1E3A8A', stock: 18 },
      { size: 'One Size', color: 'White', colorHex: '#F5F5F5', stock: 20 },
    ],
  },
  {
    name: 'boAt Airdopes 141 TWS',
    slug: 'boat-airdopes-141',
    description: 'True wireless earbuds with 42H total playback, IPX4 water resistance, and BEAST mode for gaming.',
    price: 2500, comparePrice: 3500, cat: 'audio', featured: false,
    image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&auto=format',
    variants: [
      { size: 'One Size', color: 'Active Black', colorHex: '#111111', stock: 50 },
      { size: 'One Size', color: 'Bold Blue',    colorHex: '#2563EB', stock: 35 },
    ],
  },

  // Smart Watches
  {
    name: 'Samsung Galaxy Watch 6 Classic',
    slug: 'samsung-galaxy-watch-6-classic',
    description: 'Rotating bezel, sapphire crystal glass, advanced health monitoring with ECG and blood pressure. The ultimate smartwatch.',
    price: 38000, comparePrice: 42000, cat: 'smart-watches', featured: true,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format',
    variants: [
      { size: '43mm', color: 'Black', colorHex: '#1A1A1A', stock: 12 },
      { size: '47mm', color: 'Black', colorHex: '#1A1A1A', stock: 8 },
      { size: '47mm', color: 'Silver', colorHex: '#C0C0C0', stock: 6 },
    ],
  },
  {
    name: 'Amazfit GTR 4',
    slug: 'amazfit-gtr-4',
    description: 'Dual-band GPS, 14-day battery, 150+ sports modes. Premium smartwatch without the premium price.',
    price: 18000, comparePrice: 20000, cat: 'smart-watches', featured: false,
    image: 'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=800&auto=format',
    variants: [
      { size: '46mm', color: 'Superspeed Black', colorHex: '#111111', stock: 20 },
      { size: '46mm', color: 'Racetrack Grey',   colorHex: '#6B7280', stock: 15 },
    ],
  },

  // Accessories
  {
    name: 'Anker 65W GaN Charger',
    slug: 'anker-65w-gan-charger',
    description: 'Charge your laptop, phone, and tablet simultaneously. Ultra-compact GaN technology — 45% smaller than standard chargers.',
    price: 3500, comparePrice: 4200, cat: 'accessories', featured: false,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format',
    variants: [
      { size: 'One Size', color: 'Black', colorHex: '#1A1A1A', stock: 40 },
      { size: 'One Size', color: 'White', colorHex: '#F5F5F5', stock: 30 },
    ],
  },
  {
    name: 'Ugreen USB-C Hub 7-in-1',
    slug: 'ugreen-usbc-hub-7in1',
    description: '4K HDMI, 100W PD charging, USB 3.0×3, SD/TF card reader. The only hub you\'ll ever need.',
    price: 4500, comparePrice: 5500, cat: 'accessories', featured: false,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format',
    variants: [
      { size: 'One Size', color: 'Space Grey', colorHex: '#6B7280', stock: 30 },
    ],
  },
  {
    name: 'Baseus 20000mAh Power Bank',
    slug: 'baseus-20000mah-power-bank',
    description: '65W fast charging power bank with dual USB-C ports. Charges your laptop once and phone 4x on a single charge.',
    price: 5500, comparePrice: 6500, cat: 'accessories', featured: true,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format',
    variants: [
      { size: '20000mAh', color: 'Black', colorHex: '#1A1A1A', stock: 25 },
      { size: '20000mAh', color: 'White', colorHex: '#F5F5F5', stock: 20 },
    ],
  },
]

for (const p of products) {
  const id = await uid()
  await db.query(
    `INSERT INTO products
       (id, name, slug, description, price, "comparePrice", "categoryId",
        "isActive", "isFeatured", tags, "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,now(),now())`,
    [id, p.name, p.slug, p.description, p.price, p.comparePrice,
     catIds[p.cat], p.featured,
     p.name.toLowerCase().replace(/\s+/g, ',')]
  )

  // image
  const imgId = await uid()
  await db.query(
    `INSERT INTO product_images (id, "productId", url, alt, "sortOrder", "isVideo")
     VALUES ($1,$2,$3,$4,1,false)`,
    [imgId, id, p.image, p.name]
  )

  // variants
  let skuIdx = 1
  for (const v of p.variants) {
    const vid = await uid()
    const sku = `${p.slug.toUpperCase().replace(/-/g,'')}-V${skuIdx++}`
    await db.query(
      `INSERT INTO product_variants (id, "productId", sku, size, color, "colorHex", stock, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [vid, id, sku, v.size, v.color, v.colorHex, v.stock, p.price]
    )
  }
  console.log(`  ✓ ${p.name}`)
}

// ─── 4. BANNERS ──────────────────────────────────────────────
console.log('Seeding banners…')
await db.query(`
  INSERT INTO banners (id, title, image, link, "isActive", "sortOrder", "createdAt")
  VALUES
    (gen_random_uuid(),'Tech That Moves You',   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=2070&auto=format&fit=crop','/shop',true,1,now()),
    (gen_random_uuid(),'Pro Audio Collection',  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop','/shop',true,2,now()),
    (gen_random_uuid(),'Smart Home & Lifestyle','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop','/shop',true,3,now())
`)
console.log('  ✓ 3 banners')

await db.end()
console.log('\nDone! NovoBlink seeded successfully.')
