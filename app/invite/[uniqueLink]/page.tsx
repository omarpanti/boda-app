import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import InviteClient from './InviteClient'
import { checkAndExpireInvitations } from '@/app/admin/guests/actions'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: { uniqueLink: string } }) {
  // Verificar si alguna invitación enviada ya cumplió los 15 + 5 días naturales sin respuesta
  await checkAndExpireInvitations()

  // Buscar al invitado en la base de datos por su link único y traer su mesa si tiene
  const guest = await prisma.guest.findUnique({
    where: { uniqueLink: params.uniqueLink },
    include: { table: true, companions: true }
  })

  // Si el link no existe o es inválido, mostramos un error 404
  if (!guest) {
    notFound()
  }

  return <InviteClient guest={guest} />
}
