'use client'

import { useState } from 'react'
import { deleteGuest, deleteMultipleGuests } from './actions'

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Buscador y Barra de acciones masivas */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
        <input 
          type="text" 
          placeholder="🔍 Buscar invitado por nombre..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-200 text-black p-2 rounded-lg w-full sm:w-72 outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-red-600 font-medium">{selectedIds.length} seleccionados</span>
            <button 
              onClick={handleDeleteSelected} 
              className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Eliminar Seleccionados
            </button>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-4 w-12 text-center">
              <input 
                type="checkbox" 
                onChange={handleSelectAll} 
                checked={guests.length > 0 && selectedIds.length === guests.length} 
                className="w-4 h-4 cursor-pointer accent-blue-600"
              />
            </th>
            <th className="p-4 font-semibold text-gray-600">Nombre</th>
            <th className="p-4 font-semibold text-gray-600">Género</th>
            <th className="p-4 font-semibold text-gray-600">Teléfono</th>
            <th className="p-4 font-semibold text-gray-600">Estado (RSVP)</th>
            <th className="p-4 font-semibold text-gray-600">Link Único de Invitación</th>
            <th className="p-4 font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredGuests.map(guest => (
            <tr key={guest.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-black">
              <td className="p-4 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(guest.id)} 
                  onChange={(e) => handleSelectOne(guest.id, e.target.checked)} 
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                />
              </td>
              <td className="p-4 font-medium flex items-center gap-2">
                {guest.gender === 'M' ? '👨' : '👩'} {guest.name}
              </td>
              <td className="p-4 text-gray-500">{guest.gender === 'M' ? 'Hombre' : 'Mujer'}</td>
              <td className="p-4 text-gray-500">{guest.phone || 'N/A'}</td>
              <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${guest.rsvpStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                  ${guest.rsvpStatus === 'DECLINED' ? 'bg-red-100 text-red-700' : ''}
                  ${guest.rsvpStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}
                `}>
                  {guest.rsvpStatus === 'PENDING' ? 'Pendiente' : guest.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'Rechazado'}
                </span>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-2">
                  <a href={`/invite/${guest.uniqueLink}`} target="_blank" className="text-blue-600 font-medium hover:underline text-sm">
                    Ver invitación ↗
                  </a>
                  {guest.phone && (
                    <button 
                      onClick={() => {
                        const message = `¡Hola ${guest.name}! Nos encantaría contar con tu presencia en nuestra boda.\n\nAquí tienes tu invitación digital personal. Por favor confirma tu asistencia:\n\n${window.location.origin}/invite/${guest.uniqueLink}`;
                        const url = `https://wa.me/${guest.phone}?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                      }}
                      className="text-green-600 font-medium hover:underline text-sm text-left flex items-center gap-1"
                    >
                      <span>💬 Enviar por WhatsApp</span>
                    </button>
                  )}
                  {!guest.phone && <span className="text-xs text-gray-400">Sin teléfono</span>}
                </div>
              </td>
              <td className="p-4">
                <button 
                  onClick={async () => {
                    if (confirm('¿Eliminar a este invitado?')) {
                      await deleteGuest(guest.id)
                    }
                  }}
                  className="text-red-500 font-medium hover:text-red-700 text-sm"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {filteredGuests.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-gray-400">
                {searchTerm ? 'No se encontraron invitados con ese nombre.' : 'Aún no has agregado ningún invitado a tu boda. ¡Añade el primero o importa tu Excel!'}
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
