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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">💭</div>
          <h3 className="text-gray-500 font-medium text-sm mb-1">Presupuesto Estimado</h3>
          <p className="text-2xl font-bold text-gray-800">{formatMoney(totalEstimated)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>
          <h3 className="text-blue-600 font-medium text-sm mb-1">Costo Real Acumulado</h3>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(totalActual)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>
          <h3 className="text-green-600 font-medium text-sm mb-1">Total Pagado</h3>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPaid)}</p>
          <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full" style={{ width: `${totalActual > 0 ? (totalPaid / totalActual) * 100 : 0}%` }}></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>
          <h3 className="text-red-600 font-medium text-sm mb-1">Deuda Restante</h3>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(totalDebt > 0 ? totalDebt : 0)}</p>
        </div>
      </div>

      {/* 2. Tabla Interactiva y Controles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Desglose de Proveedores</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+</span> Añadir Gasto
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-500 text-sm">Gasto / Proveedor</th>
                <th className="p-4 font-semibold text-gray-500 text-sm">Categoría</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Costo Real</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Pagado</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Por Pagar</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-center">Estado</th>
                <th className="p-4 font-semibold text-gray-500 text-sm text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialExpenses.map(exp => {
                const remaining = exp.actualAmount - exp.paidAmount
                return (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{exp.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{exp.vendor || 'Proveedor no especificado'}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900">{formatMoney(exp.actualAmount)}</td>
                    <td className="p-4 text-right font-medium text-green-700">{formatMoney(exp.paidAmount)}</td>
                    <td className="p-4 text-right font-bold text-red-600">{remaining > 0 ? formatMoney(remaining) : '—'}</td>
                    <td className="p-4 text-center">
                      {exp.isPaid || remaining <= 0 ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Pagado</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">Pendiente</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3 items-center">
                        {remaining > 0 && (
                          <button onClick={() => handleQuickPayment(exp.id, remaining)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                            Abonar
                          </button>
                        )}
                        <button onClick={async () => { if(confirm('¿Borrar registro?')) await deleteExpense(exp.id) }} className="text-gray-400 hover:text-red-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {initialExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <p className="mb-2">Aún no has registrado ningún gasto.</p>
                    <button onClick={() => setShowModal(true)} className="text-blue-600 font-medium hover:underline">Registrar el primero</button>
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
