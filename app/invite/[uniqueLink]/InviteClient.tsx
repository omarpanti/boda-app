'use client'

import { useState, useEffect } from 'react'
import { submitRsvp } from './actions'

// Estilos inyectados para importar Playfair Display
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
  
  .font-playfair { font-family: 'Playfair Display', serif; }
  .font-inter { font-family: 'Inter', sans-serif; }
  
  /* Animación de entrada al hacer scroll */
  .fade-in-section {
    opacity: 0;
    transform: translateY(20px);
    visibility: hidden;
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    will-change: opacity, visibility;
  }
  .fade-in-section.is-visible {
    opacity: 1;
    transform: none;
    visibility: visible;
  }
`

type GuestWithTable = {
  id: number
  name: string
  rsvpStatus: string
  uniqueLink: string
  table?: { name: string, number: number | null } | null
}

export default function InviteClient({ guest }: { guest: GuestWithTable }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isResponded, setIsResponded] = useState(guest.rsvpStatus !== 'PENDING')
  const [loading, setLoading] = useState(false)

  // Configuración de fecha (04 de Diciembre de 2026, 18:00 hrs) para que el reloj cuente correctamente
  const WEDDING_DATE = new Date('2026-12-04T18:00:00').getTime()

  // Cuenta Regresiva
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = WEDDING_DATE - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Animaciones de Scroll (Fade In)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleRSVP = async (status: 'CONFIRMED' | 'DECLINED') => {
    setLoading(true)
    try {
      await submitRsvp(guest.uniqueLink, status)
      setIsResponded(true)
      guest.rsvpStatus = status
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 font-inter font-light selection:bg-amber-600/30">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Luces decorativas */}
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="fade-in-section is-visible z-10">
            <p className="text-amber-500 text-sm font-medium tracking-[0.4em] uppercase mb-6">Nuestra Boda</p>
            <h1 className="text-7xl md:text-8xl font-playfair text-white mb-6 leading-tight drop-shadow-2xl">
              Omar <span className="text-amber-500/80 italic">&</span><br/>Maritere
            </h1>
            <p className="text-neutral-400 text-lg md:text-xl tracking-widest uppercase mb-12">04 • Diciembre • 2025</p>
            
            <p className="text-xl md:text-2xl text-neutral-300 mb-2 font-playfair italic">Querido/a</p>
            <p className="text-3xl font-bold text-white tracking-wide">{guest.name}</p>
          </div>
          
          {/* Scroll indicador */}
          <div className="absolute bottom-10 animate-bounce text-amber-500/50">
            ↓
          </div>
        </section>


        {/* ================= CUENTA REGRESIVA ================= */}
        <section className="py-24 px-6 text-center fade-in-section relative z-10 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
          <h2 className="text-2xl font-playfair text-white mb-10 italic">Faltan</h2>
          <div className="flex justify-center gap-4 md:gap-8 max-w-2xl mx-auto">
            {[
              { label: 'DÍAS', value: timeLeft.days },
              { label: 'HRS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEG', value: timeLeft.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl flex items-center justify-center text-2xl md:text-4xl font-playfair text-amber-400 shadow-[0_4px_30px_rgba(0,0,0,0.5)] mb-3">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <span className="text-[10px] md:text-xs tracking-[0.2em] text-neutral-500">{item.label}</span>
              </div>
            ))}
          </div>
        </section>


        {/* ================= ITINERARIO ================= */}
        <section className="py-24 px-6 fade-in-section bg-[#111] relative border-t border-b border-white/5">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-playfair text-white mb-12">Cuándo & Dónde</h2>
            
            <div className="space-y-12">
              <div className="relative">
                <div className="text-3xl mb-4">⛪</div>
                <h3 className="text-xl font-semibold text-white mb-1">Ceremonia Religiosa</h3>
                <p className="text-amber-500 font-medium tracking-widest text-sm mb-2">18:00 HRS</p>
                <p className="text-neutral-400 text-sm">Parroquia de San Miguel Arcángel<br/>Centro Histórico</p>
              </div>
              
              <div className="w-px h-12 bg-gradient-to-b from-amber-500/0 via-amber-500/50 to-amber-500/0 mx-auto"></div>
              
              <div className="relative">
                <div className="text-3xl mb-4">🥂</div>
                <h3 className="text-xl font-semibold text-white mb-1">Recepción & Fiesta</h3>
                <p className="text-amber-500 font-medium tracking-widest text-sm mb-2">20:00 HRS</p>
                <p className="text-neutral-400 text-sm">Hacienda Los Arcángeles<br/>Jardín Principal</p>
              </div>
            </div>
          </div>
        </section>


        {/* ================= INFORMACIÓN EXTRA (Dress Code / Regalos / Mesa Asignada) ================= */}
        <section className="py-24 px-6 fade-in-section bg-gradient-to-b from-[#111] to-[#0a0a0a]">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Código de Vestimenta */}
            <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-3xl text-center backdrop-blur-md hover:border-amber-500/20 transition-colors">
              <div className="text-3xl mb-4">👔</div>
              <h3 className="font-playfair text-xl text-white mb-3">Dress Code</h3>
              <p className="text-amber-500 font-medium text-sm tracking-widest mb-2 uppercase">Rigurosa Etiqueta</p>
              <p className="text-neutral-500 text-xs leading-relaxed">Mujeres: Vestido largo de noche<br/>Hombres: Smoking o traje oscuro formal</p>
            </div>

            {/* Mesa de Regalos */}
            <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-3xl text-center backdrop-blur-md hover:border-amber-500/20 transition-colors">
              <div className="text-3xl mb-4">🎁</div>
              <h3 className="font-playfair text-xl text-white mb-3">Mesa de Regalos</h3>
              <p className="text-neutral-400 text-sm mb-4 leading-relaxed">Tu presencia es nuestro mejor regalo, pero si deseas hacernos un presente:</p>
              <div className="space-y-2 text-xs">
                <p className="text-amber-500">Liverpool: <strong>#12345678</strong></p>
                <p className="text-neutral-500 italic">O una aportación en sobre el día del evento.</p>
              </div>
            </div>

            {/* Asignación de Mesa (Si existe) */}
            {guest.table ? (
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-600/10 border border-amber-500/30 p-8 rounded-3xl text-center backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 rounded-full blur-xl"></div>
                <div className="text-3xl mb-4 text-amber-400">✨</div>
                <h3 className="font-playfair text-xl text-white mb-3">Tu Lugar</h3>
                <p className="text-neutral-400 text-sm mb-3">Hemos reservado tu lugar especial en:</p>
                <p className="text-amber-400 font-bold text-lg tracking-widest uppercase">
                  {guest.table.number ? `Mesa ${guest.table.number} - ` : ''}{guest.table.name}
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-3xl text-center backdrop-blur-md flex flex-col items-center justify-center">
                <div className="text-3xl mb-4 opacity-50">🍽️</div>
                <p className="text-neutral-500 text-sm">Tu lugar en la recepción será asignado próximamente.</p>
              </div>
            )}

          </div>
        </section>


        {/* ================= RSVP ================= */}
        <section className="py-32 px-6 text-center fade-in-section relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-xl mx-auto bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-playfair text-white mb-4">R.S.V.P.</h2>
            
            {!isResponded ? (
              <>
                <p className="text-neutral-400 mb-10 text-sm md:text-base">Por favor, indícanos si podremos contar con tu invaluable presencia antes del <strong>01 de Noviembre</strong>.</p>
                
                <div className="flex flex-col gap-4">
                  <button 
                    disabled={loading}
                    onClick={() => handleRSVP('CONFIRMED')}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium tracking-widest uppercase py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(217,119,6,0.2)]"
                  >
                    {loading ? 'Confirmando...' : 'Sí, asistiré con gusto'}
                  </button>
                  <button 
                    disabled={loading}
                    onClick={() => handleRSVP('DECLINED')}
                    className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-neutral-300 font-medium tracking-widest uppercase py-4 px-6 rounded-xl transition-all duration-300"
                  >
                    {loading ? 'Enviando...' : 'Tristemente no podré ir'}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <h3 className="text-2xl font-playfair text-amber-400 mb-4">
                  {guest.rsvpStatus === 'CONFIRMED' ? '¡Qué Alegría!' : 'Te Echaremos de Menos'}
                </h3>
                <p className="text-neutral-300">
                  {guest.rsvpStatus === 'CONFIRMED'
                    ? 'Hemos guardado tu confirmación. Estamos ansiosos por celebrar juntos.'
                    : 'Agradecemos que nos hayas avisado. Te tendremos presente en nuestros corazones.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center border-t border-white/5 text-neutral-600 text-xs font-playfair tracking-widest">
          O & M • 2025
        </footer>

      </div>
    </>
  )
}
