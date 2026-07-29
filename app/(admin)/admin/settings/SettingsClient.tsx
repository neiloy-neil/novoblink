"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Store, CreditCard, Truck, Percent, Mail, BarChart2, Users, ChevronRight
} from "lucide-react"

type Staff = { id: string; name: string; email: string; role: string }

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "shipping", label: "Shipping & Tax", icon: Truck },
  { id: "email", label: "Email / SMTP", icon: Mail },
  { id: "tracking", label: "Tracking & SEO", icon: BarChart2 },
  { id: "staff", label: "Staff", icon: Users },
]

export function SettingsClient({
  initialSettings,
  initialStaff,
}: {
  initialSettings: Record<string, string>
  initialStaff: Staff[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")

  // General
  const [storeName, setStoreName] = useState(initialSettings["store_name"] || "")
  const [storeTagline, setStoreTagline] = useState(initialSettings["store_tagline"] || "")
  const [storeDescription, setStoreDescription] = useState(initialSettings["store_description"] || "")
  const [supportEmail, setSupportEmail] = useState(initialSettings["support_email"] || "")
  const [supportPhone, setSupportPhone] = useState(initialSettings["support_phone"] || "")
  const [socialFacebook, setSocialFacebook] = useState(initialSettings["social_facebook"] || "")
  const [socialInstagram, setSocialInstagram] = useState(initialSettings["social_instagram"] || "")
  const [socialTiktok, setSocialTiktok] = useState(initialSettings["social_tiktok"] || "")
  const [isSaving, setIsSaving] = useState(false)

  // Payments
  const [enabledCOD, setEnabledCOD] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("COD")
  )
  const [enabledBkash, setEnabledBkash] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("BKASH")
  )
  const [enabledNagad, setEnabledNagad] = useState(
    !initialSettings["enabled_payment_methods"] || initialSettings["enabled_payment_methods"].includes("NAGAD")
  )
  const [bkashNumber, setBkashNumber] = useState(initialSettings["bkash_merchant_number"] || "")
  const [nagadNumber, setNagadNumber] = useState(initialSettings["nagad_merchant_number"] || "")
  const [codDepositEnabled, setCodDepositEnabled] = useState(initialSettings["cod_deposit_enabled"] === "true")
  const [codDepositAmount, setCodDepositAmount] = useState(initialSettings["cod_deposit_amount"] || "100")
  const [isPaymentSaving, setIsPaymentSaving] = useState(false)

  // Shipping & Tax
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(initialSettings["free_shipping_above"] || "")
  const [shippingChargeAmount, setShippingChargeAmount] = useState(initialSettings["shipping_charge"] || "60")
  const [taxEnabled, setTaxEnabled] = useState(initialSettings["tax_enabled"] === "true")
  const [taxRate, setTaxRate] = useState(initialSettings["tax_rate"] || "")
  const [taxLabel, setTaxLabel] = useState(initialSettings["tax_label"] || "VAT")
  const [isShippingTaxSaving, setIsShippingTaxSaving] = useState(false)

  // SMTP
  const [smtpHost, setSmtpHost] = useState(initialSettings["smtp_host"] || "")
  const [smtpPort, setSmtpPort] = useState(initialSettings["smtp_port"] || "587")
  const [smtpSecure, setSmtpSecure] = useState(initialSettings["smtp_secure"] === "true")
  const [smtpUser, setSmtpUser] = useState(initialSettings["smtp_user"] || "")
  const [smtpPass, setSmtpPass] = useState(initialSettings["smtp_pass"] || "")
  const [smtpFromName, setSmtpFromName] = useState(initialSettings["smtp_from_name"] || "")
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialSettings["smtp_from_email"] || "")
  const [adminNotificationEmail, setAdminNotificationEmail] = useState(initialSettings["admin_notification_email"] || "")
  const [testEmailTo, setTestEmailTo] = useState("")
  const [isSmtpSaving, setIsSmtpSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Tracking
  const [ga4Id, setGa4Id] = useState(initialSettings["ga4_id"] || "")
  const [metaPixelId, setMetaPixelId] = useState(initialSettings["meta_pixel_id"] || "")
  const [clarityId, setClarityId] = useState(initialSettings["clarity_id"] || "")
  const [metaTitle, setMetaTitle] = useState(initialSettings["meta_title"] || "")
  const [metaDescription, setMetaDescription] = useState(initialSettings["meta_description"] || "")
  const [isTrackingSaving, setIsTrackingSaving] = useState(false)

  // Staff
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("STAFF")
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const patch = async (settings: Record<string, any>) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    })
    return res.ok
  }

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      const ok = await patch({
        store_name: storeName, store_tagline: storeTagline, store_description: storeDescription,
        support_email: supportEmail, support_phone: supportPhone,
        social_facebook: socialFacebook, social_instagram: socialInstagram, social_tiktok: socialTiktok,
      })
      ok ? toast.success("General settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsSaving(false) }
  }

  const handleSavePayments = async () => {
    setIsPaymentSaving(true)
    try {
      const ok = await patch({
        enabled_payment_methods: [enabledCOD && "COD", enabledBkash && "BKASH", enabledNagad && "NAGAD"].filter(Boolean).join(","),
        bkash_merchant_number: bkashNumber,
        nagad_merchant_number: nagadNumber,
        cod_deposit_enabled: codDepositEnabled,
        cod_deposit_amount: codDepositAmount,
      })
      ok ? toast.success("Payment settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsPaymentSaving(false) }
  }

  const handleSaveShippingTax = async () => {
    setIsShippingTaxSaving(true)
    try {
      const ok = await patch({
        free_shipping_above: freeShippingThreshold,
        shipping_charge: shippingChargeAmount,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_label: taxLabel,
      })
      ok ? toast.success("Shipping & tax settings saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsShippingTaxSaving(false) }
  }

  const handleSaveSmtp = async () => {
    setIsSmtpSaving(true)
    try {
      const ok = await patch({
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_secure: smtpSecure,
        smtp_user: smtpUser, smtp_pass: smtpPass,
        smtp_from_name: smtpFromName, smtp_from_email: smtpFromEmail,
        admin_notification_email: adminNotificationEmail,
      })
      ok ? toast.success("SMTP settings saved") : toast.error("Failed to save")
    } catch { toast.error("Error saving") } finally { setIsSmtpSaving(false) }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailTo) { toast.error("Enter a recipient email"); return }
    setIsSendingTest(true)
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      })
      const d = await res.json()
      res.ok ? toast.success("Test email sent! Check your inbox.") : toast.error(d.error || "Failed to send")
    } catch { toast.error("Error sending") } finally { setIsSendingTest(false) }
  }

  const handleSaveTracking = async () => {
    setIsTrackingSaving(true)
    try {
      const ok = await patch({ ga4_id: ga4Id, meta_pixel_id: metaPixelId, clarity_id: clarityId, meta_title: metaTitle, meta_description: metaDescription })
      ok ? toast.success("Tracking & SEO saved") : toast.error("Failed to save")
      if (ok) router.refresh()
    } catch { toast.error("Error saving") } finally { setIsTrackingSaving(false) }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/admin/settings/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) { toast.success("Staff member added"); setIsInviteOpen(false); setInviteEmail(""); router.refresh() }
      else { const d = await res.json(); toast.error(d.error || "Failed") }
    } catch { toast.error("Error") }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/settings/staff/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      res.ok ? toast.success("Role updated") : toast.error("Failed")
      if (res.ok) router.refresh()
    } catch { toast.error("Error") }
  }

  const handleRemoveStaff = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? They will become a regular customer.`)) return
    try {
      const res = await fetch(`/api/admin/settings/staff/${id}`, { method: "DELETE" })
      res.ok ? toast.success("Removed") : toast.error("Failed")
      if (res.ok) router.refresh()
    } catch { toast.error("Error") }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Tab sidebar */}
      <aside className="lg:w-52 shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all text-left w-full",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Tab content */}
      <div className="flex-1 min-w-0 max-w-2xl">

        {/* General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">General</h2>
              <p className="text-sm text-muted-foreground">Your store's name, contact details, and social links.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Store Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Store Name"><Input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></Field>
                <Field label="Tagline"><Input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="Wear Your Story" /></Field>
                <Field label="Description">
                  <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </Field>
                <Field label="Currency"><Input value="BDT (৳)" disabled className="bg-muted text-muted-foreground" /></Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Support Email"><Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@store.com" /></Field>
                  <Field label="Support Phone"><Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+880 1XXXXXXXXX" /></Field>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Facebook"><Input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/..." /></Field>
                <Field label="Instagram"><Input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/..." /></Field>
                <Field label="TikTok"><Input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="https://tiktok.com/..." /></Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveGeneral} disabled={isSaving}>{isSaving ? "Saving…" : "Save General Settings"}</Button>
          </div>
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Payments</h2>
              <p className="text-sm text-muted-foreground">Control which payment methods appear at checkout.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Cash on Delivery (COD)"
                  description="Customer pays on delivery"
                  checked={enabledCOD} onChange={setEnabledCOD}
                />
                <ToggleRow
                  label="bKash"
                  description="Mobile banking"
                  checked={enabledBkash} onChange={setEnabledBkash}
                />
                {enabledBkash && (
                  <Field label="bKash Merchant Number" indent>
                    <Input value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="01XXXXXXXXX" />
                  </Field>
                )}
                <ToggleRow
                  label="Nagad"
                  description="Mobile banking"
                  checked={enabledNagad} onChange={setEnabledNagad}
                />
                {enabledNagad && (
                  <Field label="Nagad Merchant Number" indent>
                    <Input value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="01XXXXXXXXX" />
                  </Field>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">COD Advance Deposit</CardTitle>
                <CardDescription>Require a small bKash deposit before confirming COD orders — reduces fake orders and RTO.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Require deposit on all COD orders"
                  description="When off, only flagged high-risk customers are asked"
                  checked={codDepositEnabled} onChange={setCodDepositEnabled}
                />
                <Field label="Deposit Amount (৳)">
                  <Input type="number" min="0" value={codDepositAmount} onChange={(e) => setCodDepositAmount(e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground mt-1">Recommended ৳100–200. Remainder collected on delivery.</p>
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSavePayments} disabled={isPaymentSaving}>{isPaymentSaving ? "Saving…" : "Save Payment Settings"}</Button>
          </div>
        )}

        {/* Shipping & Tax */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Shipping & Tax</h2>
              <p className="text-sm text-muted-foreground">Flat shipping rates and VAT configuration.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Shipping Rates</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Flat Shipping Charge (৳)">
                    <Input type="number" min="0" value={shippingChargeAmount} onChange={(e) => setShippingChargeAmount(e.target.value)} />
                  </Field>
                  <Field label="Free Shipping Above (৳)">
                    <Input type="number" min="0" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} placeholder="Leave blank to disable" />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">For zone-based rates, use <a href="/admin/shipping-zones" className="underline">Shipping Zones</a>.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">VAT / Tax</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow
                  label="Enable tax at checkout"
                  description="Calculated on subtotal, shown as a separate line"
                  checked={taxEnabled} onChange={setTaxEnabled}
                />
                {taxEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tax Rate (%)">
                      <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="e.g. 5" />
                    </Field>
                    <Field label="Tax Label">
                      <Input value={taxLabel} onChange={(e) => setTaxLabel(e.target.value)} placeholder="VAT" />
                    </Field>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button onClick={handleSaveShippingTax} disabled={isShippingTaxSaving}>{isShippingTaxSaving ? "Saving…" : "Save Shipping & Tax"}</Button>
          </div>
        )}

        {/* Email / SMTP */}
        {activeTab === "email" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Email / SMTP</h2>
              <p className="text-sm text-muted-foreground">All transactional emails route through this config. Leave blank to use the built-in Resend relay.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">SMTP Server</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Field label="SMTP Host"><Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" /></Field>
                  </div>
                  <Field label="Port"><Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" /></Field>
                </div>
                <ToggleRow
                  label="Use SSL/TLS (port 465)"
                  description="Disable to use STARTTLS on port 587"
                  checked={smtpSecure} onChange={setSmtpSecure}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SMTP Username"><Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="noreply@store.com" /></Field>
                  <Field label="SMTP Password"><Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="App password" /></Field>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Sender Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="From Name"><Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="NovoBlink" /></Field>
                  <Field label="From Email"><Input type="email" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="noreply@store.com" /></Field>
                </div>
                <Field label="Admin Notification Email" hint="Receives an email every time a new order is placed. Falls back to Support Email if empty.">
                  <Input type="email" value={adminNotificationEmail} onChange={(e) => setAdminNotificationEmail(e.target.value)} placeholder="orders@store.com" />
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveSmtp} disabled={isSmtpSaving}>{isSmtpSaving ? "Saving…" : "Save SMTP Settings"}</Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Email</CardTitle>
                <CardDescription>Verify your config by sending a test. Save settings above first.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input type="email" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} placeholder="your@email.com" className="flex-1" />
                  <Button variant="outline" onClick={handleSendTestEmail} disabled={isSendingTest}>
                    {isSendingTest ? "Sending…" : "Send Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tracking & SEO */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Tracking & SEO</h2>
              <p className="text-sm text-muted-foreground">Analytics IDs and default meta tags.</p>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Analytics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Google Analytics 4 (GA4)" hint="e.g. G-XXXXXXXXXX">
                  <Input value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} placeholder="G-XXXXXXXXXX" />
                </Field>
                <Field label="Meta Pixel ID" hint="e.g. 123456789012345">
                  <Input value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} placeholder="123456789012345" />
                </Field>
                <Field label="Microsoft Clarity ID" hint="e.g. abc123xyz">
                  <Input value={clarityId} onChange={(e) => setClarityId(e.target.value)} placeholder="abc123xyz" />
                </Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Default SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field label="Site Title">
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="NovoBlink | Wear Your Story" />
                </Field>
                <Field label="Meta Description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
                </Field>
              </CardContent>
            </Card>
            <Button onClick={handleSaveTracking} disabled={isTrackingSaving}>{isTrackingSaving ? "Saving…" : "Save Tracking & SEO"}</Button>
          </div>
        )}

        {/* Staff */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Staff</h2>
                <p className="text-sm text-muted-foreground">Manage administrators and staff access.</p>
              </div>
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger render={<Button size="sm">Add Staff</Button>} />
                <DialogContent>
                  <DialogHeader><DialogTitle>Add a Staff Member</DialogTitle></DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4 mt-4">
                    <Field label="Email Address">
                      <Input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com" />
                    </Field>
                    <Field label="Role">
                      <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "STAFF")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff (Limited Access)</SelectItem>
                          <SelectItem value="ADMIN">Administrator (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button type="submit" className="w-full">Add Staff Member</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No staff members yet.</TableCell>
                      </TableRow>
                    ) : (
                      initialStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                          <TableCell>
                            <Select value={staff.role} onValueChange={(val) => handleRoleChange(staff.id, val || "")}>
                              <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveStaff(staff.id, staff.name)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Small helper components
function Field({ label, hint, indent, children }: { label: string; hint?: string; indent?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", indent && "ml-4 pl-4 border-l border-border")}>
      <label className="flex items-center gap-2 text-sm font-medium">
        {label}
        {hint && <span className="text-xs text-muted-foreground font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
