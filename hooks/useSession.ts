"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type SessionUser = { id: string; email: string; name: string | null; role: string }
type SessionState =
  | { data: null; status: "loading" }
  | { data: null; status: "unauthenticated" }
  | { data: { user: SessionUser }; status: "authenticated" }

function toState(user: User | null): SessionState {
  if (!user) return { data: null, status: "unauthenticated" }
  return {
    data: {
      user: {
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.name as string) ?? (user.user_metadata?.full_name as string) ?? null,
        role: (user.app_metadata?.role as string) ?? "CUSTOMER",
      },
    },
    status: "authenticated",
  }
}

// Compatibility shim for next-auth/react's useSession(), backed by Supabase.
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ data: null, status: "loading" })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(toState(session?.user ?? null))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(toState(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient()
  await supabase.auth.signOut()
  if (options?.callbackUrl) window.location.href = options.callbackUrl
}
