import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // Cap the pool per Prisma Client instance — on serverless (Vercel), each
  // function invocation can spin up its own instance, and Supabase's
  // session-mode pooler only allows 15 concurrent connections total.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
