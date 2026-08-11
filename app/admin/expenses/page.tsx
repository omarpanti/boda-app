import { prisma } from '@/lib/prisma'
import ExpensesClient from './ExpensesClient'
export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finanzas y Presupuesto</h1>
            <p className="text-gray-500 mt-2">Lleva el control de todos los costos, anticipos y deudas de tu evento.</p>
          </div>
          <a href="/" className="text-blue-600 font-medium hover:underline whitespace-nowrap">← Volver al Panel</a>
        </div>
        
        <ExpensesClient initialExpenses={expenses} />
      </div>
    </main>
  )
}
