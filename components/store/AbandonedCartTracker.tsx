"use client"

import { useSession } from "@/hooks/useSession"
import { useAbandonedCart } from "@/hooks/useAbandonedCart"

export default function AbandonedCartTracker() {
  const { data: session } = useSession()
  useAbandonedCart(session?.user?.email ?? undefined)
  return null
}
