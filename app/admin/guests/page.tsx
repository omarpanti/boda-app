import { prisma } from '@/lib/prisma'
import { addGuest } from './actions'
import ImportExcelButton from './ImportExcelButton'
import GuestsTableClient from './GuestsTableClient'
export const dynamic = 'force-dynamic'

export default async function GuestsPage() {
  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 relative overflow-hidden">
      {/* Elementos decorativos (Glassmorphism) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto z-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Gestión de Invitados
          </h1>
          <a href="/" className="text-slate-300 font-medium hover:text-white flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/10 transition-all">
            <span>←</span> Volver al Panel
          </a>
        </div>

        {/* Formulario para añadir invitados */}
        <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10 mb-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            Añadir Nuevo Invitado
          </h2>
          <form action={addGuest} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              name="name" 
              placeholder="Nombre del Invitado o Familia" 
              required 
              className="bg-black/20 border border-white/10 text-white p-3 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all" 
            />
            <input 
              type="text" 
              name="phone" 
              placeholder="Teléfono (ej. 555-1234)" 
              className="bg-black/20 border border-white/10 text-white p-3 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all" 
            />
            <select name="gender" className="bg-black/20 border border-white/10 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all md:w-32 [&>option]:bg-slate-900">
              <option value="M">Hombre 👨</option>
              <option value="F">Mujer 👩</option>
            </select>
            <button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-blue-500/25"
            >
              Guardar Invitado
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              ¿Tienes una lista grande? Usa nuestra herramienta de importación.
            </p>
            <div className="[&>form>button]:bg-white/10 [&>form>button]:text-white [&>form>button]:border [&>form>button]:border-white/20 [&>form>button]:px-6 [&>form>button]:py-2 [&>form>button]:rounded-xl [&>form>button]:hover:bg-white/20 [&>form>button]:transition-all">
              <ImportExcelButton />
            </div>
          </div>
        </div>

        {/* Tabla Interactiva de lista de invitados */}
        <GuestsTableClient guests={guests} />
      </div>
    </main>
  )
}
