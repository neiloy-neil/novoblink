import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"

export type AuthSession = {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
} | null

/**
 * Compatibility shim standing in for NextAuth's auth(). Keeps the same
 * { user: { id, email, name, role } } shape so existing API routes and
 * server components (requireAdmin(), session?.user?.id, etc.) work
 * unchanged after the Supabase Auth migration.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function auth(): Promise<AuthSession> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, role: true },
  })

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: profile?.name ?? (user.user_metadata?.name as string | undefined) ?? null,
      role: profile?.role ?? "CUSTOMER",
    },
  }
}
