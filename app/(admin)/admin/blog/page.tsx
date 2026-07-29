import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import BlogAdminClient from "./BlogAdminClient"

export default async function BlogAdminPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const posts = await prisma.blogPost.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage editorial content. Published posts appear on /blog.</p>
      </div>
      <BlogAdminClient data={JSON.parse(JSON.stringify(posts))} />
    </div>
  )
}
