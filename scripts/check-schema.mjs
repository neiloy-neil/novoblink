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

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

for (const t of ['categories', 'products', 'product_variants', 'product_images']) {
  const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t])
  console.log(t + ':\n  ' + r.rows.map(x => x.column_name).join(', '))
}
await client.end()
