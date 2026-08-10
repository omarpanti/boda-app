'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkAddGuests } from './actions'

export default function ImportExcelButton() {
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        // Convertir la primera hoja a JSON
        const json = XLSX.utils.sheet_to_json(worksheet) as any[]

        // Mapear las columnas haciéndolo insensible a mayúsculas y espacios
        const parsedGuests = json.map(row => {
          // Normalizar las llaves del row (ej: " NOMBRE " -> "NOMBRE")
          const normalizedRow: Record<string, any> = {}
          for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
              normalizedRow[key.trim().toUpperCase()] = row[key]
            }
          }

          const nombre = String(normalizedRow['NOMBRE'] || '').trim()
          const apellidos = String(normalizedRow['APELLIDOS'] || normalizedRow['APELLIDO'] || '').trim()
          const fullName = `${nombre} ${apellidos}`.trim()
          
          const genderStr = String(normalizedRow['GENERO'] || normalizedRow['GÉNERO'] || '').trim().toUpperCase()
          const telefono = String(normalizedRow['TELEFONO'] || normalizedRow['TELÉFONO'] || normalizedRow['CELULAR'] || '').trim()
          
          // Deducción inteligente de género en español (M=Mujer, H=Hombre)
          let gender = 'M' // Por defecto: M en BD significa Hombre
          if (genderStr === 'M' || genderStr.includes('MUJER') || genderStr.startsWith('F')) {
            gender = 'F' // Femenino / Mujer en la BD
          } else if (genderStr === 'H' || genderStr.includes('HOMBRE')) {
            gender = 'M' // Masculino / Hombre en la BD
          }
          
          return { name: fullName, gender, phone: telefono }
        }).filter(g => g.name.length > 0) // Ignorar filas vacías

        if (parsedGuests.length > 0) {
          await bulkAddGuests(parsedGuests)
          alert(`¡Éxito! Se han importado ${parsedGuests.length} invitados correctamente.`)
        } else {
          alert('No se encontraron invitados. Revisa que el Excel tenga las columnas: NOMBRE, APELLIDOS, GENERO')
        }
      } catch (error) {
        console.error(error)
        alert('Hubo un error al leer el archivo Excel.')
      } finally {
        setLoading(false)
        e.target.value = '' // Limpiar el input
      }
    }
    
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="relative overflow-hidden inline-block w-full sm:w-auto mt-4 sm:mt-0">
      <button 
        disabled={loading}
        className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
      >
        {loading ? 'Procesando archivo...' : '📥 Importar desde Excel (.xlsx)'}
      </button>
      <input 
        type="file" 
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        disabled={loading}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        title="Selecciona tu archivo Excel"
      />
    </div>
  )
}
