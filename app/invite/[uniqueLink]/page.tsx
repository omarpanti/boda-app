import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import InviteClient from './InviteClient'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: { uniqueLink: string } }) {
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
