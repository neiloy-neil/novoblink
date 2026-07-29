import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "Recipient email required" }, { status: 400 })

  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email", "store_name"]
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  let transport: nodemailer.Transporter

  if (s.smtp_host && s.smtp_user && s.smtp_pass) {
    transport = nodemailer.createTransport({
      host: s.smtp_host,
      port: Number(s.smtp_port || 587),
      secure: s.smtp_secure === "true",
      auth: { user: s.smtp_user, pass: s.smtp_pass },
    })
  } else {
    return NextResponse.json({ error: "No SMTP configured. Fill in the Email settings first." }, { status: 400 })
  }

  const fromName = s.smtp_from_name || s.store_name || "NovoBlink"
  const fromEmail = s.smtp_from_email || s.smtp_user || "noreply@NovoBlink.fashion"

  try {
    await transport.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Test email from ${fromName}`,
      html: `<div style="font-family:sans-serif;padding:32px;max-width:480px">
        <h2 style="margin:0 0 12px">Email is working!</h2>
        <p style="color:#555">Your SMTP configuration is set up correctly. Transactional emails from <strong>${fromName}</strong> will be delivered through this server.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Sent via ${s.smtp_host || "Resend"}</p>
      </div>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Send failed" }, { status: 500 })
  }
}
