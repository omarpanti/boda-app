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
  
  const [selectedItem, setSelectedItem] = useState<{type: 'TABLE'|'LAYOUT', id: number} | null>(null)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, {x: number, y: number, r?: number}>>({})
  
  // UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

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
    const primaryColor: [number, number, number] = [165, 160, 90]
    
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
    setShowAddMenu(false)
  }

  const handleAddLayout = async (type: string, name: string) => {
    await createLayoutElement(type, name)
    setShowAddMenu(false)
  }

  const handleItemPointerDown = (e: React.PointerEvent<HTMLDivElement>, type: 'TABLE' | 'LAYOUT', id: number, currentX: number, currentY: number) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'SELECT' || (e.target as HTMLElement).closest('.context-menu')) {
      return
    }
    
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    
    dragRef.current = {
      id, type,
      startX: e.clientX, startY: e.clientY,
      startPosX: currentX, startPosY: currentY,
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
    
    newX = Math.max(0, Math.min(newX, 2400))
    newY = Math.max(0, Math.min(newY, 1700))
    
    setPositionOverrides(prev => ({
      ...prev,
      [`${drag.type}_${drag.id}`]: {
        ...prev[`${drag.type}_${drag.id}`],
        x: newX, y: newY
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
  }, []) 

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return
    setSelectedItem(null)
    setShowAddMenu(false)
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
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 transition-colors
            ${guest ? (guest.gender === 'M' ? 'bg-indigo-900 border-indigo-400 text-indigo-100' : 'bg-pink-900 border-pink-400 text-pink-100') 
                    : 'bg-slate-800 border-dashed border-slate-600 text-transparent'}`}
          title={guest ? guest.name : 'Silla vacía'}
        >
          {guest ? (guest.gender === 'M' ? '👨' : '👩') : ''}
        </div>
      )
    }
    return seats
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-950 text-slate-200 font-sans relative">
      
      {/* HEADER / TOP CONTROLS */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center pointer-events-none">
        {/* Zoom Controls */}
        <div className="flex gap-2 bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto">
          <button onClick={handleFullscreenAndCenter} className="px-4 h-10 flex items-center justify-center bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 rounded-xl font-bold text-sm border border-indigo-500/20 transition-all">
            ⛶ Centrar
          </button>
          <div className="w-px h-10 bg-white/10 mx-1"></div>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl font-bold text-xl transition-colors">-</button>
          <span className="px-3 flex items-center justify-center text-sm font-semibold">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl font-bold text-xl transition-colors">+</button>
        </div>

        {/* Guest Drawer Toggle */}
        <button 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`pointer-events-auto flex items-center gap-2 px-5 h-12 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl transition-all font-semibold text-sm
            ${isDrawerOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200'}`}
        >
          👥 Invitados {unassignedGuests.length > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs">{unassignedGuests.length}</span>}
        </button>
      </div>

      {/* FLOATING BOTTOM DOCK */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        {showAddMenu && (
          <div className="mb-4 bg-slate-900/95 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/10 w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-200">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm border-b border-white/10 pb-2">➕ Añadir Elemento</h3>
            
            <form onSubmit={handleAddTable} className="flex flex-col gap-4 mb-6">
              <div className="flex gap-2">
                <input 
                  type="number" placeholder="N°" 
                  value={newTableNumber} onChange={e => setNewTableNumber(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 w-20 transition-all placeholder-slate-500 text-sm" 
                />
                <input 
                  type="text" placeholder="Nombre (Ej: Novios)" 
                  value={newTableName} onChange={e => setNewTableName(e.target.value)}
                  className="bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 flex-1 transition-all placeholder-slate-500 text-sm" required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1.5 block ml-1">Sillas</label>
                  <input 
                    type="number" value={newTableCapacity}
                    onChange={e => setNewTableCapacity(parseInt(e.target.value))}
                    min="1" max="20" className="bg-black/50 border border-white/10 p-2.5 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" 
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1.5 block ml-1">Forma</label>
                  <select 
                    value={newTableShape} onChange={e => setNewTableShape(e.target.value)}
                    className="bg-black/50 border border-white/10 p-2.5 rounded-xl w-full text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm [&>option]:bg-slate-900"
                  >
                    <option value="ROUND">Redonda</option>
                    <option value="SQUARE">Cuadrada</option>
                    <option value="RECTANGULAR">Rectángular</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-semibold transition-all shadow-lg text-sm w-full">Crear Mesa</button>
            </form>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAddLayout('ROOM_AREA', 'Salón')} className="bg-white/5 hover:bg-white/10 text-emerald-400 p-3 rounded-xl transition-all text-xs font-medium border border-white/5">+ Paredes</button>
              <button onClick={() => handleAddLayout('DANCE_FLOOR', 'Pista')} className="bg-white/5 hover:bg-white/10 text-blue-400 p-3 rounded-xl transition-all text-xs font-medium border border-white/5">+ Pista</button>
              <button onClick={() => handleAddLayout('STAGE', 'Escenario')} className="col-span-2 bg-white/5 hover:bg-white/10 text-purple-400 p-3 rounded-xl transition-all text-xs font-medium border border-white/5">+ Escenario</button>
            </div>
          </div>
        )}

        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl transition-all hover:scale-110 active:scale-95
            ${showAddMenu ? 'bg-rose-600 text-white rotate-45' : 'bg-indigo-600 text-white'}`}
        >
          <span className="text-3xl font-light mb-1">+</span>
        </button>
      </div>

      {/* GUEST DRAWER (RIGHT PANEL) */}
      <div 
        className={`fixed top-16 right-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col
          ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="font-bold text-lg text-white">Invitados</h2>
          <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">×</button>
        </div>
        
        <div className="p-4 border-b border-white/5">
          <button onClick={handleExportPDF} className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 p-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            📄 Exportar PDF
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col min-h-0">
          <input 
            type="text" 
            placeholder="🔍 Buscar invitado..." 
            value={guestSearch}
            onChange={(e) => setGuestSearch(e.target.value)}
            className="bg-black/40 border border-white/10 p-3 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 w-full mb-4 text-sm placeholder-slate-500 transition-all"
          />

          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Sin Asignar ({unassignedGuests.length})</p>

          <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-20 custom-scrollbar flex-1">
            {unassignedGuests.map(guest => (
              <div 
                key={guest.id} 
                draggable 
                onDragStart={(e) => onDragStartGuest(e, guest.id)}
                className={`p-3 rounded-xl cursor-grab flex items-center gap-3 font-medium shadow-lg transition-all text-sm hover:scale-[1.02] active:scale-[0.98] border border-white/5 backdrop-blur-md
                  ${guest.gender === 'M' ? 'bg-blue-900/30 text-blue-200' : 'bg-pink-900/30 text-pink-200'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-inner ${guest.gender === 'M' ? 'bg-blue-800/50' : 'bg-pink-800/50'}`}>
                  {guest.gender === 'M' ? '👨' : '👩'}
                </div>
                {guest.name}
              </div>
            ))}
            {unassignedGuests.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-500 gap-2 opacity-50">
                <span className="text-3xl">✨</span>
                <p className="text-sm font-medium">Todos asignados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN CANVAS */}
      <div 
        ref={containerRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        className="absolute inset-0 w-full h-full overflow-auto bg-slate-950"
      >
        <div 
          className="relative min-w-[2500px] min-h-[1800px]"
          onDragOver={onDragOverCanvas}
          onDrop={async (e) => {
            e.preventDefault()
            const type = e.dataTransfer.getData('type')
            if (type === 'GUEST') return 
          }}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            margin: '25vh 25vw'
          }}
        >
          {/* RENDER ELEMENTS */}
          {initialTables.map(table => {
            const isRect = table.shape === 'RECTANGULAR'
            const tableW = isRect ? 140 : 100
            const tableH = isRect ? 80 : 100
            
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
                  width: `${tableW}px`, height: `${tableH}px`, zIndex: isSelected ? 30 : 20,
                  transform: `rotate(${rot}deg)`,
                  touchAction: 'none'
                }}
                className="select-none"
              >
                {/* Table Surface */}
                <div
                  onClick={(e) => { e.stopPropagation(); setSelectedItem({type: 'TABLE', id: table.id}) }}
                  className={`bg-slate-800 border-2 flex flex-col items-center justify-center p-2 cursor-grab shadow-[0_10px_30px_rgba(0,0,0,0.5)] absolute inset-0 group transition-all duration-200
                    ${table.shape === 'ROUND' ? 'rounded-full' : 'rounded-2xl'}
                    ${isSelected ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.3)]' : 'border-slate-600 hover:border-slate-400'}
                  `}
                >
                  <div className="text-center w-full pointer-events-none flex flex-col items-center">
                    {table.number && <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1" style={{ transform: `rotate(${-rot}deg)`}}>#{table.number}</span>}
                    <h3 className="font-bold text-slate-200 text-xs truncate max-w-[80%]" style={{ transform: `rotate(${-rot}deg)`}}>
                      {table.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5" style={{ transform: `rotate(${-rot}deg)`}}>{table.guests.length}/{table.capacity}</p>
                  </div>
                </div>
                
                {/* Seats */}
                {renderSeats(table)}

                {/* Modern Popover Menu */}
                {isSelected && (
                  <div 
                    className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 p-2 flex items-center gap-2 z-50 context-menu animate-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{ transform: `translate(-50%, 0) rotate(${-rot}deg)` }}
                  >
                    <select
                      onChange={async (e) => {
                        const val = e.target.value
                        if (val) await onDropGuestOnTable(parseInt(val), table.id)
                        e.target.value = ""
                      }}
                      className="text-xs border border-white/10 rounded-xl px-2 py-1.5 text-slate-200 bg-black/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[120px] cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Sentar...</option>
                      {unassignedGuests.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>

                    {table.guests.length > 0 && (
                      <select
                        onChange={async (e) => {
                          const val = e.target.value
                          if (val) await assignGuestToTable(parseInt(val), null)
                          e.target.value = ""
                        }}
                        className="text-xs border border-white/10 rounded-xl px-2 py-1.5 text-slate-200 bg-black/50 focus:outline-none focus:ring-1 focus:ring-rose-500 max-w-[120px] cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>- Quitar...</option>
                        {table.guests.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    )}

                    {isRect && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          const newRot = (rot + 90) % 360
                          setPositionOverrides(prev => ({...prev, [`TABLE_${table.id}`]: { ...prev[`TABLE_${table.id}`], x: xPos, y: yPos, r: newRot}}))
                          updateTableRotation(table.id, newRot)
                        }}
                        className="w-8 h-8 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center text-sm transition-colors"
                        title="Rotar 90°"
                      >
                        ↻
                      </button>
                    )}

                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('¿Seguro que quieres borrar esta mesa?')) deleteTable(table.id) }}
                      className="w-8 h-8 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-xl flex items-center justify-center text-lg transition-colors"
                      title="Borrar Mesa"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )
          })}

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
                className={`rounded-3xl flex flex-col items-center justify-center cursor-move transition-all group select-none backdrop-blur-sm
                  ${layout.type === 'DANCE_FLOOR' ? 'border-2 border-indigo-500/50 bg-indigo-500/10' : ''}
                  ${layout.type === 'STAGE' ? 'border-2 border-purple-500/50 bg-purple-500/10' : ''}
                  ${layout.type === 'ROOM_AREA' ? 'border-4 border-dashed border-emerald-500/30 bg-emerald-500/5' : ''}
                  ${isSelected ? 'shadow-[0_0_0_4px_rgba(255,255,255,0.1)] border-white' : 'hover:bg-white/5'}
                `}
              >
                <div className="text-center pointer-events-none">
                  <span className={`font-bold uppercase tracking-[0.2em] 
                    ${layout.type === 'DANCE_FLOOR' ? 'text-indigo-400 text-lg' : ''}
                    ${layout.type === 'STAGE' ? 'text-purple-400 text-lg' : ''}
                    ${layout.type === 'ROOM_AREA' ? 'text-emerald-500/30 text-3xl' : ''}
                  `}>
                    {layout.name}
                  </span>
                </div>
                
                {isSelected && (
                  <div 
                    className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 p-2 flex items-center gap-1 z-40 context-menu animate-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{ transform: `translate(-50%, 0) rotate(${-rot}deg)` }}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 ml-1">Escalar</span>
                    <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 50, 0) }} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300">↔+</button>
                    <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, -50, 0) }} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300">↔-</button>
                    <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, 50) }} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300">↕+</button>
                    <button onClick={(e) => { e.stopPropagation(); handleResize(layout.id, layout.width, layout.height, 0, -50) }} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300">↕-</button>
                    
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        const newRot = (rot + 90) % 360
                        setPositionOverrides(prev => ({...prev, [`LAYOUT_${layout.id}`]: { ...prev[`LAYOUT_${layout.id}`], x: xPos, y: yPos, r: newRot}}))
                        updateLayoutElementRotation(layout.id, newRot)
                      }}
                      className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center"
                      title="Rotar 90°"
                    >
                      ↻
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('¿Seguro que quieres borrar este elemento?')) deleteLayoutElement(layout.id) }}
                      className="ml-1 w-8 h-8 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg flex items-center justify-center text-lg transition-colors"
                      title="Borrar Elemento"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Global styles for custom scrollbar within this module */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  )
}
