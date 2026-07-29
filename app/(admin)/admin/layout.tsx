import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/admin/Sidebar"
import AdminTopbar from "@/components/admin/AdminTopbar"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar — fixed height, only nav scrolls inside */}
      <aside className="hidden md:flex w-[240px] lg:w-[260px] shrink-0 flex-col bg-slate-900 text-white overflow-hidden">
        {/* Logo */}
        <div className="flex h-[60px] shrink-0 items-center gap-3 px-5 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900 text-sm font-black">
            D
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wider text-white">NovoBlink</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Admin Panel</div>
          </div>
        </div>

        {/* Nav — scrolls independently */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <Sidebar />
        </div>

        {/* Bottom user hint */}
        <div className="shrink-0 border-t border-white/10 px-5 py-3">
          <p className="text-[11px] text-slate-500 truncate">{session.user.email}</p>
        </div>
      </aside>

      {/* Main column — topbar + scrollable content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminTopbar email={session.user.email ?? ""} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
