'use client'

import { useState, useEffect } from 'react'
import { submitRsvp } from './actions'

// Estilos inyectados para tipografía, animaciones suaves y confeti
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
  
  .font-playfair { font-family: 'Playfair Display', serif; }
  .font-inter { font-family: 'Inter', sans-serif; }
  
  /* Animación de entrada al hacer scroll */
  .fade-in-section {
    opacity: 0;
    transform: translateY(20px);
    visibility: hidden;
    transition: opacity 1s ease-out, transform 1s ease-out;
    will-change: opacity, visibility;
  }
  .fade-in-section.is-visible {
    opacity: 1;
    transform: none;
    visibility: visible;
  }

  /* Animación flotante para fondo (Hojas/Pétalos) */
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
    50% { transform: translateY(-20px) rotate(10deg); opacity: 1; }
    100% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-float-delayed {
    animation: float 7s ease-in-out infinite;
    animation-delay: 2s;
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

  // Configuración de fecha (04 de Diciembre de 2026, 18:00 hrs)
  const WEDDING_DATE = new Date('2026-12-04T18:00:00').getTime()

  // Inyectar librería de confetti
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

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
    }, { threshold: 0.15 })

    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const triggerConfetti = () => {
    // @ts-ignore
    if (typeof confetti !== 'undefined') {
      const count = 200
      const defaults = { origin: { y: 0.7 }, zIndex: 100 }

      function fire(particleRatio: number, opts: any) {
        // @ts-ignore
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }))
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#D9A1D4', '#A5A05A', '#ffffff'] })
      fire(0.2, { spread: 60, colors: ['#D9A1D4', '#A5A05A', '#ffffff'] })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#D9A1D4', '#A5A05A', '#ffffff'] })
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#D9A1D4', '#A5A05A', '#ffffff'] })
      fire(0.1, { spread: 120, startVelocity: 45, colors: ['#D9A1D4', '#A5A05A', '#ffffff'] })
    }
  }

  const handleRSVP = async (status: 'CONFIRMED' | 'DECLINED') => {
    setLoading(true)
    try {
      await submitRsvp(guest.uniqueLink, status)
      setIsResponded(true)
      guest.rsvpStatus = status
      if (status === 'CONFIRMED') {
        triggerConfetti()
      }
    } finally {
      setLoading(false)
    }
  }

  // URL para el código QR a través de una API pública
  const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(\`BODA2026-GUEST-\${guest.uniqueLink}\`)}&color=A5A05A&bgcolor=FAFAFA\`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div className="min-h-screen bg-[#FAFAFA] text-[#4A4A4A] font-inter font-light selection:bg-[#D9A1D4]/30 relative overflow-hidden">
        
        {/* ================= ELEMENTOS DECORATIVOS (FLORALES / ABSTRACTOS) ================= */}
        <div className="fixed top-[-5%] left-[-10%] w-[400px] h-[400px] bg-[#D9A1D4]/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#A5A05A]/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="fade-in-section is-visible">
            <p className="text-[#A5A05A] text-sm md:text-base font-medium tracking-[0.4em] uppercase mb-8">Nuestra Boda</p>
            <h1 className="text-7xl md:text-9xl font-playfair text-[#4A4A4A] mb-8 leading-tight animate-float">
              Omar <span className="text-[#D9A1D4] italic">&</span><br/>Maritere
            </h1>
            <p className="text-[#A5A05A] text-lg md:text-xl tracking-widest uppercase mb-16">04 • Diciembre • 2026</p>
            
            <div className="bg-white/60 backdrop-blur-md px-10 py-6 rounded-3xl border border-white shadow-xl inline-block">
              <p className="text-xl md:text-2xl text-[#757575] mb-2 font-playfair italic">Querido invitado,</p>
              <p className="text-2xl md:text-3xl font-playfair font-semibold text-[#4A4A4A] tracking-wide">{guest.name}</p>
            </div>
          </div>
          
          {/* Scroll indicador */}
          <div className="absolute bottom-10 animate-bounce text-[#A5A05A]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </section>

        {/* ================= CUENTA REGRESIVA ================= */}
        <section className="py-24 px-6 text-center fade-in-section relative z-10">
          <h2 className="text-3xl md:text-4xl font-playfair text-[#4A4A4A] mb-12 italic">Faltan</h2>
          <div className="flex justify-center gap-3 md:gap-8 max-w-2xl mx-auto">
            {[
              { label: 'DÍAS', value: timeLeft.days },
              { label: 'HRS', value: timeLeft.hours },
              { label: 'MIN', value: timeLeft.minutes },
              { label: 'SEG', value: timeLeft.seconds }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-20 h-24 md:w-28 md:h-32 bg-white/80 backdrop-blur-sm border border-[#A5A05A]/20 rounded-[2rem] flex items-center justify-center text-3xl md:text-5xl font-playfair text-[#A5A05A] shadow-lg mb-4 hover:-translate-y-2 transition-transform duration-500">
                  {item.value.toString().padStart(2, '0')}
                </div>
                <span className="text-xs tracking-[0.3em] text-[#757575] font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ITINERARIO ================= */}
        <section className="py-24 px-6 fade-in-section relative z-10">
          <div className="max-w-xl mx-auto text-center bg-white/60 backdrop-blur-md p-10 rounded-[3rem] border border-white shadow-xl">
            <h2 className="text-4xl font-playfair text-[#4A4A4A] mb-16">Itinerario</h2>
            
            <div className="space-y-16">
              <div className="relative group">
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">⛪</div>
                <h3 className="text-2xl font-playfair text-[#4A4A4A] mb-2">Ceremonia Religiosa</h3>
                <p className="text-[#D9A1D4] font-semibold tracking-widest text-sm mb-3">18:00 HRS</p>
                <p className="text-[#757575] text-sm md:text-base leading-relaxed">Parroquia de San Miguel Arcángel<br/>Centro Histórico</p>
              </div>
              
              <div className="w-px h-16 bg-gradient-to-b from-[#A5A05A]/0 via-[#A5A05A]/30 to-[#A5A05A]/0 mx-auto"></div>
              
              <div className="relative group">
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">🥂</div>
                <h3 className="text-2xl font-playfair text-[#4A4A4A] mb-2">Recepción & Fiesta</h3>
                <p className="text-[#D9A1D4] font-semibold tracking-widest text-sm mb-3">20:00 HRS</p>
                <p className="text-[#757575] text-sm md:text-base leading-relaxed">Hacienda Los Arcángeles<br/>Jardín Principal</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INFORMACIÓN EXTRA (Dress Code / Regalos / Mesa Asignada) ================= */}
        <section className="py-24 px-6 fade-in-section relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Código de Vestimenta */}
            <div className="bg-white/80 border border-white p-10 rounded-[2.5rem] text-center shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="text-4xl mb-6 text-[#A5A05A]">👔</div>
              <h3 className="font-playfair text-2xl text-[#4A4A4A] mb-3">Dress Code</h3>
              <p className="text-[#D9A1D4] font-semibold text-sm tracking-widest mb-4 uppercase">Formal Elegante</p>
              <p className="text-[#757575] text-sm leading-relaxed">Mujeres: Vestido largo o midi<br/>Hombres: Traje oscuro formal</p>
            </div>

            {/* Mesa de Regalos */}
            <div className="bg-white/80 border border-white p-10 rounded-[2.5rem] text-center shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="text-4xl mb-6 text-[#A5A05A]">🎁</div>
              <h3 className="font-playfair text-2xl text-[#4A4A4A] mb-3">Mesa de Regalos</h3>
              <p className="text-[#757575] text-sm mb-6 leading-relaxed">Su presencia es nuestro mejor regalo, pero si desean hacernos un obsequio:</p>
              <div className="space-y-3 text-sm">
                <p className="text-[#4A4A4A] font-medium">Liverpool: <span className="text-[#D9A1D4] font-bold">#87654321</span></p>
                <p className="text-[#A5A05A] italic text-xs">O una aportación en sobre el día de nuestra boda.</p>
              </div>
            </div>

            {/* Asignación de Mesa / Pase QR */}
            <div className="bg-[#A5A05A]/5 border border-[#A5A05A]/20 p-10 rounded-[2.5rem] text-center shadow-lg relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#D9A1D4]/10 rounded-full blur-2xl"></div>
              
              <h3 className="font-playfair text-2xl text-[#4A4A4A] mb-3">Pase Virtual</h3>
              
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                {/* Generación de código QR dinámico usando api.qrserver.com */}
                <img src={qrUrl} alt="Código QR del Invitado" className="w-28 h-28 opacity-90 mx-auto mix-blend-multiply" />
              </div>

              {guest.table ? (
                <>
                  <p className="text-[#757575] text-xs mb-2 uppercase tracking-wider">Tu lugar reservado en</p>
                  <p className="text-[#4A4A4A] font-playfair font-bold text-xl">
                    {guest.table.number ? `Mesa ${guest.table.number} - ` : ''}{guest.table.name}
                  </p>
                </>
              ) : (
                <p className="text-[#757575] text-xs italic px-2">Tu lugar será asignado próximamente.</p>
              )}
            </div>

          </div>
        </section>

        {/* ================= RSVP ================= */}
        <section className="py-32 px-6 text-center fade-in-section relative z-10">
          <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-xl border border-white p-10 md:p-16 rounded-[3rem] shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-playfair text-[#4A4A4A] mb-6">Confirma tu Asistencia</h2>
            
            {!isResponded ? (
              <>
                <p className="text-[#757575] mb-12 text-sm md:text-base leading-relaxed">Agradeceremos confirmar tu asistencia antes del <br/><strong className="text-[#A5A05A] font-semibold">01 de Noviembre de 2026</strong>.</p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <button 
                    disabled={loading}
                    onClick={() => handleRSVP('CONFIRMED')}
                    className="flex-1 bg-gradient-to-r from-[#A5A05A] to-[#928d49] hover:from-[#928d49] hover:to-[#A5A05A] text-white font-medium tracking-widest uppercase py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] shadow-lg shadow-[#A5A05A]/30 text-sm"
                  >
                    {loading ? 'Confirmando...' : 'Sí, asistiré'}
                  </button>
                  <button 
                    disabled={loading}
                    onClick={() => handleRSVP('DECLINED')}
                    className="flex-1 bg-white border-2 border-[#D9A1D4]/30 hover:border-[#D9A1D4] text-[#757575] hover:text-[#D9A1D4] font-medium tracking-widest uppercase py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] text-sm"
                  >
                    {loading ? 'Enviando...' : 'No podré ir'}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 animate-float">
                <div className="text-5xl mb-6">{guest.rsvpStatus === 'CONFIRMED' ? '🥂' : '🕊️'}</div>
                <h3 className="text-3xl font-playfair text-[#A5A05A] mb-4">
                  {guest.rsvpStatus === 'CONFIRMED' ? '¡Qué Alegría!' : 'Te Echaremos de Menos'}
                </h3>
                <p className="text-[#757575] text-lg">
                  {guest.rsvpStatus === 'CONFIRMED'
                    ? 'Hemos guardado tu confirmación. ¡Prepárate para celebrar juntos!'
                    : 'Agradecemos que nos hayas avisado. Te tendremos presente en nuestros corazones.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-[#A5A05A]/60 text-xs font-playfair tracking-[0.3em] uppercase">
          Omar & Maritere • 2026
        </footer>

      </div>
    </>
  )
}
