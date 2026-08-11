import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rutas que no requieren autenticación
  const isPublicPath = path === '/login' || path.startsWith('/invite')

  // Obtener la cookie de autenticación
  const isAuth = request.cookies.get('admin_auth')?.value === 'true'

  // Si trata de entrar al sistema (/, /admin) y no está logueado, redirigir al login
  if (!isPublicPath && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya está logueado y trata de entrar al login, redirigir al panel principal
  if (path === '/login' && isAuth) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configurar el middleware para que no bloquee archivos estáticos ni imágenes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
