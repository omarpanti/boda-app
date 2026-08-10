'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addGuest(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const gender = formData.get('gender') as string
  
  if (!name) return
  
  // Generamos un identificador corto y único para la invitación web de esta persona
  const uniqueLink = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  
  await prisma.guest.create({
    data: {
      name,
      phone,
      gender,
      uniqueLink,
      rsvpStatus: 'PENDING'
    }
  })
  
  // Refresca la página para mostrar el nuevo invitado
  revalidatePath('/admin/guests')
}

export async function deleteGuest(id: number) {
  await prisma.guest.delete({ where: { id } })
  revalidatePath('/admin/guests')
}

export async function deleteMultipleGuests(ids: number[]) {
  await prisma.guest.deleteMany({
    where: { id: { in: ids } }
  })
  // Si borran todos, también limpiamos las mesas para evitar huérfanos, Prisma cascade no está configurado,
  // pero deleteMany los borra directo
  revalidatePath('/admin/guests')
  revalidatePath('/admin/tables') // Refrescamos mesas por si borraron a alguien asignado
}

export async function bulkAddGuests(guests: {name: string, gender: string, phone: string}[]) {
  const data = guests.map(g => ({
    name: g.name,
    gender: g.gender,
    phone: g.phone || null,
    // Generamos un link único para cada uno
    uniqueLink: Math.random().toString(36).substring(2, 10) + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    rsvpStatus: 'PENDING'
  }))
  
  await prisma.guest.createMany({
    data
  })
  
  revalidatePath('/admin/guests')
}
