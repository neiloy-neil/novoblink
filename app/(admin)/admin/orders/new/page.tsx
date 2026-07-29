import ManualOrderForm from "@/components/admin/ManualOrderForm"

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create an order on behalf of a customer — for orders taken by phone, Messenger, or WhatsApp.
        </p>
      </div>
      <ManualOrderForm />
    </div>
  )
}
