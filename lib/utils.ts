import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Recursively converts Prisma Decimal objects to plain numbers so data can be
// passed from Server Components to Client Components without serialization errors.
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    if (value !== null && typeof value === 'object' && value.constructor?.name === 'Decimal') {
      return parseFloat(value.toString())
    }
    return value
  }))
}

export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}
