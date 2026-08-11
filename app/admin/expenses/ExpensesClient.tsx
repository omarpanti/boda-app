'use client'

import { useState } from 'react'
import { addExpense, deleteExpense, registerPayment } from './actions'

type Expense = {
  id: number
  title: string
  vendor: string | null
  category: string
  estimatedAmount: number
  actualAmount: number
  paidAmount: number
  dueDate: Date | null
  isPaid: boolean
}

const CATEGORIES = ['Banquetes y Bebidas', 'Decoración y Flores', 'Música y Entretenimiento', 'Lugar', 'Fotografía y Video', 'Vestuario', 'Invitaciones', 'Otros']

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '', vendor: '', category: CATEGORIES[0],
    estimatedAmount: '', actualAmount: '', paidAmount: '', dueDate: ''
  })
  
  // Dashboard Calculations
  const totalEstimated = initialExpenses.reduce((acc, exp) => acc + exp.estimatedAmount, 0)
  const totalActual = initialExpenses.reduce((acc, exp) => acc + exp.actualAmount, 0)
  const totalPaid = initialExpenses.reduce((acc, exp) => acc + exp.paidAmount, 0)
  const totalDebt = totalActual - totalPaid

  // Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addExpense({
      title: formData.title,
      vendor: formData.vendor || undefined,
      category: formData.category,
      estimatedAmount: parseFloat(formData.estimatedAmount) || 0,
      actualAmount: parseFloat(formData.actualAmount) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null
    })
    setShowModal(false)
    setFormData({ title: '', vendor: '', category: CATEGORIES[0], estimatedAmount: '', actualAmount: '', paidAmount: '', dueDate: '' })
  }

  const handleQuickPayment = async (id: number, remaining: number) => {
    const payment = prompt(`Ingresa la cantidad a abonar (Deuda actual: ${formatMoney(remaining)}):`, remaining.toString())
    if (payment && !isNaN(parseFloat(payment))) {
      await registerPayment(id, parseFloat(payment))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Kpis Visuales (Tarjetas de Resumen) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative overflow-hidden backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-4xl grayscale">💭</div>
          <h3 className="text-slate-400 font-medium text-sm mb-2 uppercase tracking-wider">Presupuesto Estimado</h3>
          <p className="text-3xl font-bold text-white">{formatMoney(totalEstimated)}</p>
        </div>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-blue-400 font-medium text-sm mb-2 uppercase tracking-wider">Costo Real Acumulado</h3>
          <p className="text-3xl font-bold text-white">{formatMoney(totalActual)}</p>
        </div>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-emerald-500/20 relative overflow-hidden backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-emerald-400 font-medium text-sm mb-2 uppercase tracking-wider">Total Pagado</h3>
          <p className="text-3xl font-bold text-white">{formatMoney(totalPaid)}</p>
          <div className="mt-4 w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
            <div className="bg-gradient-to-r from-emerald-600 to-green-400 h-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${totalActual > 0 ? (totalPaid / totalActual) * 100 : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-rose-500/20 relative overflow-hidden backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-rose-400 font-medium text-sm mb-2 uppercase tracking-wider">Deuda Restante</h3>
          <p className="text-3xl font-bold text-white">{formatMoney(totalDebt > 0 ? totalDebt : 0)}</p>
        </div>
      </div>

      {/* 2. Tabla Interactiva y Controles */}
      <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center bg-transparent">
          <h2 className="text-2xl font-bold text-white tracking-tight">Desglose de Proveedores</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all shadow-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Añadir Gasto
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40 text-slate-300 text-sm border-b border-white/10 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold w-1/4">Gasto / Proveedor</th>
                <th className="p-4 font-semibold">Categoría</th>
                <th className="p-4 font-semibold text-right">Costo Real</th>
                <th className="p-4 font-semibold text-right">Pagado</th>
                <th className="p-4 font-semibold text-right">Por Pagar</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {initialExpenses.map(exp => {
                const remaining = exp.actualAmount - exp.paidAmount
                return (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="font-semibold text-white">{exp.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{exp.vendor || 'Proveedor no especificado'}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-white/5 border border-white/10 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-white">{formatMoney(exp.actualAmount)}</td>
                    <td className="p-4 text-right font-medium text-emerald-400">{formatMoney(exp.paidAmount)}</td>
                    <td className="p-4 text-right font-bold text-rose-400">{remaining > 0 ? formatMoney(remaining) : '—'}</td>
                    <td className="p-4 text-center">
                      {exp.isPaid || remaining <= 0 ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Pagado</span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Pendiente</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        {remaining > 0 && (
                          <button onClick={() => handleQuickPayment(exp.id, remaining)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
                            Abonar
                          </button>
                        )}
                        <button onClick={async () => { if(confirm('¿Borrar registro?')) await deleteExpense(exp.id) }} className="text-slate-500 hover:text-rose-400 transition-colors p-2 hover:bg-rose-400/10 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {initialExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <p className="mb-3 text-lg">Aún no has registrado ningún gasto.</p>
                    <button onClick={() => setShowModal(true)} className="text-blue-400 font-medium hover:underline">Registrar el primer gasto</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Registrar Gasto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Centros de mesa florales" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-black" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Opcional)</label>
                  <input type="text" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} placeholder="Ej: Florería X" className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-black" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-white text-black">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Estimado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input type="number" required value={formData.estimatedAmount} onChange={e => setFormData({...formData, estimatedAmount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 pl-8 outline-none focus:border-blue-500 text-black" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Real Acordado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input type="number" required value={formData.actualAmount} onChange={e => setFormData({...formData, actualAmount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 pl-8 outline-none focus:border-blue-500 text-black" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anticipo Pagado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input type="number" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 pl-8 outline-none focus:border-blue-500 text-black" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-black" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
