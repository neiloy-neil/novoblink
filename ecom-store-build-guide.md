# Clothing Ecom Store — Step-by-Step Build Guide

**Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL (Supabase) · NextAuth.js · Tailwind CSS · shadcn/ui  
**Market:** Bangladesh · bKash + Nagad + COD · Pathao + Steadfast delivery

---

## Project Structure

```
my-clothing-store/
├── app/
│   ├── (store)/                    # Customer-facing storefront
│   │   ├── page.tsx                # Homepage
│   │   ├── shop/
│   │   │   ├── page.tsx            # All products / category listing
│   │   │   └── [slug]/page.tsx     # Single product detail page
│   │   ├── cart/page.tsx           # Cart page
│   │   ├── checkout/page.tsx       # Checkout page
│   │   ├── account/
│   │   │   ├── page.tsx            # My orders
│   │   │   └── profile/page.tsx    # Profile & address
│   │   └── order/[id]/page.tsx     # Order confirmation & tracking
│   ├── (admin)/                    # Admin panel
│   │   ├── admin/
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # Product list
│   │   │   │   ├── new/page.tsx    # Add product
│   │   │   │   └── [id]/page.tsx   # Edit product
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx        # All orders
│   │   │   │   └── [id]/page.tsx   # Order detail & status update
│   │   │   ├── customers/page.tsx  # Customer list
│   │   │   ├── inventory/page.tsx  # Stock levels
│   │   │   ├── coupons/page.tsx    # Discount codes
│   │   │   ├── loyalty/page.tsx    # Loyalty points config
│   │   │   ├── delivery/page.tsx   # Courier management
│   │   │   ├── reports/page.tsx    # Revenue & analytics
│   │   │   └── settings/page.tsx   # Store settings & staff
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/route.ts
│   │   ├── orders/route.ts
│   │   ├── cart/route.ts
│   │   ├── payments/
│   │   │   ├── bkash/route.ts
│   │   │   ├── nagad/route.ts
│   │   │   └── cod/route.ts
│   │   ├── delivery/
│   │   │   ├── pathao/route.ts
│   │   │   └── steadfast/route.ts
│   │   ├── coupons/route.ts
│   │   └── loyalty/route.ts
│   └── layout.tsx
├── components/
│   ├── store/
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── VariantSelector.tsx     # Size & color picker
│   │   ├── CartDrawer.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── OrderTracker.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── ProductForm.tsx
│   │   ├── OrderTable.tsx
│   │   ├── StockBadge.tsx
│   │   └── RevenueChart.tsx
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth config
│   ├── bkash.ts                    # bKash API helper
│   ├── nagad.ts                    # Nagad API helper
│   ├── pathao.ts                   # Pathao courier helper
│   ├── steadfast.ts                # Steadfast courier helper
│   └── utils.ts
├── prisma/
│   └── schema.prisma               # Full database schema
├── middleware.ts                   # Auth route protection
├── .env.local
└── package.json
```

---

## Database Schema (Prisma)

