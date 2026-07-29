"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Customer = {
  id: string
  name: string
  email: string
  currentBalance: number
  totalEarned: number
  totalRedeemed: number
}

export function LoyaltyClient({
  customers,
  initialSettings,
}: {
  customers: Customer[]
  initialSettings: { pointsPerTaka: string; pointsRedemptionRate: string }
}) {
  const router = useRouter()
  const [pointsPerTaka, setPointsPerTaka] = useState(initialSettings.pointsPerTaka)
  const [pointsRedemptionRate, setPointsRedemptionRate] = useState(initialSettings.pointsRedemptionRate)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [adjustPoints, setAdjustPoints] = useState("")
  const [adjustNote, setAdjustNote] = useState("")

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            points_per_taka: pointsPerTaka,
            points_redemption_rate: pointsRedemptionRate,
          },
        }),
      })
      if (res.ok) {
        toast.success("Loyalty settings saved")
        router.refresh()
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      const res = await fetch("/api/admin/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          points: parseInt(adjustPoints),
          description: adjustNote,
        }),
      })
      if (res.ok) {
        const pts = parseInt(adjustPoints)
        toast.success(`${pts > 0 ? "Added" : "Deducted"} ${Math.abs(pts)} points`)
        setSelectedUser(null)
        setAdjustPoints("")
        setAdjustNote("")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to adjust points")
      }
    } catch {
      toast.error("Error adjusting points")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Settings</CardTitle>
          <CardDescription>Configure how points are earned and redeemed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Points earned per ৳10 spent</label>
              <Input type="number" value={pointsPerTaka} onChange={(e) => setPointsPerTaka(e.target.value)} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Redemption Rate (Points = ৳1)</label>
              <Input type="number" value={pointsRedemptionRate} onChange={(e) => setPointsRedemptionRate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customers by Points</CardTitle>
          <CardDescription>{customers.length} customers shown, sorted by balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white dark:bg-neutral-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Redeemed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No customers found.</TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                        {customer.currentBalance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{customer.totalEarned.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{customer.totalRedeemed.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={selectedUser === customer.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                          <DialogTrigger render={
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(customer.id)}>
                              Adjust
                            </Button>
                          } />
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adjust Points: {customer.name}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAdjustPoints} className="space-y-4 mt-4">
                              <div>
                                <label className="text-sm font-medium">Points (+ to add, − to deduct)</label>
                                <Input required type="number" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Reason / Note</label>
                                <Input required value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. Compensation for delayed order" />
                              </div>
                              <Button type="submit" className="w-full">Apply Adjustment</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
