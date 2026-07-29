"use client"

import { useEffect } from "react"
import { useSession } from "@/hooks/useSession"
import { useWishlistStore } from "@/store/useWishlistStore"

export default function WishlistSync() {
  const session = useSession()
  const { setUserId, loadFromDB, userId } = useWishlistStore()
  const sessionUserId = session.data?.user?.id ?? null

  useEffect(() => {
    if (sessionUserId && sessionUserId !== userId) {
      setUserId(sessionUserId)
      loadFromDB()
    } else if (!sessionUserId && userId) {
      setUserId(null)
    }
  }, [sessionUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
