import { logoutAction } from '@/app/login/actions'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-24 relative bg-slate-950 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Botón de Cerrar Sesión */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <form action={logoutAction}>
          <button type="submit" className="text-white/70 hover:text-white font-medium text-sm border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all backdrop-blur-md">
            Cerrar Sesión
          </button>
        </form>
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center mt-12 sm:mt-0">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
          Wedding Planner Premium
        </h1>
        <p className="text-xl text-slate-400 font-light max-w-2xl">
          El panel de control exclusivo para organizar tu boda de ensueño con elegancia y precisión.
        </p>
      </div>
      
      <div className="z-10 grid text-center lg:w-full lg:max-w-5xl lg:grid-cols-3 lg:text-left mt-20 gap-6">
        <a href="/admin/guests" className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-md hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <h2 className="mb-4 text-2xl font-semibold text-white flex items-center gap-2">
            Invitados <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none text-blue-400">-&gt;</span>
          </h2>
          <p className="m-0 text-sm text-slate-400 leading-relaxed">
            Gestiona la lista, números de teléfono y envía los links personales de invitación por WhatsApp.
          </p>
        </a>
        
        <a href="/admin/tables" className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-md hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <h2 className="mb-4 text-2xl font-semibold text-white flex items-center gap-2">
            Mesas <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none text-purple-400">-&gt;</span>
          </h2>
          <p className="m-0 text-sm text-slate-400 leading-relaxed">
            Diseña el plano interactivo del salón, ajusta paredes y asigna los lugares a tus invitados.
          </p>
        </a>
        
        <a href="/admin/expenses" className="group rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-md hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <h2 className="mb-4 text-2xl font-semibold text-white flex items-center gap-2">
            Gastos <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none text-green-400">-&gt;</span>
          </h2>
          <p className="m-0 text-sm text-slate-400 leading-relaxed">
            Lleva el control exacto de tus finanzas, anticipos, pagos pendientes y presupuesto total.
          </p>
        </a>
      </div>
    </main>
  )
}
