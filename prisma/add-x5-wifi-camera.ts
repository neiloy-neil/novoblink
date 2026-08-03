import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Upsert category
  const category = await prisma.category.upsert({
    where: { slug: "security-cameras" },
    update: {},
    create: {
      name: "Security Cameras",
      slug: "security-cameras",
      isActive: true,
      sortOrder: 2,
    },
  })
  console.log("Category:", category.name)

  // Create product
  const product = await prisma.product.create({
    data: {
      name: "X5 Mini WiFi Camera",
      slug: "x5-mini-wifi-camera",
      description: `<p>The <strong>X5 Mini WiFi Camera</strong> is a compact 1080P HD surveillance camera designed for home monitoring, office security, and remote viewing. With its tiny 38×30×30mm body, it blends seamlessly into any environment while delivering crisp full HD footage.</p>

<h3>Key Features</h3>
<ul>
  <li><strong>1080P Full HD</strong> – 2MP lens with 120° wide-angle view</li>
  <li><strong>WiFi Connected</strong> – Live stream and remote access from anywhere via the Ysx Lite app</li>
  <li><strong>Motion Detection</strong> – Instant alerts sent to your phone when movement is detected</li>
  <li><strong>IR-CUT Night Vision</strong> – Clear footage even in low-light conditions</li>
  <li><strong>Loop Recording</strong> – Continuously records, overwriting oldest footage when storage is full</li>
  <li><strong>Micro SD Support</strong> – Supports up to 128GB memory card (not included)</li>
  <li><strong>30fps @ 1080P</strong> – Smooth, high-quality video in AVI format</li>
  <li><strong>USB Powered</strong> – Simple Micro USB power supply</li>
</ul>

<h3>Specifications</h3>
<ul>
  <li>Model: X5</li>
  <li>Resolution: 1080P (2MP)</li>
  <li>Lens Angle: 120°</li>
  <li>Video Format: AVI</li>
  <li>Frame Rate: 30fps</li>
  <li>Dimensions: 38 × 30 × 30mm</li>
  <li>Color: Black</li>
  <li>Material: ABS</li>
  <li>App: Ysx Lite</li>
</ul>

<h3>Package Contents</h3>
<ul>
  <li>1× X5 Mini WiFi Bullet Camera</li>
  <li>1× User Manual</li>
  <li>1× Micro USB Cable</li>
</ul>`,
      price: 810,
      comparePrice: 1320,
      categoryId: category.id,
      isActive: true,
      isFeatured: false,
      tags: "wifi camera,security camera,mini camera,cctv,surveillance,1080p,x5",
      images: {
        create: [
          { url: "https://smartdeal.com.bd/public/uploads/all/eBPCUy2jr4Ux0vzkJglbCxG6qj1yr34R8xwIsOy6.png", alt: "X5 Mini WiFi Camera", sortOrder: 0 },
          { url: "https://smartdeal.com.bd/public/uploads/all/B886GrKg8GJNTVEULTvBt3N8ggsvO9bXUDDQyPAu.jpg", alt: "X5 Mini WiFi Camera side view", sortOrder: 1 },
          { url: "https://smartdeal.com.bd/public/uploads/all/9Q4IWZJ7x8QFE6MvB1sPp8xIFEMtTwFgFcsVZDSX.jpg", alt: "X5 Mini WiFi Camera features", sortOrder: 2 },
          { url: "https://smartdeal.com.bd/public/uploads/all/O2xAoZm1CHwJVwA3rnjEeEZd1tbgAKCCc2HUJSmf.jpg", alt: "X5 Mini WiFi Camera app", sortOrder: 3 },
          { url: "https://smartdeal.com.bd/public/uploads/all/NOBgc9zSHufeIrIB7wpQUZEex6nDMvYRbvGAARW4.jpg", alt: "X5 Mini WiFi Camera package", sortOrder: 4 },
          { url: "https://smartdeal.com.bd/public/uploads/all/8BoUI3WItrbvJ5YTbyloraE1vN8nWwkZsmap2WSk.png", alt: "X5 Mini WiFi Camera specs", sortOrder: 5 },
        ],
      },
      variants: {
        create: [
          {
            size: "1pcs",
            color: "Black",
            colorHex: "#1a1a1a",
            sku: "X5-WIFI-CAM-1PC",
            stock: 10,
            price: 810,
            comparePrice: 1320,
            costPrice: 0,
          },
        ],
      },
    },
  })

  console.log("Product created:", product.name, "| Price: ৳", product.price.toString(), "| comparePrice: ৳", product.comparePrice?.toString())
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
