'use client'

import { useState, useEffect, useRef } from 'react'
import { submitGroupRsvp } from './actions'

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

type Companion = { id: number, name: string, gender: string, rsvpStatus: string }
type GuestWithTable = {
  id: number
  name: string
  rsvpStatus: string
  uniqueLink: string
  message?: string | null
  sentAt?: Date | string | null
  updatedAt?: Date | string
  table?: { name: string, number: number | null } | null
  companions?: Companion[]
}

const FloatingPetals = () => {
  // Generar 20 pétalos con posiciones y retrasos aleatorios
  const petals = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 10 + Math.random() * 10, // Entre 10s y 20s
    animationDelay: Math.random() * 8,
    opacity: 0.3 + Math.random() * 0.5,
    scale: 0.4 + Math.random() * 0.6,
    isWhite: Math.random() > 0.5
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {petals.map(petal => (
        <div
          key={petal.id}
          className="absolute top-[-10%]"
          style={{
            left: `${petal.left}%`,
            opacity: petal.opacity,
            animation: `fallAndDrift ${petal.animationDuration}s linear ${petal.animationDelay}s infinite`
          }}
        >
          <div style={{ transform: `scale(${petal.scale})` }}>
            <svg width="14" height="20" viewBox="0 0 14 20" fill={petal.isWhite ? "#ffffff" : "#f1c3d3"} xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              <path d="M7 0C7 0 0 4 0 10C0 16 7 20 7 20C7 20 14 16 14 10C14 4 7 0 7 0Z" />
            </svg>
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fallAndDrift {
          0% {
            transform: translate3d(0, -50px, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(-150px, 120%, 0) rotate(360deg);
          }
        }
      `}} />
    </div>
  )
}

export default function InviteClient({ guest }: { guest: GuestWithTable }) {
  const isPendingOrSent = guest.rsvpStatus === 'PENDING' || guest.rsvpStatus === 'SENT' || guest.rsvpStatus === 'PHYSICAL'
  const [isResponded, setIsResponded] = useState(!isPendingOrSent)
  const [loading, setLoading] = useState(false)
  
  // Estado para las selecciones del grupo basado en la BD, por defecto CONFIRMED si están pendientes o solo enviadas
  const hasCompanions = Boolean(guest.companions && guest.companions.length > 0)
  const [selections, setSelections] = useState<{id: number, status: 'CONFIRMED' | 'DECLINED'}[]>([
    { id: guest.id, status: ((guest.rsvpStatus === 'PENDING' || guest.rsvpStatus === 'SENT' || guest.rsvpStatus === 'PHYSICAL') ? (hasCompanions ? 'DECLINED' : 'CONFIRMED') : guest.rsvpStatus) as 'CONFIRMED' | 'DECLINED' },
    ...(guest.companions?.map(c => ({ id: c.id, status: ((c.rsvpStatus === 'PENDING' || c.rsvpStatus === 'SENT' || c.rsvpStatus === 'PHYSICAL') ? 'DECLINED' : c.rsvpStatus) as 'CONFIRMED' | 'DECLINED' })) || [])
  ])
  const [guestMessage, setGuestMessage] = useState(guest.message || '')
  const [selectionError, setSelectionError] = useState(false)

  const toggleSelection = (id: number) => {
    setSelectionError(false)
    setSelections(prev => prev.map(sel => sel.id === id ? { ...sel, status: sel.status === 'CONFIRMED' ? 'DECLINED' : 'CONFIRMED' } : sel))
  }
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false)
  const [showInvitation, setShowInvitation] = useState(false)
  const [showRSVPModal, setShowRSVPModal] = useState(false)
  const [rsvpMode, setRsvpMode] = useState<'ATTEND' | 'DECLINE'>('ATTEND')

  const [mountEnvelope, setMountEnvelope] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rawBufferRef = useRef<ArrayBuffer | null>(null)
  const decodedBufferRef = useRef<AudioBuffer | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const usingWebAudioRef = useRef(false)
  const envelopeOpenedRef = useRef(false)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)

  // Descargar los bytes del audio en segundo plano (sin crear AudioContext aún para que iOS Safari no lo bloquee)
  useEffect(() => {
    fetch('/musica.m4a')
      .then(r => (r.ok ? r.arrayBuffer() : fetch('/musica.mp3').then(r2 => r2.arrayBuffer())))
      .then(buf => {
        rawBufferRef.current = buf
      })
      .catch(() => {})
  }, [])

  const playViaWebAudio = (ctx: AudioContext) => {
    const startSource = (buffer: AudioBuffer) => {
      try {
        if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop() } catch {}
        }
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(ctx.destination)
        source.start(0)
        sourceNodeRef.current = source
        usingWebAudioRef.current = true
        setIsPlayingMusic(true)
      } catch {
        setIsPlayingMusic(false)
      }
    }

    if (decodedBufferRef.current) {
      startSource(decodedBufferRef.current)
      return
    }

    const decodeAndPlay = (buf: ArrayBuffer) => {
      ctx.decodeAudioData(
        buf.slice(0),
        decoded => {
          decodedBufferRef.current = decoded
          startSource(decoded)
        },
        () => setIsPlayingMusic(false)
      )
    }

    if (rawBufferRef.current) {
      decodeAndPlay(rawBufferRef.current)
    } else {
      fetch('/musica.m4a')
        .then(r => (r.ok ? r.arrayBuffer() : fetch('/musica.mp3').then(r2 => r2.arrayBuffer())))
        .then(buf => {
          rawBufferRef.current = buf
          decodeAndPlay(buf)
        })
        .catch(() => setIsPlayingMusic(false))
    }
  }

  const triggerPlayMusic = () => {
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).audioSession) {
        ;(navigator as any).audioSession.type = 'playback'
      }
    } catch {}

    // Crear/desbloquear AudioContext DENTRO del clic del botón nativo (respaldo infalible para iOS Safari)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    } catch {}

    if (usingWebAudioRef.current && audioCtxRef.current) {
      audioCtxRef.current.resume().then(() => setIsPlayingMusic(true)).catch(() => {})
      return
    }

    try {
      const audio = audioRef.current || new Audio('/musica.m4a')
      audio.loop = true
      audio.preload = 'auto'
      audio.muted = false
      audioRef.current = audio

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingMusic(true))
          .catch(() => {
            // Intento 2: probar con .mp3
            audio.src = '/musica.mp3'
            audio
              .play()
              .then(() => setIsPlayingMusic(true))
              .catch(() => {
                // Intento 3: si Safari arroja "The operation is not supported", reproducir con Web Audio API
                if (audioCtxRef.current) {
                  playViaWebAudio(audioCtxRef.current)
                }
              })
          })
      }
    } catch {
      if (audioCtxRef.current) {
        playViaWebAudio(audioCtxRef.current)
      }
    }
  }

  const handleOpen = (withMusic: boolean) => {
    if (envelopeOpenedRef.current) return
    envelopeOpenedRef.current = true

    if (withMusic) {
      triggerPlayMusic()
    }

    openEnvelope()
  }

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlayingMusic) {
      if (usingWebAudioRef.current && audioCtxRef.current) {
        audioCtxRef.current.suspend().then(() => setIsPlayingMusic(false)).catch(() => {})
      } else if (audioRef.current) {
        audioRef.current.pause()
        setIsPlayingMusic(false)
      }
    } else {
      triggerPlayMusic()
    }
  }
  
  // Estado para el efecto 3D dinámico
  const [tilt, setTilt] = useState({ x: 0, y: 0 })  // Soporte para giroscopio (móviles) y ratón (PC) global para efectos 3D
  
  // Efecto de máquina de escribir para el nombre en la carta
  const formatName = (name: string) => {
    return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  
  const cardName = (!guest.companions || guest.companions.length === 0) 
    ? formatName(guest.name) 
    : `${formatName(guest.name)} y Familia`;

  // Efecto de escritura en el exterior eliminado, cardName se usa en el interior

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: rotación izq/der (-90 a 90)
        // beta: inclinación adelante/atrás (-180 a 180)
        // Restringimos ángulos para que no se voltee exageradamente
        const clampedGamma = Math.max(-45, Math.min(45, e.gamma))
        const clampedBeta = Math.max(-45, Math.min(45, e.beta - 45)) // Offset de 45deg (ángulo normal al sostener el móvil)
        
        // Suavizamos el efecto dividiendo entre 2.5
        setTilt({ x: -(clampedBeta / 2.5), y: clampedGamma / 2.5 })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      // Rotación y movimiento sutil basado en la posición del cursor (máximo ~15 grados)
      const x = ((e.clientY - innerHeight / 2) / innerHeight) * -15
      const y = ((e.clientX - innerWidth / 2) / innerWidth) * 15
      setTilt({ x, y })
    }
    
    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation, true)
      window.addEventListener('mousemove', handleMouseMove, true)
      window.addEventListener('mouseout', handleMouseLeave, true)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true)
        window.removeEventListener('mousemove', handleMouseMove, true)
        window.removeEventListener('mouseout', handleMouseLeave, true)
      }
    }
  }, [])

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

  const handleRSVP = async () => {
    if (rsvpMode === 'ATTEND' && hasCompanions && !selections.some(s => s.status === 'CONFIRMED')) {
      setSelectionError(true)
      return
    }
    setSelectionError(false)
    setLoading(true)
    try {
      await submitGroupRsvp(guest.uniqueLink, selections, guestMessage)
      setIsResponded(true)
      
      // Si al menos un integrante confirmó asistencia, disparamos confeti
      const anyConfirmed = selections.some(s => s.status === 'CONFIRMED')
      if (anyConfirmed) {
        triggerConfetti()
      }
    } catch (error) {
      console.error(error)
      alert("Hubo un error al confirmar. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const openEnvelope = () => {
    setIsEnvelopeOpen(true)
    
    // Polvo de hadas / Partículas doradas al abrir
    const win = window as any
    if (typeof win.confetti !== 'undefined') {
      const confetti = win.confetti
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#D9A1D4', '#A5A05A', '#FFD700', '#ffffff'],
        ticks: 200,
        gravity: 0.5,
        scalar: 0.8,
        shapes: ['circle'],
        zIndex: 9999
      });
    }
    
    // 1.2s después de abrir el sobre, revelamos la invitación de atrás (fade in)
    setTimeout(() => {
      setShowInvitation(true)
    }, 1200)
    
    // 2.5s después, destruimos el sobre por completo del DOM
    setTimeout(() => {
      setMountEnvelope(false)
    }, 2500)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />

      {/* Botón flotante de música una vez abierto el sobre */}
      {isEnvelopeOpen && (
        <button
          onClick={toggleMusic}
          title={isPlayingMusic ? 'Pausar música' : 'Reproducir música'}
          className="fixed top-4 right-4 z-40 h-10 px-3.5 rounded-full bg-[#fcf9f2]/90 backdrop-blur-md border border-[#744570]/35 shadow-[0_4px_15px_rgba(77,38,73,0.25)] flex items-center justify-center gap-2 text-[#4d2649] hover:scale-105 active:scale-95 transition-all"
        >
          {isPlayingMusic ? (
            <span className="flex items-end gap-[2px] h-3.5 px-0.5">
              <span className="w-[2.5px] bg-[#744570] rounded-full animate-[bounce_0.8s_infinite] h-3.5"></span>
              <span className="w-[2.5px] bg-[#A5A05A] rounded-full animate-[bounce_1.1s_infinite] h-2.5"></span>
              <span className="w-[2.5px] bg-[#744570] rounded-full animate-[bounce_0.9s_infinite] h-3"></span>
            </span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-[11px] font-inter font-medium tracking-wide">Música</span>
            </>
          )}
        </button>
      )}
      
      {/* Contenedor responsivo ajustado para iOS (100dvh) y cualquier pantalla */}
      <div className="min-h-[100dvh] bg-[#2c2c2c] flex justify-center items-start">
        
        {/* Contenedor central. En celulares es 100% ancho, en PC está limitado para no distorsionar fondos */}
        <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-paper text-[#2C2C2C] font-inter font-light relative overflow-x-hidden shadow-2xl min-h-[100dvh]">
          
          {/* ================= PANTALLA DE SOBRE (OVERLAY) ================= */}
          {mountEnvelope && (
            <div 
              className={`fixed top-0 left-0 w-full h-[100dvh] z-50 flex items-center justify-center bg-[url('/fotos/1.png')] bg-cover bg-center transition-opacity duration-1000 ${showInvitation ? 'opacity-0' : 'opacity-100'}`}
              style={{ perspective: '1200px' }}
            >
              {/* Filtro luminoso y cálido para el fondo, con menos opacidad para que deje ver la imagen de las flores */}
              <div className="absolute inset-0 bg-[#fdfbf7]/50 backdrop-blur-md"></div>
              
              {/* Agregamos los pétalos cayendo para darle vida y magia desde el inicio */}
              <FloatingPetals />
              
              <div 
                className="relative w-[340px] h-[210px] bg-[#e6d8c4] rounded-lg cursor-pointer hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] z-10" 
                onClick={() => handleOpen(true)}
                style={{
                  transform: isEnvelopeOpen 
                    ? 'translateY(150px) scale(0.85) rotateX(20deg)' 
                    : `translateY(0) scale(1) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transformStyle: 'preserve-3d',
                  boxShadow: isEnvelopeOpen 
                    ? '0 15px 35px rgba(0,0,0,0.2)' 
                    : `${-tilt.y * 2}px ${25 + tilt.x * 2}px 50px rgba(138,99,18,0.25)`, // Sombra cálida
                  transition: tilt.x === 0 && tilt.y === 0 ? 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
                }}
              >
                
                {/* Carta dentro del sobre (Se extrae hacia arriba) */}
                <div 
                  className={`absolute inset-x-2 bottom-2 bg-paper rounded-md shadow-lg flex flex-col items-center justify-center text-center p-4 z-10 transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
                  style={{
                    transform: isEnvelopeOpen ? 'translateY(-220px) scale(1.2)' : 'translateY(0) scale(1)',
                    height: '190px',
                    opacity: 1, // Siempre visible hasta que se desmonta
                  }}
                >
                  {/* Marco interno dorado sutil para la carta */}
                  <div className="absolute inset-2 border-[1.5px] border-[#d4af37]/40 rounded-sm pointer-events-none"></div>
                  
                  {/* Se eliminó el nombre por solicitud */}
                </div>

                {/* Solapas laterales e inferior con colores hueso cálidos y sombras suaves */}
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[105px] border-b-[105px] border-l-[170px] border-transparent border-l-[#f6efe4] z-30 pointer-events-none drop-shadow-[2px_0_3px_rgba(0,0,0,0.06)] rounded-l-lg"></div>
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[105px] border-b-[105px] border-r-[170px] border-transparent border-r-[#f6efe4] z-30 pointer-events-none drop-shadow-[-2px_0_3px_rgba(0,0,0,0.06)] rounded-r-lg"></div>
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[170px] border-r-[170px] border-b-[125px] border-transparent border-b-[#fcf9f2] z-30 pointer-events-none drop-shadow-[0_-2px_4px_rgba(0,0,0,0.08)] rounded-b-lg"></div>

                {/* Solapa superior (abre) */}
                <div 
                  className="absolute top-0 left-0 w-0 h-0 border-l-[170px] border-r-[170px] border-t-[115px] border-transparent border-t-[#fffdfa] z-40 origin-top transition-transform duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)] rounded-t-lg"
                  style={{ transform: isEnvelopeOpen ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
                ></div>
                
                {/* Sello de cera realista / Botón */}
                <div 
                  className="absolute top-[115px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 pointer-events-none"
                  style={{ 
                    opacity: isEnvelopeOpen ? 0 : 1,
                    transform: isEnvelopeOpen ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%) scale(1)'
                  }}
                >
                  <div className="w-[85px] h-[85px] bg-gradient-to-br from-[#744570] via-[#4d2649] to-[#361533] rounded-full shadow-[0_4px_10px_rgba(77,38,73,0.6)] flex items-center justify-center border-[2px] border-[#946190]/40 animate-[pulse_3s_ease-in-out_infinite] relative backdrop-blur-sm">
                    {/* Brillo realista del lacre */}
                    <div className="absolute inset-0 bg-white/10 blur-[1px] rounded-full mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute inset-[4px] border border-[#a16799]/20 rounded-full pointer-events-none"></div>
                    {/* Texto del sello con corazón SVG integrado */}
                    <span className="text-[#f3d99e] font-cursive text-[1.45rem] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] z-10 flex items-center justify-center gap-1.5 mt-0.5">
                      <span className="leading-none">M</span>
                      <svg className="w-[12px] h-[12px] fill-current translate-y-[2px]" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="leading-none">O</span>
                    </span>
                  </div>
                </div>
                
                {/* Nombre del invitado en el frente eliminado por solicitud */}
                
                {/* Botones directos estilo Bodas.net (100% permisos de audio nativo en iOS Safari y Android) */}
                <div 
                  className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2.5 transition-opacity duration-300 w-full max-w-[280px] z-50 pointer-events-auto"
                  style={{ opacity: isEnvelopeOpen ? 0 : 1 }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpen(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-[#744570] via-[#5a2c56] to-[#4d2649] text-white shadow-[0_8px_20px_rgba(77,38,73,0.35)] hover:scale-105 active:scale-95 transition-all text-xs font-semibold tracking-widest uppercase border border-[#d9a1d4]/30"
                  >
                    <span>✉️ Abrir con Música 🎵</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpen(false)
                    }}
                    className="text-[11px] text-[#4d2649]/80 hover:text-[#4d2649] font-medium tracking-wide underline underline-offset-4 transition-colors py-1"
                  >
                    Abrir sin música
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ================= CONTENIDO DE LA INVITACIÓN ================= */}
          <div className={`transition-opacity duration-1000 ${showInvitation ? 'opacity-100' : 'opacity-0'} ${!isEnvelopeOpen ? 'h-[100dvh] overflow-hidden' : ''}`}>
            
            {/* 1. PORTADA */}
            <div className="w-full relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/1.png?v=5" alt="Portada" className="w-full h-auto block" />
            </div>

            {/* 2. PADRES Y PADRINOS */}
            <div className="w-full relative -mt-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/2.png?v=5" alt="Padres y Padrinos" className="w-full h-auto block" />
            </div>

            {/* 3. CEREMONIA */}
            <div className="w-full relative flex flex-col items-center -mt-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/3.png?v=5" alt="Ceremonia" className="w-full h-auto block" />
              
              <a 
                href="https://maps.app.goo.gl/i6cS46tYWTkaP5q98" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-[39%] group flex items-center justify-center gap-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-[#2c2c2c]/10 px-4 py-1.5 rounded-full transition-all duration-300 shadow-sm mx-4 z-10"
              >
                <svg className="w-3.5 h-3.5 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-inter tracking-widest uppercase text-[9px] font-medium text-[#2C2C2C]">Ubicación</span>
              </a>
            </div>

            {/* 4. RECEPCIÓN */}
            <div className="w-full relative flex flex-col items-center -mt-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/4.png?v=5" alt="Recepción" className="w-full h-auto block" />
              
              <a 
                href="https://www.google.com/maps/search/Hacienda+Chaká,+Conkal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-[33%] group flex items-center justify-center gap-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-[#2c2c2c]/10 px-4 py-1.5 rounded-full transition-all duration-300 shadow-sm mx-4 z-10"
              >
                <svg className="w-3.5 h-3.5 text-[#2c2c2c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-inter tracking-widest uppercase text-[9px] font-medium text-[#2C2C2C]">Ubicación</span>
              </a>
            </div>


            {/* 5. CÓDIGO DE VESTIMENTA */}
            <div className="w-full relative -mt-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/5.png?v=5" alt="Código de Vestimenta" className="w-full h-auto block" />
            </div>

            {/* 6. MESA DE REGALOS */}
            <div className="w-full relative -mt-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fotos/6.png?v=5" alt="Mesa de Regalos" className="w-full h-auto block" />
            </div>


            {/* 7. PASES Y CONFIRMACIÓN */}
            <div className="w-full relative -mt-[1px]">
              {/* Calculamos el total de personas (titular + acompañantes), máximo 5 para las imágenes */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`/fotos/pase-${Math.min(5, 1 + (guest.companions?.length || 0))}.png?v=1`} 
                alt="Pases y Confirmación" 
                className="w-full h-auto block" 
              />
              
              {/* Botones flotantes para abrir el formulario */}
              {isResponded ? (
                <button 
                  onClick={() => setShowRSVPModal(true)}
                  className="absolute bottom-[11.5%] md:bottom-[12.5%] left-1/2 transform -translate-x-1/2 group flex items-center justify-center gap-2 bg-[#d9a1d4]/20 hover:bg-[#d9a1d4]/40 backdrop-blur-md border border-[#a16799]/30 px-6 py-2 md:py-2.5 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(217,161,212,0.3)] z-10 whitespace-nowrap"
                >
                  <span className="font-inter tracking-widest uppercase text-[10px] md:text-xs font-semibold text-[#4d2649]">
                    Ver mi respuesta
                  </span>
                </button>
              ) : (
                <div className="absolute bottom-[11.5%] md:bottom-[12.5%] left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2.5 sm:gap-4 z-10 w-[86%] max-w-sm">
                  <button 
                    onClick={() => {
                      setRsvpMode('ATTEND')
                      setSelectionError(false)
                      setSelections(prev => prev.map(s => ({ ...s, status: hasCompanions ? 'DECLINED' : 'CONFIRMED' })))
                      setShowRSVPModal(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#d9a1d4]/30 hover:bg-[#d9a1d4]/50 backdrop-blur-md border border-[#a16799]/40 px-3 sm:px-5 py-2 md:py-2.5 rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(217,161,212,0.3)] whitespace-nowrap"
                  >
                    <span className="font-inter tracking-widest uppercase text-[9.5px] sm:text-[10px] md:text-xs font-semibold text-[#4d2649]">
                      ✨ Sí asistiré
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      setRsvpMode('DECLINE')
                      setSelectionError(false)
                      setSelections(prev => prev.map(s => ({ ...s, status: 'DECLINED' })))
                      setShowRSVPModal(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/45 hover:bg-white/65 backdrop-blur-md border border-[#2c2c2c]/20 px-3 sm:px-5 py-2 md:py-2.5 rounded-full transition-all duration-300 shadow-sm whitespace-nowrap"
                  >
                    <span className="font-inter tracking-widest uppercase text-[9.5px] sm:text-[10px] md:text-xs font-semibold text-[#4A4A4A]">
                      No podré asistir
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* MODAL DE CONFIRMACIÓN (RSVP) */}
            {showRSVPModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-[#fcf9f2] w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Botón de cerrar */}
                  <button 
                    onClick={() => setShowRSVPModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 text-[#2c2c2c] hover:bg-white transition-colors z-10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>

                  <div className="p-6 md:p-8 overflow-y-auto">
                    {!isResponded ? (
                      <div className="text-center">
                        <h3 className="font-cursive text-5xl mb-4 mt-2">
                          {rsvpMode === 'ATTEND' ? '¿Nos acompañas?' : 'Te extrañaremos'}
                        </h3>
                        <p className="text-sm md:text-base text-gray-500 mb-5">
                          {rsvpMode === 'DECLINE'
                            ? 'Lamentamos que no puedas acompañarnos. Confirma tu respuesta a continuación:'
                            : (!guest.companions || guest.companions.length === 0) 
                              ? 'Por favor confirma tu asistencia:' 
                              : `Tienes ${1 + (guest.companions?.length || 0)} pases asignados. Por favor selecciona quiénes asistirán:`}
                        </p>

                        {guest.rsvpStatus === 'SENT' && (() => {
                          const refDateStr = (guest as any).sentAt || guest.updatedAt
                          const refDate = refDateStr ? new Date(refDateStr) : new Date()
                          const daysElapsed = Math.max(0, Math.floor((Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24)))
                          if (daysElapsed >= 15) {
                            const graceLeft = Math.max(1, 20 - daysElapsed)
                            return (
                              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300/70 text-amber-800 text-xs font-inter leading-relaxed">
                                ⏳ Cuentas con <b>{graceLeft} {graceLeft === 1 ? 'día adicional' : 'días adicionales'}</b> para confirmar tu respuesta; de no hacerlo, daremos por hecho que no podrás acompañarnos.
                              </div>
                            )
                          }
                          const initialLeft = 15 - daysElapsed
                          return (
                            <div className="mb-3 p-2.5 rounded-xl bg-[#A5A05A]/10 border border-[#A5A05A]/25 text-[#6e6a37] text-xs font-inter">
                              📅 Tienes <b>{initialLeft} {initialLeft === 1 ? 'día natural' : 'días naturales'}</b> para confirmar tu respuesta.
                            </div>
                          )
                        })()}

                        {rsvpMode === 'ATTEND' && hasCompanions && (
                          <div className="mb-5 p-2.5 rounded-xl bg-[#744570]/10 border border-[#744570]/25 text-[#4d2649] text-xs font-inter leading-relaxed">
                            ☑️ Marca la casilla de <b>al menos 1 persona</b> que asistirá. Si ninguno podrá acompañarnos, por favor utiliza el botón <b>&quot;No podré asistir&quot;</b>.
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-3 mb-6 text-left">
                          {rsvpMode === 'DECLINE' ? (
                            <div className="p-5 rounded-2xl border border-red-300 bg-red-50/80 shadow-sm text-center">
                              <span className="text-3xl block mb-2">😔</span>
                              <span className="font-inter font-medium text-[#4A4A4A]">No podré asistir</span>
                            </div>
                          ) : (!guest.companions || guest.companions.length === 0) ? (
                            <div className="p-5 rounded-2xl border border-[#A5A05A] bg-[#A5A05A]/10 shadow-sm text-center">
                              <span className="text-3xl block mb-2">🎉</span>
                              <span className="font-inter font-medium text-[#4A4A4A]">Sí, asistiré</span>
                            </div>
                          ) : (
                            [guest, ...(guest.companions || [])].map((person) => {
                              const isAttending = selections.find(s => s.id === person.id)?.status === 'CONFIRMED'
                              return (
                                <div 
                                  key={person.id} 
                                  onClick={() => toggleSelection(person.id)}
                                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${isAttending ? 'border-[#A5A05A] bg-[#A5A05A]/5 shadow-sm' : 'border-gray-200 bg-white/50 opacity-60'}`}
                                >
                                  <span className="font-inter font-medium text-lg text-[#4A4A4A]">{person.name}</span>
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${isAttending ? 'bg-[#A5A05A] border-[#A5A05A]' : 'bg-white border-gray-300'}`}>
                                    {isAttending && <span className="text-white text-sm">✓</span>}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>

                        {selectionError && (
                          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-inter font-medium animate-in fade-in duration-200">
                            ⚠️ Por favor selecciona al menos 1 casilla para confirmar quiénes asistirán.
                          </div>
                        )}

                        {rsvpMode === 'DECLINE' && (
                          <div className="mb-6 text-left animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-[#4A4A4A] font-inter text-sm mb-2 px-1">Mensaje para los novios (opcional):</label>
                            <textarea 
                              value={guestMessage}
                              onChange={(e) => setGuestMessage(e.target.value)}
                              placeholder="Déjanos un pequeño mensaje..."
                              className="w-full bg-white/50 border border-gray-200 rounded-xl p-3 text-sm font-inter text-[#2c2c2c] focus:outline-none focus:ring-2 focus:ring-[#A5A05A]/30 transition-all resize-none h-20"
                            />
                          </div>
                        )}
                        
                        <button 
                          disabled={loading}
                          onClick={handleRSVP}
                          className="w-full bg-gradient-to-br from-[#744570] via-[#4d2649] to-[#361533] hover:from-[#633a5f] hover:via-[#3d1d3a] hover:to-[#260e24] text-white font-inter font-medium tracking-widest uppercase py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-[#4d2649]/30 text-sm"
                        >
                          {loading ? 'Enviando...' : 'Enviar Respuesta'}
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 px-2 text-center mt-4">
                        {(() => {
                           const allDeclined = selections.every(s => s.status === 'DECLINED')
                           const isExpiredAuto = guest.message?.includes('Plazo de confirmación vencido')
                           if (allDeclined) {
                             return (
                               <>
                                <div className="text-6xl mb-6 flex items-center justify-center gap-1">
                                  <span>🥂</span>
                                  <span className="text-4xl -translate-y-2">✨</span>
                                </div>
                                <h3 className="font-cursive text-4xl md:text-5xl text-[#A5A05A] mb-4">
                                  Lamentamos que no nos acompañes
                                </h3>
                                <p className="text-gray-500 font-inter text-base">
                                  {isExpiredAuto
                                    ? 'El plazo para confirmar asistencia ha finalizado, por lo que dimos por hecho que no podrás acompañarnos.'
                                    : 'Agradecemos mucho tu sinceridad al hacérnoslo saber.'}
                                </p>
                               </>
                             )
                           }
                           return (
                               <>
                                <div className="text-6xl mb-6">✨</div>
                                <h3 className="font-cursive text-5xl md:text-6xl text-[#A5A05A] mb-4">
                                  ¡Gracias por confirmar!
                                </h3>
                                <p className="text-gray-500 font-inter text-lg">
                                  {selections.filter(s => s.status === 'CONFIRMED').length === 1 
                                    ? 'Hemos registrado tu pase exitosamente (1 lugar confirmado).' 
                                    : `Hemos registrado las respuestas de tu grupo (${selections.filter(s => s.status === 'CONFIRMED').length} lugares confirmados).`}
                                </p>
                               </>
                           )
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <footer className="py-10 text-center text-gray-400 text-xs font-inter tracking-[0.3em] uppercase bg-white/50">
              Maritere & Omar • 2026
            </footer>
            
          </div>
        </div>
      </div>
    </>
  )
}
