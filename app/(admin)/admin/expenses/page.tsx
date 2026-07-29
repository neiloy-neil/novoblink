import prisma from "@/lib/prisma"
import { ExpenseClient } from "./ExpenseClient"

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } })

  const formatted = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    date: e.date.toISOString(),
    note: e.note,
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
      </div>
      <ExpenseClient data={formatted} />
    </div>
  )
}
