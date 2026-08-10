import { prisma } from '@/lib/prisma'
import { addGuest } from './actions'
import ImportExcelButton from './ImportExcelButton'
import GuestsTableClient from './GuestsTableClient'

export default async function GuestsPage() {
  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Invitados</h1>
          <a href="/" className="text-blue-600 font-medium hover:underline">← Volver al Panel</a>
        </div>

        {/* Formulario para añadir invitados */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Añadir Nuevo Invitado</h2>
          <form action={addGuest} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              name="name" 
              placeholder="Nombre del Invitado o Familia" 
              required 
              className="border border-gray-200 text-black p-3 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="text" 
              name="phone" 
              placeholder="Teléfono (ej. 555-1234)" 
              className="border border-gray-200 text-black p-3 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <select name="gender" className="border border-gray-200 text-black p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="M">Hombre 👨</option>
              <option value="F">Mujer 👩</option>
            </select>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Guardar Invitado
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-sm text-gray-500 mb-2 sm:mb-0">
              ¿Tienes una lista grande? Usa nuestra herramienta de importación.
            </p>
            <ImportExcelButton />
          </div>
        </div>

        {/* Tabla Interactiva de lista de invitados */}
        <GuestsTableClient guests={guests} />
      </div>
    </main>
  )
}
