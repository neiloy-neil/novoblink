import prisma from "@/lib/prisma"
import { sendOrderStatusUpdate, sendStoreCreditIssued } from "@/lib/email"

type TriggerName =
  | "ORDER_PLACED"
  | "ORDER_STATUS_CHANGED"
  | "PAYMENT_RECEIVED"
  | "REVIEW_LEFT"
  | "CUSTOMER_REGISTERED"
  | "ABANDONED_CART"
  | "RETURN_APPROVED"

type TriggerPayload = Record<string, any>

export async function runWorkflows(trigger: TriggerName, payload: TriggerPayload) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { trigger, isActive: true },
    })

    for (const wf of workflows) {
      try {
        const conditions = (wf.conditions as any[]) || []
        if (!checkConditions(conditions, payload)) {
          await logRun(wf.id, payload, "SKIPPED", "Conditions not met")
          continue
        }

        const actions = (wf.actions as any[]) || []
        for (const action of actions) {
          await executeAction(action, payload)
        }

        await logRun(wf.id, payload, "SUCCESS")
        await prisma.workflow.update({ where: { id: wf.id }, data: { runCount: { increment: 1 } } })
      } catch (e: any) {
        await logRun(wf.id, payload, "FAILED", e.message)
      }
    }
  } catch {
    // workflow engine is non-critical — never block main operations
  }
}

function checkConditions(conditions: any[], payload: TriggerPayload): boolean {
  for (const cond of conditions) {
    const val = payload[cond.field]
    const target = cond.value
    if (cond.operator === "eq" && String(val) !== String(target)) return false
    if (cond.operator === "neq" && String(val) === String(target)) return false
    if (cond.operator === "gt" && Number(val) <= Number(target)) return false
    if (cond.operator === "lt" && Number(val) >= Number(target)) return false
    if (cond.operator === "contains" && !String(val).includes(String(target))) return false
  }
  return true
}

async function executeAction(action: any, payload: TriggerPayload) {
  const config = action.config || {}

  switch (action.type) {
    case "SEND_EMAIL": {
      const email = payload.customerEmail || payload.email
      if (!email) break
      await sendOrderStatusUpdate({
        to: email,
        customerName: payload.customerName || "Customer",
        orderNumber: payload.orderNumber || "",
        status: config.status || payload.status || "UPDATE",
        note: config.message,
      })
      break
    }

    case "ADD_TAG": {
      const userId = payload.userId
      if (!userId || !config.tag) break
      await prisma.customerTag.upsert({
        where: { userId_tag: { userId, tag: config.tag } },
        create: { userId, tag: config.tag },
        update: {},
      })
      break
    }

    case "REMOVE_TAG": {
      const userId = payload.userId
      if (!userId || !config.tag) break
      await prisma.customerTag.deleteMany({ where: { userId, tag: config.tag } })
      break
    }

    case "ADD_STORE_CREDIT": {
      const userId = payload.userId
      if (!userId || !config.amount) break
      await prisma.storeCredit.upsert({
        where: { userId },
        create: { userId, balance: Number(config.amount) },
        update: { balance: { increment: Number(config.amount) } },
      })
      await prisma.storeCreditTransaction.create({
        data: { userId, amount: Number(config.amount), type: "CREDIT", reason: config.reason || "Workflow reward" },
      })
      const email = payload.customerEmail
      if (email) {
        const credit = await prisma.storeCredit.findUnique({ where: { userId } })
        await sendStoreCreditIssued({
          to: email,
          customerName: payload.customerName || "Customer",
          amount: Number(config.amount),
          reason: config.reason || "Loyalty reward",
          balance: Number(credit?.balance || config.amount),
        })
      }
      break
    }

    case "NOTIFY_ADMIN": {
      // Log to audit table as a notification
      await prisma.auditLog.create({
        data: {
          action: "workflow.admin_notification",
          entityType: config.entityType || "Workflow",
          entityId: payload.orderId || payload.userId || null,
          after: { message: config.message, payload },
        },
      })
      break
    }
  }
}

async function logRun(workflowId: string, payload: TriggerPayload, status: string, log?: string) {
  await prisma.workflowRun.create({
    data: {
      workflowId,
      entityId: payload.orderId || payload.userId || "unknown",
      entityType: payload.orderId ? "Order" : "User",
      status,
      log: log || null,
    },
  })
}
