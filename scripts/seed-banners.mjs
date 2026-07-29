import pg from 'pg'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// Find actual table name
const tables = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`)
console.log('Tables:', tables.rows.map(r => r.tablename).join(', '))

// Check column names
const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='banners' ORDER BY ordinal_position`)
console.log('Columns:', cols.rows.map(r => r.column_name).join(', '))

await client.query(`DELETE FROM banners`)
console.log('Cleared old banners')

// Build insert using actual column names (snake_case from Prisma)
await client.query(`
  INSERT INTO banners (id, title, image, link, "isActive", "sortOrder", "createdAt")
  VALUES
    (gen_random_uuid(), 'Tech That Moves You',   'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=2070&auto=format&fit=crop', '/shop', true, 1, now()),
    (gen_random_uuid(), 'Pro Audio Collection',  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop', '/shop', true, 2, now()),
    (gen_random_uuid(), 'Smart Home & Lifestyle','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop',     '/shop', true, 3, now())
`)
console.log('Inserted 3 NovoBlink banners')

await client.end()
