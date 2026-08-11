import { prisma } from '@/lib/prisma'
import ExpensesClient from './ExpensesClient'
export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="mb-12 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">Finanzas y Presupuesto</h1>
            <p className="text-slate-400 mt-3 font-light">Lleva el control exacto de todos los costos, anticipos y deudas de tu evento.</p>
          </div>
          <a href="/" className="text-slate-300 font-medium hover:text-white flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/10 transition-all whitespace-nowrap">
            <span>←</span> Volver al Panel
          </a>
        </div>
        
        <ExpensesClient initialExpenses={expenses} />
      </div>
    </main>
  )
}
