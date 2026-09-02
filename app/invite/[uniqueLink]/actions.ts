'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitGroupRsvp(uniqueLink: string, selections: { id: number, status: 'CONFIRMED' | 'DECLINED' }[], message: string = '') {
  // Procesar cada selección individualmente
  for (const sel of selections) {
    await prisma.guest.update({
      where: { id: sel.id },
      data: { 
        rsvpStatus: sel.status,
        // Si rechaza, le quitamos la asignación de la mesa automáticamente
        ...(sel.status === 'DECLINED' ? { tableId: null } : {})
      }
    })
  }

  // Guardar el mensaje del invitado principal si escribió algo
  if (message.trim()) {
    await prisma.guest.update({
      where: { uniqueLink },
      data: { message: message.trim() }
    })
  }
  
  // Revalidar tanto la página pública como el panel de admin
  revalidatePath(`/invite/${uniqueLink}`)
  revalidatePath('/admin/guests')
  revalidatePath('/admin/tables') // Por si se liberaron lugares en las mesas
}
