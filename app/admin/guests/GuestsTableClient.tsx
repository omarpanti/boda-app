'use client'

import { useState } from 'react'
import { deleteGuest, deleteMultipleGuests } from './actions'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Guest = { id: number, name: string, phone: string | null, gender: string, rsvpStatus: string, uniqueLink: string }

export default function GuestsTableClient({ guests }: { guests: Guest[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredGuests.map(g => g.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    const isAll = selectedIds.length === guests.length
    if (confirm(isAll ? '¿Estás completamente seguro de borrar TODOS los invitados?' : `¿Estás seguro de eliminar ${selectedIds.length} invitados?`)) {
      await deleteMultipleGuests(selectedIds)
      setSelectedIds([])
    }
  }

  const handleExportExcel = () => {
    const data = filteredGuests.map(g => ({
      Nombre: g.name,
      Teléfono: g.phone || 'N/A',
      Estatus: g.rsvpStatus === 'PENDING' ? 'Pendiente' : g.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'Rechazado',
      Género: g.gender === 'M' ? 'Hombre' : 'Mujer'
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Invitados")
    XLSX.writeFile(wb, "Reporte_Invitados.xlsx")
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Reporte de Invitados", 14, 15)
    
    const tableColumn = ["Nombre", "Teléfono", "Estatus", "Género"]
    const tableRows = filteredGuests.map(g => [
      g.name,
      g.phone || 'N/A',
      g.rsvpStatus === 'PENDING' ? 'Pendiente' : g.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'Rechazado',
      g.gender === 'M' ? 'Hombre' : 'Mujer'
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="bg-white/5 rounded-3xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
      {/* Buscador y Barra de acciones masivas */}
      <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-transparent">
        <input 
          type="text" 
          placeholder="🔍 Buscar invitado por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-black/30 border border-white/10 text-white p-3 rounded-xl w-full sm:w-80 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all"
        />
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={handleExportPDF} className="bg-gradient-to-r from-red-600/80 to-rose-600/80 text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-sm font-medium hover:from-red-500 hover:to-rose-500 transition-all flex-1 sm:flex-none text-center shadow-lg hover:shadow-red-500/25">
            📄 Reporte PDF
          </button>
          <button onClick={handleExportExcel} className="bg-gradient-to-r from-emerald-600/80 to-green-600/80 text-white border border-green-500/30 px-5 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-green-500 transition-all flex-1 sm:flex-none text-center shadow-lg hover:shadow-emerald-500/25">
            📊 Descargar Excel
          </button>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <span className="text-rose-400 font-medium bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">{selectedIds.length} seleccionados</span>
            <button 
              onClick={handleDeleteSelected} 
              className="bg-red-600/90 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500 transition-colors shadow-lg"
            >
              Eliminar Seleccionados
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-slate-300 text-sm border-b border-white/10 uppercase tracking-wider">
              <th className="p-4 font-semibold w-12 text-center">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={filteredGuests.length > 0 && selectedIds.length === filteredGuests.length}
                  className="rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 w-4 h-4 cursor-pointer accent-blue-500"
                />
              </th>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Teléfono</th>
              <th className="p-4 font-semibold">Link de Invitación</th>
              <th className="p-4 font-semibold text-center">Estatus</th>
              <th className="p-4 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 italic">
                  No hay invitados registrados aún o la búsqueda no arrojó resultados.
                </td>
              </tr>
            ) : (
              filteredGuests.map(guest => (
                <tr key={guest.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(guest.id)}
                      onChange={(e) => handleSelectOne(guest.id, e.target.checked)}
                      className="rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 w-4 h-4 cursor-pointer accent-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg shadow-inner border border-white/5">
                        {guest.gender === 'M' ? '👨' : '👩'}
                      </div>
                      <span className="font-medium text-white">{guest.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-sm">{guest.phone || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/invite/${guest.uniqueLink}`} 
                        target="_blank" 
                        className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                      >
                        Ver Invitación <span className="text-xs">↗</span>
                      </a>
                      {guest.phone && (
                        <a 
                          href={`https://wa.me/${guest.phone}?text=${encodeURIComponent(`¡Hola ${guest.name}! Te comparto tu invitación para la boda: ${window.location.origin}/invite/${guest.uniqueLink}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
                        >
                          📱 Enviar WP
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {guest.rsvpStatus === 'PENDING' && (
                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        Pendiente
                      </span>
                    )}
                    {guest.rsvpStatus === 'CONFIRMED' && (
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        Confirmado
                      </span>
                    )}
                    {guest.rsvpStatus === 'DECLINED' && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        Rechazado
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={async () => {
                        if(confirm(`¿Estás seguro de eliminar a ${guest.name}?`)) {
                          await deleteGuest(guest.id)
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all"
                      title="Eliminar invitado"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
