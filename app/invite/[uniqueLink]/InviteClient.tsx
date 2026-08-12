'use client'

import { useState, useEffect } from 'react'
import { submitRsvp } from './actions'

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap');
  
  .font-cursive { font-family: 'Bemdayni', 'Great Vibes', cursive; }
  .font-playfair { font-family: 'Playfair Display', serif; }
  .font-inter { font-family: 'Inter', sans-serif; }
  
  .fade-in-section {
    opacity: 0;
    transform: translateY(30px);
    visibility: hidden;
    transition: opacity 1.2s ease-out, transform 1.2s ease-out;
    will-change: opacity, visibility;
  }
  .fade-in-section.is-visible {
    opacity: 1;
    transform: none;
    visibility: visible;
  }
  
  /* Textura de papel grueso tipo acuarela/algodón */
  .bg-paper {
    background-color: #fcf9f2;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.08 0' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E");
  }

  /* Animaciones del sobre */
  .envelope-wrapper {
    perspective: 1000px;
  }
  .envelope-flap {
    transform-origin: top;
    transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .envelope-flap.open {
    transform: rotateX(180deg);
    z-index: 0;
  }
  .envelope-content {
    transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s ease-in;
  }
  .envelope-content.open {
    transform: translateY(-100vh);
    opacity: 0;
    pointer-events: none;
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
  const [isResponded, setIsResponded] = useState(guest.rsvpStatus !== 'PENDING')
  const [loading, setLoading] = useState(false)
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false)
  const [showInvitation, setShowInvitation] = useState(false)

  const [mountEnvelope, setMountEnvelope] = useState(true)

  // Inyectar librería de confetti
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  // Observador para animaciones de scroll
  useEffect(() => {
    if (!showInvitation) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [showInvitation])

  const triggerConfetti = () => {
    const win = window as any
    if (typeof win.confetti !== 'undefined') {
      const confetti = win.confetti
      const count = 200
      const defaults = { origin: { y: 0.7 }, zIndex: 100 }

      const fire = (particleRatio: number, opts: any) => {
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

  const openEnvelope = () => {
    if (isEnvelopeOpen) return
    setIsEnvelopeOpen(true)
    
    // 1.5s después de abrir el sobre, revelamos la invitación de atrás (fade in)
    setTimeout(() => {
      setShowInvitation(true)
    }, 1500)
    
    // 2.5s después, destruimos el sobre por completo del DOM
    setTimeout(() => {
      setMountEnvelope(false)
    }, 2500)
  }

  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=4A4A4A&bgcolor=FDFBF7&data=" + encodeURIComponent("BODA2026-GUEST-" + guest.uniqueLink)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      
      {/* Contenedor responsivo ajustado para iOS (100dvh) y cualquier pantalla */}
      <div className="min-h-[100dvh] bg-[#2c2c2c] flex justify-center items-start overflow-hidden">
        
        {/* Contenedor central. En celulares es 100% ancho, en PC está limitado para no distorsionar fondos */}
        <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-paper text-[#2C2C2C] font-inter font-light relative overflow-x-hidden shadow-2xl min-h-[100dvh]">
          
          {/* ================= PANTALLA DE SOBRE (OVERLAY) ================= */}
          {mountEnvelope && (
            <div className={`absolute top-0 left-0 w-full h-[100dvh] z-50 flex items-center justify-center bg-[#2c2c2c]/80 backdrop-blur-sm transition-opacity duration-1000 ${showInvitation ? 'opacity-0' : 'opacity-100'}`}>
              
              <div className="relative w-[320px] h-[200px] bg-[#d5d1c8] shadow-2xl rounded-sm cursor-pointer hover:scale-105 transition-transform duration-300" onClick={openEnvelope}>
                
                {/* Carta dentro del sobre */}
                <div 
                  className={`absolute inset-x-2 bottom-2 bg-white rounded-sm shadow-sm flex flex-col items-center justify-center text-center p-4 z-10 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                  style={{
                    transform: isEnvelopeOpen ? 'translateY(-140px)' : 'translateY(0)',
                    height: '180px',
                    opacity: isEnvelopeOpen ? '0' : '1',
                    transitionDelay: isEnvelopeOpen ? '400ms' : '0ms'
                  }}
                >
                  <p className="font-playfair italic text-[#A5A05A] text-xs mb-2">Entregado a:</p>
                  <h1 className="font-cursive text-3xl text-[#2c2c2c]">{guest.name}</h1>
                </div>

                {/* Solapas laterales e inferior (encima de la carta) */}
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[100px] border-b-[100px] border-l-[160px] border-transparent border-l-[#e8e5dc] z-30 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[100px] border-b-[100px] border-r-[160px] border-transparent border-r-[#e8e5dc] z-30 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[160px] border-r-[160px] border-b-[120px] border-transparent border-b-[#f4f2ed] z-30 pointer-events-none"></div>

                {/* Solapa superior (abre) */}
                <div 
                  className="absolute top-0 left-0 w-0 h-0 border-l-[160px] border-r-[160px] border-t-[110px] border-transparent border-t-[#f0eee9] z-40 origin-top transition-transform duration-1000 drop-shadow-md pointer-events-none"
                  style={{ transform: isEnvelopeOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
                ></div>
                
                {/* Sello de cera / Botón */}
                <div 
                  className="absolute top-[110px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 pointer-events-none"
                  style={{ opacity: isEnvelopeOpen ? 0 : 1 }}
                >
                  <div className="w-12 h-12 bg-[#A5A05A] rounded-full shadow-lg flex items-center justify-center border-2 border-[#8f8a48] animate-pulse">
                    <span className="text-white font-cursive text-xl">M&O</span>
                  </div>
                </div>
                
                {/* Indicador de tap */}
                <div 
                  className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white/90 font-inter text-xs tracking-widest uppercase whitespace-nowrap transition-opacity duration-300"
                  style={{ opacity: isEnvelopeOpen ? 0 : 1 }}
                >
                  Toca el sobre para abrir
                </div>

              </div>
            </div>
          )}

          {/* ================= CONTENIDO DE LA INVITACIÓN ================= */}
          <div className={`transition-opacity duration-1000 ${showInvitation ? 'opacity-100' : 'opacity-0'} ${!isEnvelopeOpen ? 'h-[100dvh] overflow-hidden' : ''}`}>
            
            {/* 1. PORTADA */}
            <section className="relative w-full h-[100dvh] md:min-h-[850px] flex flex-col items-center justify-start pt-2 md:pt-4 px-1 md:px-4 text-center overflow-hidden">
              <div 
                className="absolute inset-0 z-0 bg-cover bg-bottom md:bg-center"
                style={{ backgroundImage: 'url("/fotos/Jardin rosa.png")' }}
              >
                {/* Opcional: un ligero oscurecimiento en la parte superior si hace falta, pero el PDF original no lo tiene tan marcado */}
              </div>

              {/* Contenedor limpio sin mix-blend-multiply porque ya usamos la imagen transparente nativa */}
              <div className="relative z-10 fade-in-section is-visible w-full max-w-2xl mx-auto flex flex-col items-center mt-2 md:mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fotos/Logo-novios-transparente.png" alt="M & O" className="w-24 sm:w-28 md:w-36 mb-4 md:mb-6" />
                
                <p className="font-cursive text-[1.25rem] sm:text-[1.35rem] md:text-3xl leading-snug md:leading-relaxed text-[#1a1a1a] px-0 md:px-2 mb-2 md:mb-2 w-full">
                  "Adondequiera que vayas, iré yo, donde quiera que vivas, viviré.<br className="hidden sm:block" />
                  Tu pueblo será mi pueblo, y tu Dios mi Dios."
                </p>
                <p className="font-cursive text-[1.1rem] sm:text-[1.15rem] md:text-2xl text-[#1a1a1a]">Rut 1,16</p>
              </div>
              
              <div className="absolute bottom-10 animate-bounce text-white drop-shadow-md z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              </div>
            </section>

            {/* 2. PADRES Y PADRINOS */}
            <section className="w-full min-h-[100dvh] flex flex-col items-center justify-center py-16 px-4 text-center fade-in-section relative z-10">
              <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
                
                {/* Texto Superior */}
                <div>
                  <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-4xl text-[#1a1a1a] mb-6 md:mb-8 leading-snug" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.2)' }}>
                    Un amor tan grande, merece celebración,<br/>
                    con la bendición de Dios y nuestros padres:
                  </p>
                  
                  {/* Padres */}
                  <div className="flex flex-row justify-center items-center gap-1 sm:gap-2 md:gap-12 font-cursive text-[1rem] sm:text-[1.1rem] md:text-3xl text-transparent whitespace-nowrap" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                    <div className="flex-1 text-right space-y-1 md:space-y-2">
                      <p>Efraín Cauich Basto</p>
                      <p>Teresita Aguilar Ceballos</p>
                    </div>
                    <div className="text-[#1a1a1a] text-xl md:text-4xl px-1 sm:px-2" style={{ WebkitTextStroke: '0px' }}>&</div>
                    <div className="flex-1 text-left space-y-1 md:space-y-2">
                      <p>Jorge H. Panti Catzin <span className="text-[0.6rem] md:text-sm align-super">+</span></p>
                      <p>Guillermina Ix Pech</p>
                    </div>
                  </div>
                </div>

                {/* Padrinos */}
                <div className="pt-4 md:pt-8">
                  <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-4xl text-[#1a1a1a] mb-6 md:mb-8" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.2)' }}>
                    Y nuestros apreciados padrinos:
                  </p>
                  
                  <div className="flex flex-row justify-center items-center gap-1 sm:gap-2 md:gap-12 font-cursive text-[1rem] sm:text-[1.1rem] md:text-3xl text-transparent whitespace-nowrap" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                    <div className="flex-1 text-right space-y-1 md:space-y-2">
                      <p>Luis Manuel Carrillo Pech</p>
                      <p>Luz Maria Aguilar Pech</p>
                    </div>
                    <div className="text-[#1a1a1a] text-xl md:text-4xl px-1 sm:px-2" style={{ WebkitTextStroke: '0px' }}>&</div>
                    <div className="flex-1 text-left space-y-1 md:space-y-2">
                      <p>Joel Ricardo Panti Ix</p>
                      <p>Janet C. Puc Sánchez</p>
                    </div>
                  </div>
                </div>

                {/* Nosotros */}
                <div className="pt-6 md:pt-12 flex flex-col items-center">
                  <p className="font-cursive text-sm md:text-xl text-transparent mb-1 md:mb-2" style={{ WebkitTextStroke: '0.5px #64748b' }}>
                    Nosotros :
                  </p>
                  <h2 className="font-cursive text-[2.5rem] sm:text-5xl md:text-7xl text-[#1a1a1a] flex items-center justify-center gap-3 md:gap-4 w-full" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.3)' }}>
                    Maritere <span className="text-xl md:text-4xl text-transparent" style={{ WebkitTextStroke: '0.5px #64748b', textShadow: 'none' }}>&</span> Omar
                  </h2>
                </div>

                {/* Invitación */}
                <div className="pt-6 md:pt-10">
                  <p className="font-cursive text-xl md:text-4xl text-transparent leading-snug" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                    Queremos invitarlos a celebrar un dia muy especial<br/>
                    para nosotros, nuestra boda.
                  </p>
                </div>

                {/* Fecha */}
                <div className="pt-6 md:pt-12 pb-6 md:pb-10">
                  <p className="font-cursive text-xl md:text-4xl text-[#1a1a1a] font-bold" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.3)' }}>
                    Viernes
                  </p>
                  <p className="font-cursive text-[1.75rem] sm:text-3xl md:text-5xl text-[#1a1a1a] font-bold my-1 md:my-2" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.3)' }}>
                    04 / Diciembre / 2026
                  </p>
                  <p className="font-cursive text-xl md:text-4xl text-[#1a1a1a] font-bold" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.3)' }}>
                    Conkal, Yucatán
                  </p>
                </div>

              </div>
            </section>

            {/* 3. CEREMONIA */}
            <section 
              className="relative w-full min-h-[90dvh] md:min-h-[850px] flex flex-col items-center justify-start pt-10 md:pt-16 px-4 md:px-6 text-center fade-in-section overflow-hidden bg-cover bg-bottom md:bg-center"
              style={{ backgroundImage: 'url("/fotos/Iglesia.png")' }}
            >
              <div className="absolute inset-0 bg-white/20 -z-10"></div>
              
              <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center mt-2 md:mt-4">
                <h2 className="font-cursive text-[3.5rem] md:text-8xl mb-1 text-[#1a1a1a]" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>
                  Ceremonia
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-4 md:mb-6 opacity-80">
                  <div className="w-12 md:w-16 h-[1px] bg-[#1a1a1a]"></div>
                  <svg width="40" height="15" viewBox="0 0 40 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1a1a1a]">
                    <path d="M20 7.5C18 3 13 1 10 1C6 1 2 4 2 7.5C2 11 6 14 10 14C13 14 18 12 20 7.5ZM20 7.5C22 12 27 14 30 14C34 14 38 11 38 7.5C38 4 34 1 30 1C27 1 22 3 20 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="w-12 md:w-16 h-[1px] bg-[#1a1a1a]"></div>
                </div>
                
                <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-5xl mb-0 text-transparent" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                  Parroquia, San Francisco de Asís
                </p>
                <p className="font-cursive text-[1.2rem] sm:text-xl md:text-4xl mb-3 md:mb-4 text-transparent" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                  Conkal, Yucatán.
                </p>
                
                <p className="font-cursive text-[1.3rem] sm:text-2xl md:text-5xl text-transparent mb-1" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                  8:00 pm.
                </p>
                <div className="w-24 md:w-32 h-[1.5px] bg-[#1a1a1a] mb-5 md:mb-8"></div>
                
                <a 
                  href="https://maps.app.goo.gl/i6cS46tYWTkaP5q98" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-[#2c2c2c]/30 px-6 py-2 md:py-3 rounded-full transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="font-inter tracking-widest uppercase text-xs font-medium text-[#2C2C2C]">Cómo Llegar</span>
                </a>
              </div>
            </section>


            {/* 4. RECEPCIÓN */}
            <section 
              className="relative w-full min-h-[90dvh] md:min-h-[850px] flex flex-col items-center justify-start pt-4 md:pt-8 px-4 md:px-6 text-center fade-in-section overflow-hidden bg-cover bg-bottom md:bg-center"
              style={{ backgroundImage: 'url("/fotos/Hacienda.png")' }}
            >
              <div className="absolute inset-0 bg-white/20 -z-10"></div>
              
              <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center mt-0">
                <h2 className="font-cursive text-[3.5rem] md:text-8xl mb-0 md:mb-1 text-[#1a1a1a]" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>
                  Recepción
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-4 md:mb-6 opacity-80">
                  <div className="w-12 md:w-16 h-[1px] bg-[#1a1a1a]"></div>
                  <svg width="40" height="15" viewBox="0 0 40 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1a1a1a]">
                    <path d="M20 7.5C18 3 13 1 10 1C6 1 2 4 2 7.5C2 11 6 14 10 14C13 14 18 12 20 7.5ZM20 7.5C22 12 27 14 30 14C34 14 38 11 38 7.5C38 4 34 1 30 1C27 1 22 3 20 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="w-12 md:w-16 h-[1px] bg-[#1a1a1a]"></div>
                </div>
                
                <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-5xl mb-1 md:mb-2 text-transparent whitespace-nowrap" style={{ WebkitTextStroke: '0.9px #1a1a1a' }}>
                  Hacienda Chaká. Conkal Yucatán.
                </p>
                
                <p className="font-cursive text-[1.3rem] sm:text-2xl md:text-5xl text-transparent mb-1" style={{ WebkitTextStroke: '0.9px #1a1a1a' }}>
                  9:00 pm.
                </p>
                <div className="w-24 md:w-32 h-[1.5px] bg-[#1a1a1a] mb-5 md:mb-8"></div>
                
                <a 
                  href="https://www.google.com/maps/search/Hacienda+Chaká,+Conkal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-[#2c2c2c]/30 px-6 py-2 md:py-3 rounded-full transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="font-inter tracking-widest uppercase text-xs font-medium text-[#2C2C2C]">Cómo Llegar</span>
                </a>
              </div>
            </section>


            {/* 5. DRESS CODE & REGALOS */}
            <section className="py-16 md:py-24 px-4 md:px-6 max-w-5xl mx-auto fade-in-section flex flex-col gap-12 md:gap-24 relative z-10">
              
              {/* Código de vestimenta */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                <div className="text-center md:text-left flex-1 md:pr-12">
                  <h2 className="font-cursive text-[3.5rem] md:text-8xl mb-4 md:mb-8 text-[#1a1a1a]" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>
                    Código de vestimenta
                  </h2>
                  <p className="font-cursive text-[2rem] md:text-6xl mb-2 md:mb-4 text-transparent" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                    Formal
                  </p>
                  <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-4xl leading-snug md:leading-relaxed text-transparent" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                    Les pedimos a nuestros invitados,<br/>
                    evitar el uso del color blanco.
                  </p>
                </div>
                <div className="flex-1 max-w-[220px] md:max-w-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/fotos/Novios.png" alt="Dress Code Novios" className="w-full h-auto mix-blend-multiply" />
                </div>
              </div>

              {/* Mesa de regalos */}
              <div className="flex flex-col items-center">
                <h2 className="font-cursive text-[3.5rem] md:text-8xl mb-8 md:mb-12 text-[#1a1a1a] text-center w-full" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>
                  Mesa de regalos
                </h2>
                
                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12 w-full">
                  <div className="flex-1 max-w-[250px] md:max-w-[350px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={encodeURI('/fotos/Buzón.png')} alt="Buzón de sobres" className="w-full h-auto mix-blend-multiply" />
                  </div>
                  <div className="text-center md:text-right flex-1 md:pl-12">
                    <p className="font-cursive text-[1.4rem] sm:text-2xl md:text-4xl leading-snug md:leading-relaxed text-transparent" style={{ WebkitTextStroke: '0.8px #3a4e5c' }}>
                      Tu presencia en este dia tan importante<br/>
                      es el mejor regalo,<br/>
                      si quieres tener un detalle con nosotros<br/>
                      lo puedes hacer,<br/>
                      el dia de la celebración mediante un buzón de sobres.
                    </p>
                  </div>
                </div>
              </div>

            </section>


            {/* 6. PASE VIRTUAL Y RSVP */}
            <section className="py-24 px-6 text-center fade-in-section bg-white/50 backdrop-blur-md border-t border-black/5">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-cursive text-6xl md:text-7xl text-[#4A4A4A] mb-10">Tu Pase Especial</h2>
                
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-black/5 mx-auto max-w-sm mb-12 transform hover:scale-105 transition-transform duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="Código QR del Invitado" className="w-48 h-48 mx-auto mb-6" />
                  
                  {guest.table ? (
                    <>
                      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Lugar Reservado</p>
                      <p className="font-playfair text-2xl font-semibold text-[#A5A05A]">
                        {guest.table.number ? `Mesa ${guest.table.number} - ` : ''}{guest.table.name}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm italic text-gray-500">Tu asiento será asignado próximamente.</p>
                  )}
                </div>

                {!isResponded ? (
                  <div className="bg-white/80 p-8 md:p-12 rounded-[2rem] shadow-lg border border-black/5">
                    <h3 className="font-cursive text-5xl mb-6">¿Nos acompañas?</h3>
                    <p className="text-sm md:text-base text-gray-500 mb-10">Favor de confirmar tu asistencia antes del 1 de Noviembre.</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                      <button 
                        disabled={loading}
                        onClick={() => handleRSVP('CONFIRMED')}
                        className="flex-1 bg-[#A5A05A] hover:bg-[#8f8a48] text-white font-inter font-medium tracking-widest uppercase py-4 px-6 rounded-2xl transition-all duration-300 shadow-md text-sm"
                      >
                        {loading ? 'Confirmando...' : 'Sí, asistiré'}
                      </button>
                      <button 
                        disabled={loading}
                        onClick={() => handleRSVP('DECLINED')}
                        className="flex-1 bg-transparent border-2 border-[#D9A1D4] hover:bg-[#D9A1D4]/10 text-[#D9A1D4] font-inter font-medium tracking-widest uppercase py-4 px-6 rounded-2xl transition-all duration-300 text-sm"
                      >
                        {loading ? 'Enviando...' : 'No podré ir'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 px-6">
                    <div className="text-6xl mb-6">{guest.rsvpStatus === 'CONFIRMED' ? '🥂' : '🕊️'}</div>
                    <h3 className="font-cursive text-6xl md:text-7xl text-[#A5A05A] mb-4">
                      {guest.rsvpStatus === 'CONFIRMED' ? '¡Qué Alegría!' : 'Te Echaremos de Menos'}
                    </h3>
                    <p className="text-gray-500 font-inter text-xl">
                      {guest.rsvpStatus === 'CONFIRMED'
                        ? 'Hemos guardado tu confirmación. ¡Prepárate para celebrar juntos!'
                        : 'Agradecemos que nos hayas avisado. Te tendremos presente.'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <footer className="py-10 text-center text-gray-400 text-xs font-inter tracking-[0.3em] uppercase bg-white/50">
              Maritere & Omar • 2026
            </footer>
            
          </div>
        </div>
      </div>
    </>
  )
}
