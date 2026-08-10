'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTable(name: string, capacity: number, shape: string, number?: number) {
  await prisma.table.create({
    data: {
      name,
      capacity,
      shape,
      number,
      x_position: 100,
      y_position: 100
    }
  })
  revalidatePath('/admin/tables')
}

export async function updateTablePosition(tableId: number, x: number, y: number) {
  await prisma.table.update({
    where: { id: tableId },
    data: { x_position: x, y_position: y }
  })
  revalidatePath('/admin/tables')
}

export async function updateTableRotation(tableId: number, rotation: number) {
  await prisma.table.update({
    where: { id: tableId },
    data: { rotation }
  })
  revalidatePath('/admin/tables')
}

export async function assignGuestToTable(guestId: number, tableId: number | null) {
  await prisma.guest.update({
    where: { id: guestId },
    data: { tableId }
  })
  revalidatePath('/admin/tables')
  revalidatePath('/admin/guests')
}

export async function deleteTable(tableId: number) {
  // Primero desasignar a los invitados de esta mesa
  await prisma.guest.updateMany({
    where: { tableId },
    data: { tableId: null }
  })
  // Luego borrar la mesa
  await prisma.table.delete({
    where: { id: tableId }
  })
  revalidatePath('/admin/tables')
}

export async function createLayoutElement(type: string, name: string) {
  const isRoom = type === 'ROOM_AREA'
  await prisma.layoutElement.create({
    data: {
      type,
      name,
      width: isRoom ? 1800 : 256,
      height: isRoom ? 1200 : 256,
      x_position: isRoom ? 50 : 200,
      y_position: isRoom ? 50 : 200
    }
  })
  revalidatePath('/admin/tables')
}

export async function updateLayoutElementPosition(id: number, x: number, y: number) {
  await prisma.layoutElement.update({
    where: { id },
    data: { x_position: x, y_position: y }
  })
  revalidatePath('/admin/tables')
}

export async function updateLayoutElementRotation(id: number, rotation: number) {
  await prisma.layoutElement.update({
    where: { id },
    data: { rotation }
  })
  revalidatePath('/admin/tables')
}

export async function updateLayoutElementSize(id: number, width: number, height: number) {
  await prisma.layoutElement.update({
    where: { id },
    data: { width, height }
  })
  revalidatePath('/admin/tables')
}

export async function deleteLayoutElement(id: number) {
  await prisma.layoutElement.delete({ where: { id } })
  revalidatePath('/admin/tables')
}
