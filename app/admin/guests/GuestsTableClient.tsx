'use client'

import { useState } from 'react'
import { deleteGuest, deleteMultipleGuests } from './actions'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Companion = { id: number, name: string, gender: string, rsvpStatus: string }
type Guest = { id: number, name: string, phone: string | null, gender: string, rsvpStatus: string, uniqueLink: string, companions?: Companion[] }

export default function GuestsTableClient({ guests }: { guests: Guest[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [addingCompanionTo, setAddingCompanionTo] = useState<number | null>(null)
  const [companionIds, setCompanionIds] = useState<number[]>([])
  const [companionSearch, setCompanionSearch] = useState('')

  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('M')

  const filteredGuests = guests.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest)
    setEditName(guest.name)
    setEditPhone(guest.phone || '')
    setEditGender(guest.gender)
  }

  const handleUpdateGuest = async () => {
    if (!editingGuest || !editName) return
    const { updateGuest } = await import('./actions')
    await updateGuest(editingGuest.id, { name: editName, phone: editPhone, gender: editGender })
    setEditingGuest(null)
  }

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
    // Definimos el encabezado del reporte
    const headerData = [
      ["BODA MARITERE & OMAR"],
      ["Reporte Oficial de Invitados"],
      [`Fecha de generación: ${new Date().toLocaleDateString()}`],
      [], // Fila en blanco
      ["Nombre", "Tipo", "Teléfono", "Estatus", "Género"]
    ]

    const dataRows: any[][] = []
    const sortedGuests = [...filteredGuests].sort((a, b) => a.name.localeCompare(b.name))

    sortedGuests.forEach(g => {
      dataRows.push([
        g.name,
        'Titular',
        g.phone || 'N/A',
        g.rsvpStatus === 'PENDING' ? 'Pendiente' : g.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'No Asistirá',
        g.gender === 'M' ? 'Hombre' : 'Mujer'
      ])
      g.companions?.forEach(c => {
        dataRows.push([
          c.name,
          `Acompañante de ${g.name}`,
          'N/A',
          c.rsvpStatus === 'PENDING' ? 'Pendiente' : c.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'No Asistirá',
          c.gender === 'M' ? 'Hombre' : 'Mujer'
        ])
      })
    })

    const finalData = [...headerData, ...dataRows]
    const ws = XLSX.utils.aoa_to_sheet(finalData)

    // Mergear celdas para el título y subtítulo
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // BODA MARITERE & OMAR
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Reporte Oficial...
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Fecha...
    ]

    // Definir anchos de columna
    ws['!cols'] = [
      { wch: 35 }, // Nombre
      { wch: 35 }, // Tipo
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Estatus
      { wch: 12 }, // Género
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Lista Oficial")
    XLSX.writeFile(wb, "Reporte_Boda_M&O.xlsx")
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Título Principal
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(165, 160, 90) // Dorado (#A5A05A)
    doc.text("M & O", 105, 20, { align: "center" })
    
    // Subtítulo
    doc.setFont("helvetica", "normal")
    doc.setFontSize(14)
    doc.setTextColor(44, 44, 44) // Gris oscuro
    doc.text("Reporte Oficial de Invitados", 105, 30, { align: "center" })
    
    // Fecha
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 36, { align: "center" })
    
    const tableColumn = ["Nombre", "Tipo", "Teléfono", "Estatus", "Género"]
    const tableRows: any[][] = []
    
    const sortedGuests = [...filteredGuests].sort((a, b) => a.name.localeCompare(b.name))

    sortedGuests.forEach(g => {
      tableRows.push([
        g.name,
        'Titular',
        g.phone || 'N/A',
        g.rsvpStatus === 'PENDING' ? 'Pendiente' : g.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'No Asistirá',
        g.gender === 'M' ? 'Hombre' : 'Mujer'
      ])
      g.companions?.forEach(c => {
        tableRows.push([
          `  -> ${c.name}`,
          `Acompañante de ${g.name}`,
          'N/A',
          c.rsvpStatus === 'PENDING' ? 'Pendiente' : c.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'No Asistirá',
          c.gender === 'M' ? 'Hombre' : 'Mujer'
        ])
      })
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      headStyles: {
        fillColor: [165, 160, 90], // Dorado
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [250, 249, 242] // Fondo súper tenue dorado
      },
      styles: {
        fontSize: 9,
        cellPadding: 4
      }
    })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const handleAddCompanion = async () => {
    if (!addingCompanionTo || companionIds.length === 0) return
    const { addCompanions } = await import('./actions')
    await addCompanions(addingCompanionTo, companionIds)
    setAddingCompanionTo(null)
    setCompanionIds([])
    setCompanionSearch('')
  }

  const handleRemoveCompanion = async (id: number) => {
    if (confirm('¿Seguro que deseas eliminar a este acompañante?')) {
      const { removeCompanion } = await import('./actions')
      await removeCompanion(id)
    }
  }

  return (
    <>
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
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-black/20 text-slate-400 border-b border-white/10">
            <tr>
              <th scope="col" className="p-4 w-12">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded bg-black/50 border-white/20 text-blue-600 focus:ring-blue-500/50" 
                  onChange={handleSelectAll}
                  checked={filteredGuests.length > 0 && selectedIds.length === filteredGuests.length}
                />
              </th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Titular</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-center">Pases</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Acompañantes</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Enlace WhatsApp</th>
              <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Acciones</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                        <span className="text-lg">{guest.gender === 'F' ? '👩' : '👨'}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-base">{guest.name}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{guest.phone || 'Sin teléfono'}</div>
                        <div className="mt-1">
                          {guest.rsvpStatus === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Pendiente
                            </span>
                          ) : guest.rsvpStatus === 'CONFIRMED' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Confirmado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 text-xs px-2 py-0.5 rounded-full border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Rechazado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                      {1 + (guest.companions?.length || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {guest.companions?.map(comp => (
                        <div key={comp.id} className="flex items-center justify-between bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 text-sm">
                          <span className="flex items-center gap-2">
                            <span>{comp.gender === 'F' ? '👩' : '👨'}</span>
                            <span className="text-slate-200">{comp.name}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${comp.rsvpStatus === 'PENDING' ? 'bg-amber-400' : comp.rsvpStatus === 'CONFIRMED' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <button onClick={() => handleRemoveCompanion(comp.id)} className="text-slate-500 hover:text-rose-400 transition-colors" title="Quitar acompañante">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => setAddingCompanionTo(guest.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 border border-dashed border-blue-500/30 rounded-lg px-2 py-1.5 hover:bg-blue-500/10 transition-colors w-max"
                      >
                        + Añadir acompañante
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {guest.phone && (
                      <a 
                        href={`https://wa.me/${guest.phone}?text=${encodeURIComponent(`¡Hola ${guest.name}! Te comparto tu invitación para la boda: ${window.location.origin}/invite/${guest.uniqueLink}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors border border-green-500/20"
                      >
                        📱 Enviar WP
                      </a>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(guest)}
                        className="text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg transition-all"
                        title="Editar invitado"
                      >
                        ✏️
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal para añadir acompañante (Movido fuera del contenedor con backdrop-blur) */}
    {addingCompanionTo !== null && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-lg w-full relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Vincular Acompañantes</h3>
            <span className={`text-sm px-2 py-1 rounded-md ${companionIds.length >= 15 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {companionIds.length} / 15
            </span>
          </div>
          
          <label className="block text-sm text-slate-400 mb-2">Buscar invitado (lista oficial):</label>
          <input 
            type="text" 
            placeholder="Escribe para buscar..." 
            value={companionSearch}
            onChange={e => setCompanionSearch(e.target.value)}
            className="bg-black/30 border border-white/10 text-white p-3 rounded-xl w-full mb-4 outline-none focus:ring-2 focus:ring-blue-500" 
          />

          <div className="max-h-96 overflow-y-auto mb-6 bg-black/20 rounded-xl border border-white/5 custom-scrollbar">
            {guests
              .filter(g => g.id !== addingCompanionTo && g.name.toLowerCase().includes(companionSearch.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(g => {
                const isSelected = companionIds.includes(g.id)
                return (
                  <div 
                    key={g.id}
                    onClick={() => {
                      if (isSelected) {
                        setCompanionIds(prev => prev.filter(id => id !== g.id))
                      } else {
                        if (companionIds.length < 15) {
                          setCompanionIds(prev => [...prev, g.id])
                        } else {
                          alert('Has alcanzado el límite máximo de 15 acompañantes por titular.')
                        }
                      }
                    }}
                    className={`p-3 cursor-pointer border-b border-white/5 transition-colors flex items-center gap-3 ${isSelected ? 'bg-blue-600/20 border-blue-500/30' : 'hover:bg-white/5'}`}
                  >
                    <span className="text-lg">{g.gender === 'F' ? '👩' : '👨'}</span>
                    <span className="text-sm text-slate-200">{g.name}</span>
                    {isSelected && <span className="ml-auto text-blue-400">✓</span>}
                  </div>
                )
              })}
            {guests.filter(g => g.id !== addingCompanionTo && g.name.toLowerCase().includes(companionSearch.toLowerCase())).length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm italic">No se encontraron invitados.</div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => {
                setAddingCompanionTo(null)
                setCompanionIds([])
                setCompanionSearch('')
              }}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddCompanion}
              disabled={companionIds.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vincular ({companionIds.length})
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal para Editar Invitado Titular */}
    {editingGuest !== null && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
          <h3 className="text-xl font-bold text-white mb-6">Editar Invitado Titular</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-black/30 border border-white/10 text-white p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Teléfono WhatsApp</label>
              <input 
                type="text" 
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="bg-black/30 border border-white/10 text-white p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Género (Icono)</label>
              <select 
                value={editGender}
                onChange={e => setEditGender(e.target.value)}
                className="bg-black/30 border border-white/10 text-white p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-900"
              >
                <option value="M">Hombre 👨</option>
                <option value="F">Mujer 👩</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8">
            <button 
              onClick={() => setEditingGuest(null)}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdateGuest}
              disabled={!editName}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
