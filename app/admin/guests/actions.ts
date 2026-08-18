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

export async function updateGuest(id: number, data: { name: string, phone: string, gender: string }) {
  await prisma.guest.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      gender: data.gender
    }
  })
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
    uniqueLink: Math.random().toString(36).substring(2, 10) + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    rsvpStatus: 'PENDING'
  }))
  
  await prisma.guest.createMany({
    data
  })
  
  revalidatePath('/admin/guests')
}

export async function addCompanions(primaryGuestId: number, companionIds: number[]) {
  // En lugar de crear un invitado nuevo, vinculamos múltiples invitados existentes
  await prisma.guest.updateMany({
    where: { id: { in: companionIds } },
    data: {
      primaryGuestId
    }
  })
  revalidatePath('/admin/guests')
}

export async function removeCompanion(id: number) {
  // Desvinculamos al invitado para que vuelva a aparecer en la lista oficial
  await prisma.guest.update({
    where: { id },
    data: { primaryGuestId: null }
  })
  revalidatePath('/admin/guests')
}

