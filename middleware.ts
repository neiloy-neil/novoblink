import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie if expired — required for SSR auth to work.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith("/admin")
  const isAccountRoute = pathname.startsWith("/account")
  const role = (user?.app_metadata as { role?: string } | undefined)?.role

  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (isAccountRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Capture affiliate ref code — store in cookie for 30 days
  const refCode = request.nextUrl.searchParams.get("ref")
  if (refCode) {
    response.cookies.set("drip_ref", refCode.toUpperCase(), {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
