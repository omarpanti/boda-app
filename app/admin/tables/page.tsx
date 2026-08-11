import { prisma } from '@/lib/prisma'
import TablesClient from './TablesClient'
export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    include: { guests: true },
    orderBy: [{ number: 'asc' }, { createdAt: 'asc' }]
  })
  
  const guests = await prisma.guest.findMany({
    orderBy: { name: 'asc' }
  })

  const layoutElements = await prisma.layoutElement.findMany()

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-[1600px] mx-auto relative z-10">
        <div className="flex justify-end items-center mb-6">
          <a href="/" className="text-slate-300 font-medium hover:text-white flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md hover:bg-white/10 transition-all">
            <span>←</span> Volver al Panel
          </a>
        </div>
        
        <div className="lg:pl-[416px]">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Plano de Mesas Interactivo
          </h1>
          <p className="text-slate-400 mt-3 mb-8 font-light max-w-3xl">
            Arrastra las mesas para diseñar el salón, y arrastra a los invitados desde la lista hacia las mesas para asignarles un lugar exacto.
          </p>
        </div>
        
        <TablesClient initialTables={tables} allGuests={guests} initialLayoutElements={layoutElements} />
      </div>
    </main>
  )
}
