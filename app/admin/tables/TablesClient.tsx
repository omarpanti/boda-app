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
  
  // Estado de selección y coordenadas temporales
  const [selectedItem, setSelectedItem] = useState<{type: 'TABLE'|'LAYOUT', id: number} | null>(null)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, {x: number, y: number, r?: number}>>({})
  
  // Navegación móvil y colapso de menú en desktop
  const [activeTab, setActiveTab] = useState<'menu' | 'canvas'>('canvas')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Ref para paneo del lienzo
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSpaceDown, setIsSpaceDown] = useState(false)

  // Ref para arrastrar elementos con Pointer Capture
  const dragRef = useRef<{
    id: number
    type: 'TABLE' | 'LAYOUT'
    startX: number
    startY: number
    startPosX: number
    startPosY: number
    pointerId: number
  } | null>(null)

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    
    const doc = new jsPDF()
    const primaryColor: [number, number, number] = [165, 160, 90] // Dorado M&O
    
    let allConfirmedGuests: { name: string, tableName: string }[] = []
    let totalConfirmedInTables = 0

    initialTables.forEach(table => {
      const confirmed = table.guests.filter(g => g.rsvpStatus === 'CONFIRMED')
      confirmed.forEach(g => {
        allConfirmedGuests.push({ name: g.name, tableName: `Mesa ${table.number ? table.number : table.name}` })
        totalConfirmedInTables++
      })
    })

    const unassignedConfirmed = initialGuests.filter(g => g.tableId === null && g.rsvpStatus === 'CONFIRMED')
    unassignedConfirmed.forEach(g => {
      allConfirmedGuests.push({ name: g.name, tableName: '⚠️ SIN MESA' })
    })

    allConfirmedGuests.sort((a, b) => a.name.localeCompare(b.name))

    doc.setFontSize(22)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('M & O - Lista de Recepción (Hostess)', 105, 20, { align: 'center' })
    
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`Total Confirmados: ${allConfirmedGuests.length} (${unassignedConfirmed.length} sin mesa)`, 105, 28, { align: 'center' })
    doc.text('Esta lista está ordenada alfabéticamente para facilitar la búsqueda en la entrada.', 105, 34, { align: 'center' })

    const alphaRows = allConfirmedGuests.map(g => [
      '', 
      g.name,
      g.tableName
    ])

    autoTable(doc, {
      head: [['Check', 'Nombre del Invitado', 'Mesa Asignada']],
      body: alphaRows,
      startY: 40,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
        2: { cellWidth: 40, halign: 'center' }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.column.index === 0) {
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(data.cell.x + 6, data.cell.y + 2, 5, 5)
        }
      },
      alternateRowStyles: { fillColor: [252, 251, 246] },
      styles: { fontSize: 10, cellPadding: 3, textColor: [60, 60, 60] }
    })

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

  // --- LOGICA DE ARRASTRE UNIFICADA POR POINTER EVENTS ---
  const handleItemPointerDown = (e: React.PointerEvent<HTMLDivElement>, type: 'TABLE' | 'LAYOUT', id: number, currentX: number, currentY: number) => {
    // Ignorar si hace clic en controles (botones, selectores, etc.)
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('.context-menu')) {
      return
    }
    
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    
    dragRef.current = {
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentX,
      startPosY: currentY,
      pointerId: e.pointerId
    }
    
    setSelectedItem({ type, id })
  }

  const handleItemPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    e.stopPropagation()
    
    const drag = dragRef.current
    const dx = (e.clientX - drag.startX) / zoom
    const dy = (e.clientY - drag.startY) / zoom
    
    let newX = drag.startPosX + dx
    let newY = drag.startPosY + dy
    
    // Limitar al lienzo de 2500 x 1800
    newX = Math.max(0, Math.min(newX, 2400))
    newY = Math.max(0, Math.min(newY, 1700))
    
    setPositionOverrides(prev => ({
      ...prev,
      [`${drag.type}_${drag.id}`]: {
        ...prev[`${drag.type}_${drag.id}`],
        x: newX,
        y: newY
      }
    }))
  }

  const handleItemPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    e.stopPropagation()
    
    const drag = dragRef.current
    e.currentTarget.releasePointerCapture(drag.pointerId)
    dragRef.current = null
    
    const override = positionOverrides[`${drag.type}_${drag.id}`]
    if (override) {
      if (drag.type === 'TABLE') {
        await updateTablePosition(drag.id, override.x, override.y)
      } else {
        await updateLayoutElementPosition(drag.id, override.x, override.y)
      }
    }
  }

  // Drag-and-drop de escritorio para invitados de la barra lateral a las mesas
  const onDragStartGuest = (e: React.DragEvent, guestId: number) => {
    e.dataTransfer.setData('type', 'GUEST')
    e.dataTransfer.setData('id', guestId.toString())
  }

  const onDragOverCanvas = (e: React.DragEvent) => e.preventDefault()

  const onDropGuestOnTable = async (guestId: number, tableId: number) => {
    const table = initialTables.find(t => t.id === tableId)
    if (table && table.guests.length < table.capacity) {
      await assignGuestToTable(guestId, tableId)
    } else {
      alert('La mesa ya está llena')
    }
  }

  const handleResize = async (id: number, currentW: number, currentH: number, deltaW: number, deltaH: number) => {
    await updateLayoutElementSize(id, Math.max(100, currentW + deltaW), Math.max(100, currentH + deltaH))
  }

  const unassignedGuests = initialGuests.filter(g => 
    g.tableId === null && g.name.toLowerCase().includes(guestSearch.toLowerCase())
  )

  // Auto-centrado al montar
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

  // Paneo del lienzo
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return
    setSelectedItem(null) // Deseleccionar al tocar fondo
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !containerRef.current) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    containerRef.current.scrollLeft -= dx
    containerRef.current.scrollTop -= dy
    setPanStart({ x: e.clientX, y: e.clientY })
  }

  const handleCanvasPointerUp = () => {
    setIsPanning(false)
    if (containerRef.current) {
      containerRef.current.style.cursor = 'default'
    }
  }

  const handleFullscreenAndCenter = () => {
    const container = containerRef.current;
    if (!container) return;

    const willEnterFullscreen = !document.fullscreenElement;
    if (willEnterFullscreen) {
      container.requestFullscreen().catch(err => console.log('Error al entrar a pantalla completa:', err));
    } else {
      document.exitFullscreen();
    }

    const stage = initialLayout.find(l => l.type === 'STAGE');
    const danceFloor = initialLayout.find(l => l.type === 'DANCE_FLOOR');
    
    let targetX = 1250;
    let targetY = 900;
    
    if (stage && danceFloor) {
      targetX = ((stage.x_position + stage.width / 2) + (danceFloor.x_position + danceFloor.width / 2)) / 2;
      targetY = ((stage.y_position + stage.height / 2) + (danceFloor.y_position + danceFloor.height / 2)) / 2;
    } else if (stage) {
      targetX = stage.x_position + stage.width / 2;
      targetY = stage.y_position + stage.height / 2;
    } else if (danceFloor) {
      targetX = danceFloor.x_position + danceFloor.width / 2;
      targetY = danceFloor.y_position + danceFloor.height / 2;
    }

    setTimeout(() => {
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
          style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
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
      
      {/* Selector de Pestañas para Móviles / iPad (Oculto en Desktop) */}
      <div className="flex lg:hidden bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 shrink-0 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'canvas'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          🗺️ Plano del Salón
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          📋 Panel e Invitados
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO DE CONFIGURACIONES */}
        <div className={`w-full lg:w-[400px] flex-shrink-0 flex-col gap-4 overflow-y-auto pb-4 pr-1 transition-all duration-300 ${isSidebarCollapsed ? 'hidden' : (activeTab === 'menu' ? 'flex h-full' : 'hidden lg:flex')}`}>
          
          {/* Header del Panel en Desktop */}
          <div className="hidden lg:flex items-center justify-between bg-white/5 px-5 py-3 rounded-2xl border border-white/10 shrink-0 backdrop-blur-xl">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Herramientas</span>
            <button 
              onClick={() => setIsSidebarCollapsed(true)} 
              className="text-slate-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1 font-medium"
              title="Ocultar Panel"
            >
              ◀ Ocultar Panel
            </button>
          </div>

          {/* Añadir Mesa */}
          <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 shrink-0 backdrop-blur-xl">
            <h2 className="font-semibold mb-4 text-white flex items-center gap-2">
              Añadir Mesa
            </h2>
            <form onSubmit={handleAddTable} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input 
                  type="number" placeholder="N°" 
                  value={newTableNumber} onChange={e => setNewTableNumber(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="bg-black/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 w-20 transition-all placeholder-slate-500 text-sm" 
                  title="Número de Mesa (Opcional)"
                />
                <input 
                  type="text" placeholder="Nombre (Ej: Novios, Familia)" 
                  value={newTableName} onChange={e => setNewTableName(e.target.value)}
                  className="bg-black/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 flex-1 transition-all placeholder-slate-500 text-sm" required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Sillas</label>
                  <input 
                    type="number" value={newTableCapacity}
                    onChange={e => setNewTableCapacity(parseInt(e.target.value))}
                    min="1" max="20" className="bg-black/30 border border-white/10 p-2.5 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Forma</label>
                  <select 
                    value={newTableShape} onChange={e => setNewTableShape(e.target.value)}
                    className="bg-black/30 border border-white/10 p-2.5 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm [&>option]:bg-slate-900"
                  >
                    <option value="ROUND">Redonda</option>
                    <option value="SQUARE">Cuadrada</option>
                    <option value="RECTANGULAR">Rectangular</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl font-medium hover:from-purple-500 hover:to-indigo-500 mt-1 transition-all shadow-lg text-sm">Crear Mesa</button>
            </form>
          </div>

          {/* Elementos del Salón */}
          <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 shrink-0 backdrop-blur-xl">
            <h2 className="font-semibold mb-3 text-white">Elementos del Salón</h2>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => handleAddLayout('ROOM_AREA', 'Límites del Salón')} className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-medium border border-emerald-500/20 shadow-sm">+ Añadir Paredes / Área</button>
              <button onClick={() => handleAddLayout('DANCE_FLOOR', 'Pista de Baile')} className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl hover:bg-blue-500/20 transition-all text-xs font-medium border border-blue-500/20 shadow-sm">+ Añadir Pista de Baile</button>
              <button onClick={() => handleAddLayout('STAGE', 'Escenario (Grupo)')} className="bg-purple-500/10 text-purple-400 p-2.5 rounded-xl hover:bg-purple-500/20 transition-all text-xs font-medium border border-purple-500/20 shadow-sm">+ Añadir Escenario</button>
            </div>
          </div>

          {/* Invitados Sin Asignar */}
          <div className="bg-white/5 p-5 rounded-3xl shadow-xl border border-white/10 flex-1 flex flex-col min-h-[300px] backdrop-blur-xl">
            <div className="flex justify-between items-start mb-1">
              <h2 className="font-semibold text-white">Invitados Libres ({initialGuests.filter(g => g.tableId === null).length})</h2>
              <button onClick={handleExportPDF} className="bg-gradient-to-r from-rose-600 to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 shadow-md transition-all" title="Generar PDF de Recepción">📄 PDF Mesas</button>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">En computadoras puedes arrastrarlos a las mesas.</p>
            
            <input 
              type="text" 
              placeholder="🔍 Buscar invitado..." 
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              className="bg-black/30 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 w-full mb-3 text-xs placeholder-slate-500 transition-all"
            />

            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
              {unassignedGuests.map(guest => (
                <div 
                  key={guest.id} 
                  draggable 
                  onDragStart={(e) => onDragStartGuest(e, guest.id)}
                  className={`border p-2.5 rounded-xl cursor-grab flex items-center gap-3 font-medium shadow-sm transition-all text-xs hover:-translate-y-0.5
                    ${guest.gender === 'M' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-pink-500/10 border-pink-500/20 text-pink-300'}`}
                >
                  <span className="text-lg">{guest.gender === 'M' ? '👨' : '👩'}</span> {guest.name}
                </div>
              ))}
              {unassignedGuests.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6 italic">No hay invitados libres.</p>
              )}
            </div>
          </div>
        </div>

        {/* LIENZO INTERACTIVO DEL SALÓN */}
        <div 
          ref={containerRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className={`flex-1 w-full bg-slate-900/50 rounded-3xl shadow-inner border border-white/10 overflow-auto relative backdrop-blur-sm ${activeTab === 'canvas' ? 'block' : 'hidden lg:block'}`}
        >
          {/* Botón flotante para Expandir Panel (Desktop) */}
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="hidden lg:flex absolute top-4 left-4 z-50 items-center justify-center px-4 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-400 hover:text-white border border-white/10 shadow-lg backdrop-blur-md transition-all font-bold gap-2"
              title="Mostrar Panel"
            >
              ▶ Mostrar Panel
            </button>
          )}

          {/* Controles de Zoom y Centrado */}
          <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white/10">
            <button onClick={handleFullscreenAndCenter} className="px-3 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg font-bold text-xs border border-indigo-500/20 transition-all" title="Pantalla Completa">
              ⛶ Centrar
            </button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg font-bold text-white transition-colors" title="Alejar">-</button>
            <span className="px-2 flex items-center justify-center text-xs font-semibold text-white">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg font-bold text-white transition-colors" title="Acercar">+</button>
          </div>
          
          {/* Superficie de diseño */}
          <div 
            className="relative min-w-[2500px] min-h-[1800px]"
            onDragOver={onDragOverCanvas}
            onDrop={async (e) => {
              e.preventDefault()
              const type = e.dataTransfer.getData('type')
              const id = parseInt(e.dataTransfer.getData('id'))
              if (type === 'GUEST') return // Dropping guest on canvas does nothing
            }}
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
              backgroundSize: '20px 20px',
              margin: '25vh 25vw'
            }}
          >

            {/* RENDERIZADO DE MESAS */}
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
                  onPointerDown={(e) => handleItemPointerDown(e, 'TABLE', table.id, xPos, yPos)}
                  onPointerMove={handleItemPointerMove}
                  onPointerUp={handleItemPointerUp}
                  onDragOver={onDragOverCanvas}
                  onDrop={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const type = e.dataTransfer.getData('type')
                    const id = parseInt(e.dataTransfer.getData('id'))
                    if (type === 'GUEST') {
                      await onDropGuestOnTable(id, table.id)
                    }
                  }}
                  style={{ 
                    position: 'absolute', left: `${xPos}px`, top: `${yPos}px`, 
                    width: `${tableW}px`, height: `${tableH}px`, zIndex: 20,
                    transform: `rotate(${rot}deg)`,
                    touchAction: 'none' // Desactiva gestos por defecto en móviles para evitar conflicto con arrastre
                  }}
                  className="select-none"
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'TABLE', id: table.id}) }}
                    className={`bg-white border-2 border-amber-600 flex flex-col items-center justify-center p-2 cursor-grab shadow-lg absolute inset-0 group transition-shadow
                      ${table.shape === 'ROUND' ? 'rounded-full' : 'rounded-lg'}
                      ${isSelected ? 'shadow-[0_0_0_3px_#3b82f6]' : ''}
                    `}
                  >
                    <div className="text-center w-full pointer-events-none">
                      <h3 className="font-bold text-gray-800 text-xs truncate" style={{ transform: `rotate(${-rot}deg)`, transition: 'transform 0.2s' }}>
                        {table.number ? <span className="text-amber-600 mr-0.5">#{table.number}</span> : ''}
                        {table.name}
                      </h3>
                      <p className="text-[9px] text-amber-700 font-medium" style={{ transform: `rotate(${-rot}deg)`, transition: 'transform 0.2s' }}>{table.guests.length}/{table.capacity}</p>
                    </div>

                    {/* Eliminar Mesa */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('¿Seguro que quieres borrar esta mesa?')) deleteTable(table.id) }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md cursor-pointer"
                      title="Borrar Mesa"
                    >
                      ×
                    </button>

                    {/* Rotar Mesa Rectangular */}
                    {isRect && isSelected && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          const newRot = (rot + 90) % 360
                          setPositionOverrides(prev => ({...prev, [`TABLE_${table.id}`]: { ...prev[`TABLE_${table.id}`], x: xPos, y: yPos, r: newRot}}))
                          updateTableRotation(table.id, newRot)
                        }}
                        className="absolute -bottom-4 right-1/2 translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer z-50"
                        title="Rotar 90°"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                  
                  {/* Sillas */}
                  {renderSeats(table)}

                  {/* MENÚ DE ASIGNACIÓN RÁPIDA DE INVITADOS (Ideal para iPad y Móviles) */}
                  {isSelected && (
                    <div 
                      className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-xl border border-gray-200 p-1.5 flex items-center gap-1.5 z-50 whitespace-nowrap context-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[9px] font-bold text-gray-400 uppercase px-1">Mesa</span>
                      
                      {/* Sentar Invitado */}
                      <select
                        onChange={async (e) => {
                          const val = e.target.value
                          if (val) {
                            await onDropGuestOnTable(parseInt(val), table.id)
                          }
                          e.target.value = ""
                        }}
                        className="text-[11px] border border-gray-200 rounded px-1.5 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[100px]"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Sentar</option>
                        {unassignedGuests.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>

                      {/* Quitar Invitado */}
                      {table.guests.length > 0 && (
                        <select
                          onChange={async (e) => {
                            const val = e.target.value
                            if (val) {
                              await assignGuestToTable(parseInt(val), null)
                            }
                            e.target.value = ""
                          }}
                          className="text-[11px] border border-gray-200 rounded px-1.5 py-1 text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[100px]"
                          defaultValue=""
                        >
                          <option value="" disabled>- Quitar</option>
                          {table.guests.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(null) }} 
                        className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* RENDERIZADO DE PISTA DE BAILE, ESCENARIO, Y PAREDES */}
            {initialLayout.map(layout => {
              const isSelected = selectedItem?.type === 'LAYOUT' && selectedItem.id === layout.id
              const override = positionOverrides[`LAYOUT_${layout.id}`]
              const xPos = override ? override.x : layout.x_position
              const yPos = override ? override.y : layout.y_position
              const rot  = override && override.r !== undefined ? override.r : (layout.rotation || 0)
              
              return (
                <div
                  key={`layout-${layout.id}`}
                  onPointerDown={(e) => handleItemPointerDown(e, 'LAYOUT', layout.id, xPos, yPos)}
                  onPointerMove={handleItemPointerMove}
                  onPointerUp={handleItemPointerUp}
                  style={{ 
                    position: 'absolute', left: `${xPos}px`, top: `${yPos}px`, 
                    width: `${layout.width}px`, height: `${layout.height}px`,
                    zIndex: layout.type === 'ROOM_AREA' ? 5 : 10,
                    transform: `rotate(${rot}deg)`,
                    touchAction: 'none'
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'LAYOUT', id: layout.id}) }}
                  className={`rounded-xl flex flex-col items-center justify-center cursor-move transition-shadow group select-none
                    ${layout.type === 'DANCE_FLOOR' ? 'border-4 border-dashed border-indigo-300 bg-indigo-50/50' : ''}
                    ${layout.type === 'STAGE' ? 'border-4 border-dashed border-purple-300 bg-purple-50/50' : ''}
                    ${layout.type === 'ROOM_AREA' ? 'border-[6px] border-emerald-200 bg-emerald-50/10' : ''}
                    ${isSelected ? 'shadow-[0_0_0_3px_#3b82f6]' : 'hover:shadow-md'}
                  `}
                >
                  <div className="text-center pointer-events-none">
                    <span className={`font-bold text-lg uppercase tracking-widest opacity-40 
                      ${layout.type === 'DANCE_FLOOR' ? 'text-indigo-800' : ''}
                      ${layout.type === 'STAGE' ? 'text-purple-800' : ''}
                      ${layout.type === 'ROOM_AREA' ? 'text-emerald-800 opacity-60 text-2xl' : ''}
                    `}>
                      {layout.name}
                    </span>
                  </div>
                  
                  {/* Borrar Elemento de Layout */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('¿Seguro que quieres borrar este elemento?')) deleteLayoutElement(layout.id) }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md"
                  >
                    ×
                  </button>

                  {/* Controles de Resize y Rotar para Elemento del Salón */}
                  {isSelected && (
                    <div 
                      className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 p-1 flex items-center gap-1 z-40 context-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[9px] font-bold text-gray-400 uppercase mr-1.5 ml-1">Tamaño</span>
                      <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 50, 0) }} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs">↔+</button>
                      <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, -50, 0) }} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs">↔-</button>
                      <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, 50) }} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs">↕+</button>
                      <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, -50) }} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs">↕-</button>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          const newRot = (rot + 90) % 360
                          setPositionOverrides(prev => ({...prev, [`LAYOUT_${layout.id}`]: { ...prev[`LAYOUT_${layout.id}`], x: xPos, y: yPos, r: newRot}}))
                          updateLayoutElementRotation(layout.id, newRot)
                        }}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-bold"
                        title="Rotar 90°"
                      >
                        ↻ Girar
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedItem(null) }} className="ml-1 px-2 py-0.5 bg-blue-500 text-white hover:bg-blue-600 rounded text-xs">✓</button>
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
