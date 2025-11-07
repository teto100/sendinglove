// Utilidad para manejar fechas en zona horaria de Lima, Perú

export const getLimaDate = (): Date => {
  const now = new Date()
  // Lima está en UTC-5 (sin horario de verano)
  const limaOffset = -5 * 60 // -5 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const limaTime = new Date(utc + (limaOffset * 60000))
  return limaTime
}

export const formatLimaDate = (date: Date): string => {
  return getLimaDate().toLocaleDateString('es-PE')
}

export const formatLimaDateTime = (date: Date): string => {
  return getLimaDate().toLocaleString('es-PE')
}