Copy this into `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  phone         String?
  role          Role      @default(CUSTOMER)
  password      String?   // hashed, for email/password login
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  addresses     Address[]
  orders        Order[]
  loyaltyPoints LoyaltyPoint[]
  reviews       Review[]

  @@map("users")
}

enum Role {
  CUSTOMER
  STAFF
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ─────────────────────────────────────────────
// ADDRESS
// ─────────────────────────────────────────────

model Address {
  id         String  @id @default(cuid())
  userId     String
  label      String  @default("Home") // Home, Office, etc.
  fullName   String
  phone      String
  division   String
  district   String
  area       String
  address    String
  isDefault  Boolean @default(false)

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders Order[]

  @@map("addresses")
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  image       String?
  parentId    String?
  isActive    Boolean    @default(true)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  products Product[]

  @@map("categories")
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  comparePrice Decimal? @db.Decimal(10, 2) // original price for strike-through
  categoryId  String
  tags        String[] // e.g. ["summer", "casual"]
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category   Category        @relation(fields: [categoryId], references: [id])
  images     ProductImage[]
  variants   ProductVariant[]
  orderItems OrderItem[]
  reviews    Review[]

  @@map("products")
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String?
  sortOrder Int     @default(0)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("product_images")
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  size      String  // S, M, L, XL, XXL
  color     String  // Red, Black, White, etc.
  colorHex  String? // #FF0000
  sku       String  @unique
  stock     Int     @default(0)
  price     Decimal? @db.Decimal(10, 2) // override product price if different

  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]
  cartItems  CartItem[]

  @@map("product_variants")
}

// ─────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────

model Cart {
  id        String     @id @default(cuid())
  sessionId String?    @unique // for guest carts
  userId    String?    @unique // for logged-in carts
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  items CartItem[]

  @@map("carts")
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  variantId String
  quantity  Int

  cart    Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id])

  @@unique([cartId, variantId])
  @@map("cart_items")
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique // e.g. ORD-2024-0001
  userId          String?
  addressId       String?
  status          OrderStatus   @default(PENDING)
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus @default(UNPAID)
  subtotal        Decimal       @db.Decimal(10, 2)
  discount        Decimal       @default(0) @db.Decimal(10, 2)
  shippingCharge  Decimal       @default(0) @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  couponId        String?
  note            String?       // customer note
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Shipping snapshot (in case address changes later)
  shippingName    String
  shippingPhone   String
  shippingAddress String
  shippingArea    String
  shippingDistrict String
  shippingDivision String

  user        User?          @relation(fields: [userId], references: [id])
  address     Address?       @relation(fields: [addressId], references: [id])
  coupon      Coupon?        @relation(fields: [couponId], references: [id])
  items       OrderItem[]
  payment     Payment?
  delivery    Delivery?
  statusLogs  OrderStatusLog[]

  @@map("orders")
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  variantId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // price at time of order
  productName String // snapshot
  size      String
  color     String

  order   Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product        @relation(fields: [productId], references: [id])
  variant ProductVariant @relation(fields: [variantId], references: [id])

  @@map("order_items")
}

model OrderStatusLog {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_status_logs")
}

enum OrderStatus {
  PENDING       // just placed
  CONFIRMED     // admin confirmed
  PACKED        // ready to ship
  SHIPPED       // handed to courier
  DELIVERED     // delivered to customer
  CANCELLED     // cancelled
  RETURNED      // returned by customer
}

enum PaymentMethod {
  BKASH
  NAGAD
  COD
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

model Payment {
  id              String        @id @default(cuid())
  orderId         String        @unique
  method          PaymentMethod
  status          PaymentStatus @default(UNPAID)
  amount          Decimal       @db.Decimal(10, 2)
  transactionId   String?       // bKash/Nagad trxID
  gatewayResponse Json?         // raw response from gateway
  paidAt          DateTime?
  createdAt       DateTime      @default(now())

  order Order @relation(fields: [orderId], references: [id])

  @@map("payments")
}

// ─────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────

model Delivery {
  id             String         @id @default(cuid())
  orderId        String         @unique
  courier        CourierService
  consignmentId  String?        // Pathao/Steadfast ID
  trackingCode   String?
  status         DeliveryStatus @default(PENDING)
  charge         Decimal        @db.Decimal(10, 2) @default(0)
  estimatedDate  DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  order Order @relation(fields: [orderId], references: [id])

  @@map("deliveries")
}

enum CourierService {
  PATHAO
  STEADFAST
  SELF
}

enum DeliveryStatus {
  PENDING
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  FAILED
  RETURNED
}

// ─────────────────────────────────────────────
// COUPONS & DISCOUNTS
// ─────────────────────────────────────────────

model Coupon {
  id            String       @id @default(cuid())
  code          String       @unique
  type          DiscountType // PERCENTAGE or FLAT
  value         Decimal      @db.Decimal(10, 2)
  minOrderAmount Decimal?    @db.Decimal(10, 2)
  maxUses       Int?
  usedCount     Int          @default(0)
  isActive      Boolean      @default(true)
  expiresAt     DateTime?
  createdAt     DateTime     @default(now())

  orders Order[]

  @@map("coupons")
}

enum DiscountType {
  PERCENTAGE
  FLAT
}

// ─────────────────────────────────────────────
// LOYALTY POINTS
// ─────────────────────────────────────────────

model LoyaltyPoint {
  id          String            @id @default(cuid())
  userId      String
  points      Int               // positive = earned, negative = redeemed
  type        LoyaltyPointType
  description String?
  orderId     String?
  createdAt   DateTime          @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("loyalty_points")
}

enum LoyaltyPointType {
  EARNED
  REDEEMED
  EXPIRED
  ADJUSTED  // manual admin adjustment
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

model Review {
  id        String   @id @default(cuid())
  userId    String
  productId String
  rating    Int      // 1–5
  comment   String?
  isApproved Boolean @default(false)
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@map("reviews")
}

// ─────────────────────────────────────────────
// BANNERS & SETTINGS
// ─────────────────────────────────────────────

model Banner {
  id        String   @id @default(cuid())
  title     String?
  image     String
  link      String?
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  @@map("banners")
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String

  @@map("settings")
  // Keys: store_name, store_logo, currency, points_per_taka,
  //       points_redemption_rate, free_shipping_above,
  //       bkash_merchant_number, nagad_merchant_number
}
```

