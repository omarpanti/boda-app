export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">
          Wedding Planner Premium
        </h1>
        <p className="text-xl">
          El panel de control para organizar tu boda de ensueño.
        </p>
      </div>
      
      <div className="grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left mt-16 gap-4">
        <a href="/admin/guests" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className="mb-3 text-2xl font-semibold">Invitados <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span></h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">Gestiona la lista, teléfonos y envía links de invitación.</p>
        </a>
        <a href="/admin/tables" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className="mb-3 text-2xl font-semibold">Mesas <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span></h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">Diseña el plano del salón y asigna los lugares.</p>
        </a>
        <a href="/admin/expenses" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h2 className="mb-3 text-2xl font-semibold">Gastos <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span></h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">Control total del presupuesto y proveedores.</p>
        </a>
      </div>
    </main>
  );
}
