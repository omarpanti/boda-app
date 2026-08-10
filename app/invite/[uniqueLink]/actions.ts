'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitRsvp(uniqueLink: string, status: 'CONFIRMED' | 'DECLINED') {
  await prisma.guest.update({
    where: { uniqueLink },
    data: { rsvpStatus: status }
  })
  
  // Revalidar tanto la página pública como el panel de admin
  revalidatePath(`/invite/${uniqueLink}`)
  revalidatePath('/admin/guests')
}