---

## Step-by-Step Build Prompts

Use each prompt below in a **new Claude conversation** (or with an AI coding agent like Claude Code). Copy-paste each one exactly when you reach that step.

---

### Step 1 — Project scaffold

```
Create a new Next.js 14 project for a clothing ecommerce store with these exact settings:

- App Router (not Pages Router)
- TypeScript
- Tailwind CSS
- ESLint
- src/ directory: NO (use root app/ directory)
- Import alias: @/*

After scaffolding, install these packages:
npm install prisma @prisma/client @auth/prisma-adapter next-auth@beta
npm install @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npm install uploadthing @uploadthing/react
npm install -D prisma

Then run: npx prisma init

Show me the final package.json and folder structure.
```

---

### Step 2 — Environment variables

```
Create a .env.local file for my Next.js clothing ecom store with all required environment variables.

Include placeholders for:
- DATABASE_URL (Supabase PostgreSQL)
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (optional login)
- UPLOADTHING_SECRET and UPLOADTHING_APP_ID
- BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL
- NAGAD_MERCHANT_ID, NAGAD_MERCHANT_PRIVATE_KEY, NAGAD_BASE_URL
- PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_BASE_URL
- STEADFAST_API_KEY, STEADFAST_API_SECRET, STEADFAST_BASE_URL
- NEXT_PUBLIC_SITE_URL

Add a clear comment above each group explaining what it is.
```

---

### Step 3 — Database schema

```
I have a Next.js 14 clothing ecommerce store. Set up the complete Prisma schema.

Paste the full schema into prisma/schema.prisma. The schema includes these models:
User, Account, Session, Address, Category, Product, ProductImage, ProductVariant,
Cart, CartItem, Order, OrderItem, OrderStatusLog, Payment, Delivery,
Coupon, LoyaltyPoint, Review, Banner, Setting

Key business rules:
- Products have size (S/M/L/XL/XXL) AND color variants stored in ProductVariant
- Orders snapshot shipping address fields so they don't break if address is edited later
- Payments support BKASH, NAGAD, COD
- Delivery supports PATHAO, STEADFAST, SELF
- Coupons can be PERCENTAGE or FLAT discount with optional min order amount and expiry
- Loyalty points are a ledger (positive = earned, negative = redeemed)
- Orders have a full status log for tracking history

After the schema, run:
npx prisma generate
npx prisma db push

Then show me the Prisma client singleton at lib/prisma.ts
```

---

### Step 4 — Authentication

```
Set up NextAuth.js v5 (beta) for my Next.js 14 clothing ecom store.

Requirements:
- Email + password login (using bcrypt for hashing)
- Google OAuth (optional, secondary)
- Prisma adapter connected to my database
- Two roles: CUSTOMER and ADMIN
- Session includes user role and id
- Protect /admin/* routes — only ADMIN role can access
- Protect /account/* routes — only logged-in users

Create these files:
1. lib/auth.ts — NextAuth config with PrismaAdapter
2. app/api/auth/[...nextauth]/route.ts
3. middleware.ts — route protection logic
4. app/(store)/login/page.tsx — login form
5. app/(store)/register/page.tsx — registration form

The admin account should be created by setting role=ADMIN directly in the database.
```

---

