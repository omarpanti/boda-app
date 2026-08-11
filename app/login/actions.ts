'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string
  
  // Por defecto "Boda2026" si no hay variable de entorno
  const correctPassword = process.env.ADMIN_PASSWORD || 'Boda2026'

  if (password === correctPassword) {
    // Establecemos la cookie que el middleware leerá (válida por 30 días)
    cookies().set('admin_auth', 'true', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/'
    })
    
    // Redirigimos al panel
    redirect('/')
  } else {
    // Retornamos un error para mostrarlo en la interfaz
    return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' }
  }
}

export async function logoutAction() {
  cookies().delete('admin_auth')
  redirect('/login')
}
