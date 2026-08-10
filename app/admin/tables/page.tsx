import { prisma } from '@/lib/prisma'
import TablesClient from './TablesClient'

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
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-[1600px] mx-auto">
        <div className="flex justify-end items-center mb-2">
          <a href="/" className="text-blue-600 font-medium hover:underline">← Volver al Panel</a>
        </div>
        
        <div className="lg:pl-[416px]">
          <h1 className="text-3xl font-bold text-gray-800">Plano de Mesas (Interactivo)</h1>
          <p className="text-gray-600 mt-2 mb-6">Arrastra las mesas para diseñar el salón, y arrastra a los invitados desde la lista hacia las mesas para asignarles un lugar.</p>
        </div>
        
        <TablesClient initialTables={tables} initialGuests={guests} initialLayout={layoutElements} />
      </div>
    </main>
  )
}
