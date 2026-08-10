'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addExpense(data: {
  title: string
  vendor?: string
  category: string
  estimatedAmount: number
  actualAmount: number
  paidAmount: number
  dueDate?: Date | null
}) {
  await prisma.expense.create({
    data: {
      title: data.title,
      vendor: data.vendor,
      category: data.category,
      estimatedAmount: data.estimatedAmount,
      actualAmount: data.actualAmount,
      paidAmount: data.paidAmount,
      dueDate: data.dueDate,
      isPaid: data.paidAmount >= data.actualAmount && data.actualAmount > 0
    }
  })
  revalidatePath('/admin/expenses')
}

export async function updateExpense(id: number, data: {
  title?: string
  vendor?: string
  category?: string
  estimatedAmount?: number
  actualAmount?: number
  paidAmount?: number
  dueDate?: Date | null
}) {
  const current = await prisma.expense.findUnique({ where: { id } })
  if (!current) return

  const actualAmount = data.actualAmount !== undefined ? data.actualAmount : current.actualAmount
  const paidAmount = data.paidAmount !== undefined ? data.paidAmount : current.paidAmount

  await prisma.expense.update({
    where: { id },
    data: {
      ...data,
      isPaid: paidAmount >= actualAmount && actualAmount > 0
    }
  })
  revalidatePath('/admin/expenses')
}

export async function deleteExpense(id: number) {
  await prisma.expense.delete({ where: { id } })
  revalidatePath('/admin/expenses')
}

export async function registerPayment(id: number, amount: number) {
  const current = await prisma.expense.findUnique({ where: { id } })
  if (!current) return

  const newPaidAmount = current.paidAmount + amount
  
  await prisma.expense.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      isPaid: newPaidAmount >= current.actualAmount && current.actualAmount > 0
    }
  })
  revalidatePath('/admin/expenses')
}
