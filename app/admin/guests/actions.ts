'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const clean = phone.replace(/\D/g, '')
  if (!clean) return null
  if (clean.length === 10) return `52${clean}`
  if (clean.length === 11 && clean.startsWith('1')) return `52${clean.substring(1)}`
  return clean
}

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
      phone: normalizePhone(phone),
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

export async function updateGuest(id: number, data: { name: string, phone: string, gender: string, rsvpStatus?: string }) {
  const existing = await prisma.guest.findUnique({ where: { id } })
  const extraData: any = {}
  if (data.rsvpStatus) {
    extraData.rsvpStatus = data.rsvpStatus
    if (data.rsvpStatus === 'SENT' && existing?.rsvpStatus !== 'SENT') {
      extraData.sentAt = new Date()
    } else if (data.rsvpStatus === 'PENDING' || data.rsvpStatus === 'PHYSICAL') {
      extraData.sentAt = null
    }
  }

  await prisma.guest.update({
    where: { id },
    data: {
      name: data.name,
      phone: normalizePhone(data.phone),
      gender: data.gender,
      ...extraData
    }
  })

  // Si el titular se marca como Invitación Física, sincronizar también a sus acompañantes pendientes
  if (data.rsvpStatus === 'PHYSICAL') {
    await prisma.guest.updateMany({
      where: { primaryGuestId: id, rsvpStatus: { in: ['PENDING', 'SENT'] } },
      data: { rsvpStatus: 'PHYSICAL', sentAt: null } as any
    })
  }

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
    phone: normalizePhone(g.phone),
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

export async function normalizeAllExistingPhones() {
  const allGuests = await prisma.guest.findMany({
    where: {
      phone: { not: null }
    }
  })

  let updatedCount = 0
  for (const g of allGuests) {
    if (g.phone) {
      const normalized = normalizePhone(g.phone)
      if (normalized && normalized !== g.phone) {
        await prisma.guest.update({
          where: { id: g.id },
          data: { phone: normalized }
        })
        updatedCount++
      }
    }
  }

  revalidatePath('/admin/guests')
  return { updatedCount }
}

export async function markInvitationSent(guestId: number) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { rsvpStatus: true }
  })

  // Solo actualizar si estaba en PENDING
  if (guest && guest.rsvpStatus === 'PENDING') {
    const now = new Date()
    await prisma.guest.update({
      where: { id: guestId },
      data: { rsvpStatus: 'SENT', sentAt: now } as any
    })
    await prisma.guest.updateMany({
      where: { primaryGuestId: guestId, rsvpStatus: 'PENDING' },
      data: { rsvpStatus: 'SENT', sentAt: now } as any
    })
    revalidatePath('/admin/guests')
  }
}

export async function checkAndExpireInvitations() {
  try {
    // Restaurar automáticamente a estatus 'SENT' cualquier invitación que se haya vencido por el plazo anterior
    const autoExpiredGuests = await prisma.guest.findMany({
      where: {
        primaryGuestId: null,
        rsvpStatus: 'DECLINED',
        message: 'Plazo de confirmación vencido (15 + 5 días)'
      }
    })

    for (const g of autoExpiredGuests) {
      await prisma.guest.update({
        where: { id: g.id },
        data: {
          rsvpStatus: 'SENT',
          message: null
        }
      })

      await prisma.guest.updateMany({
        where: {
          primaryGuestId: g.id,
          rsvpStatus: 'DECLINED'
        },
        data: {
          rsvpStatus: 'SENT'
        }
      })
    }
  } catch (err) {
    console.error('Error restaurando invitaciones:', err)
  }
}

