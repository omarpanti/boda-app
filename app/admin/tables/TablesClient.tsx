'use client'

import { useState, useRef, useEffect } from 'react'
import { createTable, updateTablePosition, updateTableRotation, assignGuestToTable, deleteTable, createLayoutElement, updateLayoutElementPosition, updateLayoutElementRotation, updateLayoutElementSize, deleteLayoutElement } from './actions'

type Guest = { id: number, name: string, gender: string, tableId: number | null, rsvpStatus: string }
type Table = { id: number, number: number | null, name: string, capacity: number, shape: string, x_position: number, y_position: number, rotation: number, guests: Guest[] }
type LayoutElement = { id: number, type: string, name: string, width: number, height: number, x_position: number, y_position: number, rotation: number }

export default function TablesClient({ initialTables, initialGuests, initialLayout }: { initialTables: Table[], initialGuests: Guest[], initialLayout: LayoutElement[] }) {
  const [newTableNumber, setNewTableNumber] = useState<number | ''>('')
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState(8)
  const [newTableShape, setNewTableShape] = useState('ROUND')
  
  const [zoom, setZoom] = useState(1)
  
  const [guestSearch, setGuestSearch] = useState('')
  
  // Estado de selección y movimiento
  const [selectedItem, setSelectedItem] = useState<{type: 'TABLE'|'LAYOUT', id: number} | null>(null)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, {x: number, y: number, r?: number}>>({})
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Para paneo del lienzo
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSpaceDown, setIsSpaceDown] = useState(false)

  // Estado para la navegación móvil (Pestañas)
  const [activeTab, setActiveTab] = useState<'menu' | 'canvas'>('canvas')

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()

    // --- PORTADA Y CONFIGURACIÓN ---
    const primaryColor: [number, number, number] = [165, 160, 90] // Dorado M&O
    
    // Todas las personas confirmadas (con o sin mesa)
    let allConfirmedGuests: { name: string, tableName: string }[] = []
    let totalConfirmedInTables = 0

    // Extraer de las mesas
    initialTables.forEach(table => {
      const confirmed = table.guests.filter(g => g.rsvpStatus === 'CONFIRMED')
      confirmed.forEach(g => {
        allConfirmedGuests.push({ name: g.name, tableName: `Mesa ${table.number ? table.number : table.name}` })
        totalConfirmedInTables++
      })
    })

    // Extraer los que no tienen mesa
    const unassignedConfirmed = initialGuests.filter(g => g.tableId === null && g.rsvpStatus === 'CONFIRMED')
    unassignedConfirmed.forEach(g => {
      allConfirmedGuests.push({ name: g.name, tableName: '⚠️ SIN MESA' })
    })

    // Ordenar alfabéticamente de A-Z
    allConfirmedGuests.sort((a, b) => a.name.localeCompare(b.name))

    // --- SECCIÓN 1: ORDEN ALFABÉTICO (Para Recepción/Hostess) ---
    doc.setFontSize(22)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('M & O - Lista de Recepción (Hostess)', 105, 20, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Total Confirmados: ${allConfirmedGuests.length} (${unassignedConfirmed.length} sin mesa)`, 105, 28, { align: 'center' })
    doc.text('Esta lista está ordenada alfabéticamente para facilitar la búsqueda en la entrada.', 105, 34, { align: 'center' })

    const alphaRows = allConfirmedGuests.map(g => [
      '', // Para la casilla de check (vacío)
      g.name,
      g.tableName
    ])

    autoTable(doc, {
      head: [['Check', 'Nombre del Invitado', 'Mesa Asignada']],
      body: alphaRows,
      startY: 40,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Columna del checkbox
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 40, halign: 'center' }
      },
      didDrawCell: function(data) {
        // Dibujar un cuadrito [ ] en la columna 0 para marcar con pluma
        if (data.section === 'body' && data.column.index === 0) {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(data.cell.x + 6, data.cell.y + 2, 5, 5) // Dibuja un cuadrado
        }
      },
      alternateRowStyles: { fillColor: [252, 251, 246] },
      styles: { fontSize: 10, cellPadding: 3, textColor: [60, 60, 60] }
    })

    // --- SECCIÓN 2: AGRUPADO POR MESAS (Para auditoría del salón) ---
    doc.addPage()
    
    doc.setFontSize(18)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Acomodo por Mesas (Auditoría)', 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Para verificar quiénes deben estar sentados en cada mesa.', 105, 26, { align: 'center' })

    const tableRowsGrouped: any[] = []

    const sortedTables = [...initialTables].sort((a, b) => {
      if (a.number && b.number) return a.number - b.number;
      if (a.number) return -1;
      if (b.number) return 1;
      return a.name.localeCompare(b.name);
    })

    sortedTables.forEach(table => {
      const confirmed = table.guests.filter(g => g.rsvpStatus === 'CONFIRMED')
      if (confirmed.length > 0) {
        tableRowsGrouped.push([
          { content: `Mesa ${table.number ? table.number : ''} - ${table.name} (${confirmed.length} personas)`, colSpan: 2, styles: { fillColor: [240, 238, 228], textColor: [100, 95, 40], fontStyle: 'bold' } }
        ])
        confirmed.forEach(g => {
          tableRowsGrouped.push(['', g.name])
        })
      }
    })

    if (unassignedConfirmed.length > 0) {
      tableRowsGrouped.push([
        { content: `⚠️ SIN MESA ASIGNADA (${unassignedConfirmed.length} personas)`, colSpan: 2, styles: { fillColor: [255, 240, 240], textColor: [200, 50, 50], fontStyle: 'bold' } }
      ])
      unassignedConfirmed.forEach(g => {
        tableRowsGrouped.push(['', g.name])
      })
    }

    autoTable(doc, {
      head: [['Check', 'Invitado']],
      body: tableRowsGrouped,
      startY: 32,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.column.index === 0 && !(data.cell.raw as any)?.colSpan) {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(data.cell.x + 6, data.cell.y + 2, 5, 5)
        }
      },
      styles: { fontSize: 10, cellPadding: 3, textColor: [60, 60, 60] }
    })

    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank')
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTableName) return
    const num = newTableNumber !== '' ? newTableNumber : undefined
    await createTable(newTableName, newTableCapacity, newTableShape, num)
    setNewTableName('')
    if (typeof newTableNumber === 'number') setNewTableNumber(newTableNumber + 1)
  }

  const handleAddLayout = async (type: string, name: string) => {
    await createLayoutElement(type, name)
  }

  const onDragStart = (e: React.DragEvent, type: 'TABLE' | 'GUEST' | 'LAYOUT', id: number, offsetX = 0, offsetY = 0) => {
    e.dataTransfer.setData('type', type)
    e.dataTransfer.setData('id', id.toString())
    if (type === 'TABLE' || type === 'LAYOUT') {
      e.dataTransfer.setData('offsetX', offsetX.toString())
      e.dataTransfer.setData('offsetY', offsetY.toString())
    }
  }

  const onDragOver = (e: React.DragEvent) => e.preventDefault()

  const onDropCanvas = async (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('type')
    const id = parseInt(e.dataTransfer.getData('id'))
    
    if (type === 'TABLE' || type === 'LAYOUT') {
      const offsetX = parseFloat(e.dataTransfer.getData('offsetX'))
      const offsetY = parseFloat(e.dataTransfer.getData('offsetY'))
      const canvasRect = e.currentTarget.getBoundingClientRect()
      
      let newX = (e.clientX - canvasRect.left - offsetX) / zoom
      let newY = (e.clientY - canvasRect.top - offsetY) / zoom
      
      newX = Math.max(0, Math.min(newX, (2500 - 100)))
      newY = Math.max(0, Math.min(newY, (1800 - 100)))
      
      if (type === 'TABLE') {
        await updateTablePosition(id, newX, newY)
      } else {
        await updateLayoutElementPosition(id, newX, newY)
      }
    }
  }

  const onDropTable = async (e: React.DragEvent, tableId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const type = e.dataTransfer.getData('type')
    const id = parseInt(e.dataTransfer.getData('id'))
    if (type === 'GUEST') {
      const table = initialTables.find(t => t.id === tableId)
      if (table && table.guests.length < table.capacity) {
         await assignGuestToTable(id, tableId)
      } else {
         alert('La mesa ya está llena')
      }
    }
  }

  const unassignGuest = async (e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('type')
    const id = parseInt(e.dataTransfer.getData('id'))
    if (type === 'GUEST') {
      await assignGuestToTable(id, null)
    }
  }

  const handleResize = async (id: number, currentW: number, currentH: number, deltaW: number, deltaH: number) => {
    await updateLayoutElementSize(id, Math.max(100, currentW + deltaW), Math.max(100, currentH + deltaH))
  }

  const unassignedGuests = initialGuests.filter(g => 
    g.tableId === null && g.name.toLowerCase().includes(guestSearch.toLowerCase())
  )

  // 1. Auto-centrado al montar
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const stage = initialLayout.find(l => l.type === 'STAGE');
    const targetX = stage ? stage.x_position + stage.width / 2 : 1250;
    const targetY = stage ? stage.y_position + stage.height / 2 : 900;
    
    setTimeout(() => {
      const marginX = window.innerWidth / 2;
      const marginY = window.innerHeight / 2;
      container.scrollTo({
        left: marginX + targetX - (container.clientWidth / 2),
        top: marginY + targetY - (container.clientHeight / 2),
        behavior: 'auto'
      });
    }, 50);
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refs para closures en useEffect
  const stateRef = useRef({ selectedItem, initialTables, initialLayout })
  useEffect(() => {
    stateRef.current = { selectedItem, initialTables, initialLayout }
  }, [selectedItem, initialTables, initialLayout])

  // 2. Paneo con Barra Espaciadora y Movimiento con Flechas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpaceDown(true)
      }

      const { selectedItem, initialTables, initialLayout } = stateRef.current;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && selectedItem) {
        e.preventDefault()
        const step = e.shiftKey ? 50 : 10;
        
        setPositionOverrides(prev => {
          const key = `${selectedItem.type}_${selectedItem.id}`
          let currX = 0; let currY = 0; let currR = 0;
          
          if (prev[key]) {
            currX = prev[key].x; currY = prev[key].y; currR = prev[key].r || 0;
          } else {
            if (selectedItem.type === 'TABLE') {
              const t = initialTables.find(t => t.id === selectedItem.id)
              currX = t?.x_position || 0; currY = t?.y_position || 0; currR = t?.rotation || 0;
            } else {
              const l = initialLayout.find(l => l.id === selectedItem.id)
              currX = l?.x_position || 0; currY = l?.y_position || 0; currR = l?.rotation || 0;
            }
          }
          
          if (e.code === 'ArrowUp') currY -= step;
          if (e.code === 'ArrowDown') currY += step;
          if (e.code === 'ArrowLeft') currX -= step;
          if (e.code === 'ArrowRight') currX += step;
          
          currX = Math.max(0, Math.min(currX, 2400))
          currY = Math.max(0, Math.min(currY, 1700))
          
          if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
          moveTimerRef.current = setTimeout(() => {
            if (selectedItem.type === 'TABLE') updateTablePosition(selectedItem.id, currX, currY)
            else updateLayoutElementPosition(selectedItem.id, currX, currY)
          }, 500)
          
          return { ...prev, [key]: {x: currX, y: currY, r: currR} }
        })
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false)
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 3. Zoom estricto con Rueda del Ratón (evita zoom del navegador)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault() // Bloquea el zoom del navegador Chrome/Safari
        
        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        
        setZoom(prevZoom => {
          const newZoom = Math.max(0.3, Math.min(2.0, prevZoom + delta))
          if (newZoom !== prevZoom) {
            const marginX = window.innerWidth / 2;
            const marginY = window.innerHeight / 2;
            const xUnscaled = (container.scrollLeft + mouseX - marginX) / prevZoom;
            const yUnscaled = (container.scrollTop + mouseY - marginY) / prevZoom;
            
            // Compensar scroll instantáneamente
            container.scrollLeft = (xUnscaled * newZoom) + marginX - mouseX;
            container.scrollTop = (yUnscaled * newZoom) + marginY - mouseY;
          }
          return newZoom
        })
      }
    }

    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelNative)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null) // Clic en el fondo deselecciona
    }
    // Panear si hacen clic en el fondo vacío, o si tienen presionada la barra espaciadora
    if (!isSpaceDown && e.target !== e.currentTarget) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !containerRef.current) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    containerRef.current.scrollLeft -= dx
    containerRef.current.scrollTop -= dy
    setPanStart({ x: e.clientX, y: e.clientY })
  }

  const handlePointerUp = () => {
    setIsPanning(false)
    if (containerRef.current) {
      containerRef.current.style.cursor = 'default'
    }
  }

  const handleFullscreenAndCenter = () => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Activar pantalla completa
    const willEnterFullscreen = !document.fullscreenElement;
    if (willEnterFullscreen) {
      container.requestFullscreen().catch(err => console.log('Error al entrar a pantalla completa:', err));
    } else {
      document.exitFullscreen();
    }

    // 2. Encontrar y centrar el escenario o la pista de baile (calculando posición central)
    const stage = initialLayout.find(l => l.type === 'STAGE');
    const danceFloor = initialLayout.find(l => l.type === 'DANCE_FLOOR');
    
    // Prioridad: Centrar entre ambos si existen los dos, o centrar el que exista
    let targetX = 0;
    let targetY = 0;
    
    if (stage && danceFloor) {
      targetX = ((stage.x_position + stage.width / 2) + (danceFloor.x_position + danceFloor.width / 2)) / 2;
      targetY = ((stage.y_position + stage.height / 2) + (danceFloor.y_position + danceFloor.height / 2)) / 2;
    } else if (stage) {
      targetX = stage.x_position + stage.width / 2;
      targetY = stage.y_position + stage.height / 2;
    } else if (danceFloor) {
      targetX = danceFloor.x_position + danceFloor.width / 2;
      targetY = danceFloor.y_position + danceFloor.height / 2;
    } else {
      // Si no hay ninguno, centrar el mapa general
      targetX = 1250;
      targetY = 900;
    }

    // Aplicar el zoom actual y centrar la vista
    // Esperamos a que la animación de fullscreen (aprox 200ms) termine para leer el clientWidth real.
    setTimeout(() => {
      // El lienzo tiene un margen de 50vh y 50vw.
      // 50vw = window.innerWidth / 2
      const marginX = window.innerWidth / 2;
      const marginY = window.innerHeight / 2;
      
      container.scrollTo({
        left: marginX + (targetX * zoom) - (container.clientWidth / 2),
        top: marginY + (targetY * zoom) - (container.clientHeight / 2),
        behavior: 'smooth'
      });
    }, willEnterFullscreen ? 400 : 100);
  }

  const renderSeats = (table: Table) => {
    const seats = []
    const total = table.capacity
    const tableW = table.shape === 'RECTANGULAR' ? 130 : 90
    const tableH = table.shape === 'RECTANGULAR' ? 70 : 90
    const centerX = tableW / 2
    const centerY = tableH / 2
    const radiusX = (tableW / 2) + 16 
    const radiusY = (tableH / 2) + 16

    for (let i = 0; i < total; i++) {
      const guest = table.guests[i]
      let x = 0, y = 0
      
      if (table.shape === 'ROUND') {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2
        x = centerX + Math.cos(angle) * radiusX
        y = centerY + Math.sin(angle) * radiusY
      } else {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const factor = 1 / Math.max(Math.abs(cos), Math.abs(sin))
        x = centerX + (cos * factor) * radiusX
        y = centerY + (sin * factor) * radiusY
      }

      seats.push(
        <div 
          key={`seat-${table.id}-${i}`}
          draggable={!!guest}
          onDragStart={guest ? (e) => { e.stopPropagation(); onDragStart(e, 'GUEST', guest.id) } : undefined}
          style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)', cursor: guest ? 'grab' : 'default' }}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-md border-2 
            ${guest ? (guest.gender === 'M' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-pink-100 border-pink-400 text-pink-800') 
                    : 'bg-gray-100 border-dashed border-gray-300'}`}
          title={guest ? guest.name : 'Silla vacía'}
        >
          {guest ? (guest.gender === 'M' ? '👨' : '👩') : ''}
        </div>
      )
    }
    return seats
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Pestañas para Móviles / iPad */}
      <div className="flex lg:hidden bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 shrink-0 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'canvas'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🗺️ Plano del Salón
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📋 Panel e Invitados
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden min-h-0">
        {/* Panel Izquierdo */}
        <div className={`w-full lg:w-[400px] flex-shrink-0 flex-col gap-4 overflow-y-auto pb-4 pr-1 ${activeTab === 'menu' ? 'flex h-full' : 'hidden lg:flex'}`}>
        <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 shrink-0 backdrop-blur-xl">
          <h2 className="font-semibold mb-4 text-white flex items-center gap-2">
            Añadir Mesa
          </h2>
          <form onSubmit={handleAddTable} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input 
                type="number" placeholder="N°" 
                value={newTableNumber} onChange={e => setNewTableNumber(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="bg-black/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 w-20 transition-all placeholder-slate-500" 
                title="Número de Mesa (Opcional)"
              />
              <input 
                type="text" placeholder="Nombre (Ej: Familia Novia)" 
                value={newTableName} onChange={e => setNewTableName(e.target.value)}
                className="bg-black/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 flex-1 transition-all placeholder-slate-500" required
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1 font-medium">Sillas</label>
                <input 
                  type="number" value={newTableCapacity}
                  onChange={e => setNewTableCapacity(parseInt(e.target.value))}
                  min="1" max="20" className="bg-black/30 border border-white/10 p-3 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1 font-medium">Forma</label>
                <select 
                  value={newTableShape} onChange={e => setNewTableShape(e.target.value)}
                  className="bg-black/30 border border-white/10 p-3 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all [&>option]:bg-slate-900"
                >
                  <option value="ROUND">Redonda</option>
                  <option value="SQUARE">Cuadrada</option>
                  <option value="RECTANGULAR">Rectangular</option>
                </select>
              </div>
            </div>
            <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl font-medium hover:from-purple-500 hover:to-indigo-500 mt-2 transition-all shadow-lg hover:shadow-purple-500/25">Crear Mesa</button>
          </form>
        </div>

        {/* Añadir Elementos del Salón */}
        <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 shrink-0 backdrop-blur-xl">
          <h2 className="font-semibold mb-3 text-white">Elementos del Salón</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => handleAddLayout('ROOM_AREA', 'Límites del Salón')} className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium border border-emerald-500/20 shadow-sm">+ Añadir Límites (Paredes)</button>
            <button onClick={() => handleAddLayout('DANCE_FLOOR', 'Pista de Baile')} className="bg-blue-500/10 text-blue-400 p-3 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-medium border border-blue-500/20 shadow-sm">+ Añadir Pista de Baile</button>
            <button onClick={() => handleAddLayout('STAGE', 'Escenario (Grupo)')} className="bg-purple-500/10 text-purple-400 p-3 rounded-xl hover:bg-purple-500/20 transition-all text-sm font-medium border border-purple-500/20 shadow-sm">+ Añadir Escenario</button>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 flex-1 flex flex-col min-h-[350px] backdrop-blur-xl" onDragOver={onDragOver} onDrop={unassignGuest}>
          <div className="flex justify-between items-start mb-1">
            <h2 className="font-semibold text-white">Invitados Sin Asignar ({initialGuests.filter(g => g.tableId === null).length})</h2>
            <button onClick={handleExportPDF} className="bg-gradient-to-r from-red-600/80 to-rose-600/80 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:from-red-500 hover:to-rose-500 shadow-md transition-all border border-red-500/30" title="Generar PDF de Confirmados">📄 PDF Mesas</button>
          </div>
          <p className="text-xs text-slate-400 mb-4 pr-16">Arrastra a las mesas. Suéltalos aquí para desasignar.</p>
          
          <input 
            type="text" 
            placeholder="🔍 Buscar invitado..." 
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            className="bg-black/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 w-full mb-4 text-sm placeholder-slate-500 transition-all"
          />

          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {unassignedGuests.map(guest => (
              <div 
                key={guest.id} draggable onDragStart={(e) => onDragStart(e, 'GUEST', guest.id)}
                className={`border p-3 rounded-xl cursor-grab flex items-center gap-3 font-medium shadow-sm transition-all text-sm hover:-translate-y-0.5
                  ${guest.gender === 'M' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' : 'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20'}`}
              >
                <span className="text-xl">{guest.gender === 'M' ? '👨' : '👩'}</span> {guest.name}
              </div>
            ))}
            {unassignedGuests.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8 italic">No se encontraron invitados libres.</p>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`flex-1 w-full bg-slate-900/50 rounded-3xl shadow-inner border border-white/10 overflow-auto relative backdrop-blur-sm cursor-grab active:cursor-grabbing ${activeTab === 'canvas' ? 'block' : 'hidden lg:block'}`}
      >
        <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/50 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/10">
          <button onClick={handleFullscreenAndCenter} className="px-4 h-10 flex items-center justify-center bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg font-bold text-sm border border-indigo-500/30 transition-all mr-2" title="Pantalla Completa y Centrar">
            ⛶ Centrar
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg font-bold text-white transition-colors" title="Alejar">-</button>
          <span className="w-16 flex items-center justify-center text-sm font-medium text-white bg-black/30 rounded-lg border border-white/5">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg font-bold text-white transition-colors" title="Acercar">+</button>
        </div>
        
        <div 
          className="relative min-w-[2500px] min-h-[1800px]"
          onDragOver={onDragOver} onDrop={onDropCanvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
            backgroundSize: '20px 20px',
            cursor: (isPanning || isSpaceDown) ? 'grabbing' : 'auto',
            margin: '50vh 50vw'
          }}
        >

        {/* Renderizado de Mesas */}
        {initialTables.map(table => {
          const isRect = table.shape === 'RECTANGULAR'
          const tableW = isRect ? 130 : 90
          const tableH = isRect ? 70 : 90
          
          const override = positionOverrides[`TABLE_${table.id}`]
          const xPos = override ? override.x : table.x_position
          const yPos = override ? override.y : table.y_position
          const rot  = override && override.r !== undefined ? override.r : (table.rotation || 0)
          const isSelected = selectedItem?.type === 'TABLE' && selectedItem.id === table.id
          
          return (
            <div 
              key={`table-${table.id}`}
              style={{ 
                position: 'absolute', left: `${xPos}px`, top: `${yPos}px`, 
                width: `${tableW}px`, height: `${tableH}px`, zIndex: 20,
                transform: `rotate(${rot}deg)`,
                transition: 'transform 0.2s ease-in-out'
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'TABLE', id: table.id}) }}
            >
              <div
                draggable onDragStart={(e) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                  onDragStart(e, 'TABLE', table.id, e.clientX - rect.left, e.clientY - rect.top)
                }}
                onDragOver={onDragOver} onDrop={(e) => onDropTable(e, table.id)}
                className={`bg-white border-2 border-amber-600 flex flex-col items-center justify-center p-2 cursor-grab shadow-lg absolute inset-0 group transition-shadow
                  ${table.shape === 'ROUND' ? 'rounded-full' : 'rounded-lg'}
                  ${isSelected ? 'shadow-[0_0_0_3px_#3b82f6]' : ''}
                `}
              >
                <div className="text-center w-full pointer-events-none">
                  <h3 className="font-bold text-gray-800 text-sm truncate" style={{ transform: `rotate(${-rot}deg)`, transition: 'transform 0.2s' }}>
                    {table.number ? <span className="text-amber-600 mr-1">#{table.number}</span> : ''}
                    {table.name}
                  </h3>
                  <p className="text-[10px] text-amber-700 font-medium" style={{ transform: `rotate(${-rot}deg)`, transition: 'transform 0.2s' }}>{table.guests.length}/{table.capacity}</p>
                </div>
                {/* Botón Borrar */}
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('¿Seguro que quieres borrar esta mesa? Sus invitados quedarán sin asignar.')) deleteTable(table.id) }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-base font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md cursor-pointer"
                  title="Borrar Mesa"
                >
                  ×
                </button>
                {/* Botón Rotar */}
                {isRect && isSelected && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      const newRot = (rot + 90) % 360
                      setPositionOverrides(prev => ({...prev, [`TABLE_${table.id}`]: {x: xPos, y: yPos, r: newRot}}))
                      updateTableRotation(table.id, newRot)
                    }}
                    className="absolute -bottom-4 right-1/2 translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer z-50"
                    title="Rotar 90°"
                  >
                    ↻
                  </button>
                )}
              </div>
              {renderSeats(table)}
            </div>
          )
        })}

        {/* Renderizado de Pista de Baile y Escenario */}
        {initialLayout.map(layout => {
          const isSelected = selectedItem?.type === 'LAYOUT' && selectedItem.id === layout.id
          const override = positionOverrides[`LAYOUT_${layout.id}`]
          const xPos = override ? override.x : layout.x_position
          const yPos = override ? override.y : layout.y_position
          const rot  = override && override.r !== undefined ? override.r : (layout.rotation || 0)
          
          return (
            <div
              key={`layout-${layout.id}`}
              draggable={!isSelected} // Desactiva drag de HTML5 mientras se escala
              onDragStart={(e) => {
                if(isSelected) return; // Si están escalando, no arrastrar
                const rect = e.currentTarget.getBoundingClientRect()
                onDragStart(e, 'LAYOUT', layout.id, e.clientX - rect.left, e.clientY - rect.top)
              }}
              style={{ 
                position: 'absolute', left: `${xPos}px`, top: `${yPos}px`, 
                width: `${layout.width}px`, height: `${layout.height}px`,
                zIndex: layout.type === 'ROOM_AREA' ? 5 : 10,
                transform: `rotate(${rot}deg)`,
                transition: 'transform 0.2s ease-in-out'
              }}
              className={`rounded-xl flex flex-col items-center justify-center cursor-move transition-shadow group
                ${layout.type === 'DANCE_FLOOR' ? 'border-4 border-dashed border-indigo-300 bg-indigo-50/50' : ''}
                ${layout.type === 'STAGE' ? 'border-4 border-dashed border-purple-300 bg-purple-50/50' : ''}
                ${layout.type === 'ROOM_AREA' ? 'border-[6px] border-emerald-200 bg-emerald-50/10' : ''}
                ${isSelected ? 'shadow-[0_0_0_3px_#3b82f6]' : 'hover:shadow-md'}
              `}
              onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'LAYOUT', id: layout.id}) }}
            >
              <div className="text-center pointer-events-none">
                <span className={`font-bold text-xl uppercase tracking-widest opacity-40 
                  ${layout.type === 'DANCE_FLOOR' ? 'text-indigo-800' : ''}
                  ${layout.type === 'STAGE' ? 'text-purple-800' : ''}
                  ${layout.type === 'ROOM_AREA' ? 'text-emerald-800 opacity-60 text-3xl' : ''}
                `}>
                  {layout.name}
                </span>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); deleteLayoutElement(layout.id) }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-30"
              >
                ×
              </button>

              {/* Controles de Resize y Rotar */}
              {isSelected && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 p-1 flex items-center gap-1 z-40">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mr-2 ml-1">Tamaño</div>
                  <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 50, 0) }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">↔+</button>
                  <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, -50, 0) }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">↔-</button>
                  <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, 50) }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">↕+</button>
                  <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, -50) }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">↕-</button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      const newRot = (rot + 90) % 360
                      setPositionOverrides(prev => ({...prev, [`LAYOUT_${layout.id}`]: {x: xPos, y: yPos, r: newRot}}))
                      updateLayoutElementRotation(layout.id, newRot)
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold"
                    title="Rotar 90°"
                  >
                    ↻ Girar
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedItem(null) }} className="ml-1 px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded text-xs">✓</button>
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
      </div>
    </div>
  )
}
