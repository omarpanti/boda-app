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
  const trimmedMessage = message.trim()
  if (trimmedMessage) {
    await prisma.guest.update({
      where: { uniqueLink },
      data: { message: trimmedMessage }
    })
  }

  // Enviar notificación a Telegram (sin bloquear si falla)
  try {
    const primaryGuest = await prisma.guest.findUnique({
      where: { uniqueLink },
      select: { id: true, name: true, phone: true }
    })

    const allGuests = await prisma.guest.findMany({
      where: { id: { in: selections.map(s => s.id) } },
      select: { id: true, name: true }
    })

    const confirmedCount = selections.filter(s => s.status === 'CONFIRMED').length
    const declinedCount = selections.filter(s => s.status === 'DECLINED').length

    let text = `💌 <b>¡Nueva respuesta de confirmación!</b>\n\n`
    text += `👤 <b>Titular:</b> ${primaryGuest?.name || 'Invitado'}\n`
    if (primaryGuest?.phone) text += `📱 <b>Tel:</b> ${primaryGuest.phone}\n`
    text += `\n📊 <b>Resumen:</b> ${confirmedCount} Confirmados | ${declinedCount} No asistirán\n\n`
    text += `📋 <b>Detalle del pase:</b>\n`

    for (const sel of selections) {
      const g = allGuests.find(guest => guest.id === sel.id)
      const icon = sel.status === 'CONFIRMED' ? '✅ Asistirá' : '❌ No asistirá'
      text += `• ${g?.name || 'Acompañante'}: <b>${icon}</b>\n`
    }

    if (trimmedMessage) {
      text += `\n💬 <b>Mensaje para los novios:</b>\n<i>"${trimmedMessage}"</i>\n`
    }

    const { sendTelegramNotification } = await import('@/lib/telegram')
    await sendTelegramNotification(text)
  } catch (error) {
    console.error('Error al procesar notificación de Telegram:', error)
  }
  
  // Revalidar tanto la página pública como el panel de admin
  revalidatePath(`/invite/${uniqueLink}`)
  revalidatePath('/admin/guests')
  revalidatePath('/admin/tables') // Por si se liberaron lugares en las mesas
}