### Step 5 — Admin panel layout & dashboard

```
Build the admin panel layout and dashboard for my Next.js 14 clothing ecom store.

Create:
1. app/(admin)/admin/layout.tsx
   - Sidebar with links: Dashboard, Products, Orders, Customers, Inventory, Coupons, Loyalty, Delivery, Reports, Settings
   - Top bar with store name and logged-in admin name
   - Only accessible to ADMIN role (check in layout)
   - Mobile responsive with collapsible sidebar

2. app/(admin)/admin/page.tsx — Dashboard with:
   - 4 stat cards: Today's orders, Today's revenue, Total customers, Low stock alerts
   - Recent orders table (last 10 orders) with status badge
   - Revenue chart (last 7 days) — use recharts
   - Quick actions: Add product, View pending orders

Use shadcn/ui components (Card, Table, Badge, Button).
Use Tailwind CSS. Keep the design clean and professional.
Fetch real data from the database using Prisma.
```

---

### Step 6 — Product management (admin)

```
Build the complete product management section for my clothing ecom store admin panel.

Pages to create:
1. app/(admin)/admin/products/page.tsx
   - Table of all products with: image thumbnail, name, category, price, stock status, active toggle
   - Search by name, filter by category
   - Bulk actions: delete, activate/deactivate
   - "Add Product" button

2. app/(admin)/admin/products/new/page.tsx AND app/(admin)/admin/products/[id]/page.tsx (shared form)
   Product form fields:
   - Name, slug (auto-generated from name), description (rich text)
   - Category dropdown
   - Base price, compare price (for strike-through)
   - Tags (comma-separated input)
   - Is Active toggle, Is Featured toggle
   - Image uploader (multiple images, drag to reorder) using UploadThing
   - Variant builder: add rows of Size + Color + Color Hex + SKU + Stock + Price override
     Sizes: S, M, L, XL, XXL | Colors: free text input with color picker

3. API routes:
   - GET/POST /api/admin/products
   - GET/PUT/DELETE /api/admin/products/[id]
   - POST /api/admin/products/[id]/variants

Use react-hook-form + zod for validation. Use Prisma for database operations.
```

---

### Step 7 — Order management (admin)

```
Build the order management section for my clothing ecom store admin panel.

Pages to create:
1. app/(admin)/admin/orders/page.tsx
   - Orders table: order number, customer name, total, payment method, payment status, order status, date
   - Filter by status (Pending/Confirmed/Packed/Shipped/Delivered/Cancelled)
   - Filter by payment method (bKash/Nagad/COD)
   - Search by order number or customer name
   - Export to CSV button

2. app/(admin)/admin/orders/[id]/page.tsx
   - Full order detail: customer info, shipping address, items with images
   - Status update dropdown (Pending → Confirmed → Packed → Shipped → Delivered)
   - Status history log timeline
   - Payment status update (mark as Paid/Refunded)
   - Delivery section: assign courier (Pathao/Steadfast), enter consignment ID and tracking code
   - Print invoice button

3. API routes:
   - GET /api/admin/orders — with pagination and filters
   - GET /api/admin/orders/[id]
   - PATCH /api/admin/orders/[id]/status
   - PATCH /api/admin/orders/[id]/delivery

Use Prisma. Show status badges with color-coded styling (Pending=yellow, Shipped=blue, Delivered=green, Cancelled=red).
```

---

### Step 8 — Customer storefront (shop pages)

```
Build the customer-facing storefront for my Next.js 14 clothing ecom store.

Create:
1. app/(store)/page.tsx — Homepage
   - Hero banner (fetch from Banner table)
   - Featured categories grid
   - New arrivals section (latest 8 products)
   - Featured products section (isFeatured=true)

2. app/(store)/shop/page.tsx — Shop page
   - Product grid (responsive: 2 cols mobile, 3-4 cols desktop)
   - Left sidebar filters: category, size (S/M/L/XL/XXL), color, price range
   - Sort: Newest, Price low-high, Price high-low, Popular
   - Pagination (12 per page)
   - URL-based filters (searchParams) so filters are shareable

3. app/(store)/shop/[slug]/page.tsx — Product detail page
   - Image gallery with thumbnail strip
   - Product name, price, compare price with % off badge
   - Size selector (show out-of-stock sizes as disabled)
   - Color selector (colored circles, show out-of-stock as strikethrough)
   - Stock indicator ("Only 3 left!" when stock < 5)
   - Add to cart button
   - Product description tab
   - Related products section

Use Tailwind CSS. Mobile-first design. Fetch data server-side with Prisma.
```

