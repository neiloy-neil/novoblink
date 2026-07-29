import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""))
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]))
  })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    const text = await file.text()
    const rows = parseCSV(text)

    let imported = 0, skipped = 0
    const errors: string[] = []

    for (const row of rows) {
      const email = row.email?.trim()
      if (!email || !email.includes("@")) {
        errors.push(`Invalid email: ${email || "(empty)"}`)
        continue
      }
      try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) { skipped++; continue }
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email,
            name: row.name || null,
            phone: row.phone || null,
            role: (row.role?.toUpperCase() as any) || "CUSTOMER",
          }
        })
        imported++
      } catch (e: any) {
        errors.push(`${email}: ${e.message}`)
      }
    }
    return NextResponse.json({ imported, skipped, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
