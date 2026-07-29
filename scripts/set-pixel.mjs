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

await db.query(`
  INSERT INTO settings (id, key, value)
  VALUES (gen_random_uuid(), 'meta_pixel_id', '1753613795678344')
  ON CONFLICT (key) DO UPDATE SET value = '1753613795678344'
`)
console.log('✓ meta_pixel_id set to 1753613795678344')

await db.end()