---

### Step 9 — Cart & checkout

```
Build the cart and checkout flow for my Next.js 14 clothing ecom store.

Requirements:
- Cart state managed with Zustand (persisted to localStorage)
- Cart syncs to database when user is logged in
- Guest checkout allowed (no account required)

Create:
1. components/store/CartDrawer.tsx
   - Slide-in drawer from right
   - List of items with image, name, size, color, quantity controls, remove button
   - Subtotal, coupon code input field (validate against API)
   - Loyalty points toggle (if logged in, show available points to redeem)
   - "Proceed to Checkout" button

2. app/(store)/checkout/page.tsx
   - Step 1: Delivery address form (name, phone, division, district, area, full address)
     If logged in, show saved addresses to select
   - Step 2: Payment method selection
     - bKash (redirect to bKash payment)
     - Nagad (redirect to Nagad payment)
     - Cash on Delivery
   - Step 3: Order review + Place Order button
   - Order summary sidebar (always visible)

3. API routes:
   - POST /api/orders — create order, deduct stock, calculate total with coupon
   - POST /api/coupons/validate — check coupon code validity
   - POST /api/loyalty/redeem — apply loyalty points

Use react-hook-form + zod for address form validation.
```

---

### Step 10 — bKash payment integration

```
Integrate bKash payment gateway into my Next.js 14 clothing ecom store.

bKash Merchant API flow:
1. Create Token → 2. Create Payment → 3. Customer pays on bKash → 4. Execute Payment → 5. Verify

Create:
1. lib/bkash.ts — helper functions:
   - getBkashToken() — gets access token (cache for 3600s)
   - createPayment(amount, orderId) — returns bKash payment URL
   - executePayment(paymentID) — confirms payment
   - queryPayment(paymentID) — verify transaction status

2. app/api/payments/bkash/create/route.ts
   - POST — receives orderId, calls createPayment, returns redirect URL

3. app/api/payments/bkash/callback/route.ts
   - GET — bKash redirects here after payment
   - Receives paymentID and status
   - Calls executePayment if status=success
   - Updates Order paymentStatus=PAID and Payment record
   - Redirects to /order/[id]?payment=success or ?payment=failed

4. app/api/payments/bkash/verify/route.ts
   - POST — manual verify endpoint for admin

Environment variables needed: BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL

Use sandbox URL for testing: https://tokenized.sandbox.bka.sh/v1.2.0-beta
```

---

### Step 11 — Pathao courier integration

```
Integrate Pathao courier API into my Next.js 14 clothing ecom store admin panel.

Create:
1. lib/pathao.ts — helper functions:
   - getPathaoToken() — OAuth2 token (cache it)
   - getCities() — list of cities
   - getZones(cityId) — zones in a city
   - getAreas(zoneId) — areas in a zone
   - createParcel(orderData) — creates a consignment, returns consignment_id
   - trackParcel(consignmentId) — returns current status

2. app/api/delivery/pathao/create/route.ts
   - POST — receives orderId
   - Fetches order from database
   - Calls createParcel with recipient info and parcel details
   - Saves consignmentId and trackingCode to Delivery table
   - Updates delivery status to PICKED_UP

3. In admin order detail page, add a "Send to Pathao" button that:
   - Calls the create route
   - Shows the consignment ID and tracking URL
   - Updates the UI with current delivery status

Parcel details: weight=0.5kg default, item_type=2 (clothing), delivery_type=48 (regular)
```

---

### Step 12 — Coupon & loyalty system

```
Build the coupon and loyalty points system for my clothing ecom store.

COUPONS:
1. app/(admin)/admin/coupons/page.tsx
   - Table of all coupons: code, type, value, min order, uses left, expiry, active toggle
   - Create coupon form: code, type (% or flat BDT), value, min order amount, max uses, expiry date

2. API: POST /api/coupons/validate
   - Check if code exists, is active, not expired, usage not exceeded, order meets min amount
   - Return discount amount or error message

LOYALTY POINTS:
3. app/(admin)/admin/loyalty/page.tsx
   - Config settings: points earned per ৳1 spent (default: 1 point per ৳10)
   - Redemption rate: points needed per ৳1 discount (default: 10 points = ৳1)
   - Table of top customers by points balance

4. lib/loyalty.ts
   - awardPoints(userId, orderId, orderTotal) — calculate and save earned points
   - redeemPoints(userId, points) — deduct points, return BDT value
   - getBalance(userId) — sum all point entries for user

5. In the order creation API:
   - After successful payment, call awardPoints()
   - If loyalty points were redeemed at checkout, call redeemPoints() and deduct from total

6. In customer account page:
   - Show current points balance
   - Show points history (earned/redeemed per order)
```

---

### Step 13 — Reports & analytics (admin)

```
Build the reports and analytics page for my clothing ecom store admin panel.

Page: app/(admin)/admin/reports/page.tsx

Sections to include:

1. Date range picker (Today, Last 7 days, Last 30 days, Custom range)

2. Summary cards:
   - Total revenue (paid orders only)
   - Total orders
   - Average order value
   - Total customers (new in period)

3. Revenue chart (line chart — daily revenue in selected period) using recharts

4. Payment method breakdown (pie chart: bKash % vs Nagad % vs COD %)

5. Top 10 products by revenue (table: product name, units sold, revenue)

6. Order status breakdown (bar chart: Pending/Confirmed/Packed/Shipped/Delivered/Cancelled)

7. Delivery success rate (delivered vs failed/returned)

8. Export to CSV button for orders in date range

All data fetched from Prisma with aggregate queries.
Use recharts for charts. Use shadcn/ui Card and Table components.
```

---

### Step 14 — Final polish & deployment

```
Prepare my Next.js 14 clothing ecom store for production deployment on Vercel.

Tasks:
1. Add loading.tsx files for main routes (skeleton loaders)
2. Add error.tsx files for graceful error handling
3. Add not-found.tsx for 404 page
4. Add sitemap.ts — generate sitemap for all products and categories
5. Add robots.ts
6. Add Open Graph meta tags to product pages (for Facebook sharing)
7. Add next.config.js with:
   - Image domains for Supabase storage and Cloudinary
   - Security headers
8. Performance:
   - Use Next.js ISR (revalidate: 60) for product and category pages
   - Add lazy loading for images below the fold
9. Create a seed script (prisma/seed.ts) that creates:
   - 1 admin user (email: admin@yourstore.com, password: Admin@1234)
   - 5 sample categories
   - 10 sample products with variants
   - 2 sample coupons
10. Show me the Vercel deployment checklist (env vars to add, build settings)
```

---

## Environment Variables Checklist

Before deploying, make sure all these are set in Vercel:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel domain e.g. `https://yourstore.vercel.app` |
| `BKASH_APP_KEY` | bKash merchant portal |
| `BKASH_APP_SECRET` | bKash merchant portal |
| `BKASH_USERNAME` | bKash merchant portal |
| `BKASH_PASSWORD` | bKash merchant portal |
| `NAGAD_MERCHANT_ID` | Nagad merchant portal |
| `NAGAD_MERCHANT_PRIVATE_KEY` | Nagad merchant portal |
| `PATHAO_CLIENT_ID` | Pathao merchant API |
| `PATHAO_CLIENT_SECRET` | Pathao merchant API |
| `STEADFAST_API_KEY` | Steadfast merchant API |
| `UPLOADTHING_SECRET` | uploadthing.com dashboard |

---

## Quick Reference — Key Commands

```bash
# Initial setup
npx create-next-app@latest my-clothing-store
cd my-clothing-store
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers

# Database
npx prisma generate        # generate Prisma client after schema changes
npx prisma db push         # push schema to Supabase (dev)
npx prisma migrate dev     # create migration files (production-ready)
npx prisma studio          # visual DB browser
npx prisma db seed         # run seed script

# Dev
npm run dev                # start development server

# Deploy
vercel --prod              # deploy to Vercel
```

---

*Built for The Digital Dude — clothing ecom store, Bangladesh market*
