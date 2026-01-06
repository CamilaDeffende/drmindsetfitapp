/**
 * Sistema de persistência de cargas por série
 * Armazena e recupera cargas individuais por exercício/dia/série
 */

import type { CargaSerie } from '@/types'

const STORAGE_KEY = 'drmindsetfit_cargas_series_v1'

/**
 * Salvar carga de uma série específica
 */
export function salvarCargaSerie(carga: CargaSerie): void {
  try {
    const cargas = obterTodasCargas()

    // Remove registro anterior se existir (mesmo exercício, dia e série)
    const cargazFiltered = cargas.filter(
      c => !(
        c.exercicioId === carga.exercicioId &&
        c.dia === carga.dia &&
        c.serie === carga.serie
      )
    )

    // Adiciona novo registro
    cargazFiltered.push(carga)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cargazFiltered))
  } catch (error) {
    console.error('Erro ao salvar carga:', error)
  }
}

/**
 * Obter todas as cargas salvas
 */
export function obterTodasCargas(): CargaSerie[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Erro ao carregar cargas:', error)
  }
  return []
}

/**
 * Obter carga específica por exercício, dia e série
 */
export function obterCargaSerie(
  exercicioId: string,
  dia: string,
  serie: number
): number | null {
  const cargas = obterTodasCargas()
  const carga = cargas.find(
    c => c.exercicioId === exercicioId && c.dia === dia && c.serie === serie
  )
  return carga ? carga.carga : null
}

/**
 * Obter todas as cargas de um exercício específico em um dia
 */
export function obterCargasExercicio(
  exercicioId: string,
  dia: string
): Record<number, number> {
  const cargas = obterTodasCargas()
  const cargasExercicio = cargas.filter(
    c => c.exercicioId === exercicioId && c.dia === dia
  )

  const resultado: Record<number, number> = {}
  cargasExercicio.forEach(c => {
    resultado[c.serie] = c.carga
  })

  return resultado
}

/**
 * Obter última carga utilizada em qualquer série deste exercício
 * (útil para sugestão)
 */
export function obterUltimaCarga(exercicioId: string): number | null {
  const cargas = obterTodasCargas()
  const cargasExercicio = cargas
    .filter(c => c.exercicioId === exercicioId)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return cargasExercicio.length > 0 ? cargasExercicio[0].carga : null
}

/**
 * Limpar cargas antigas (opcional, para manutenção)
 */
export function limparCargasAntigas(diasParaManter = 90): void {
  try {
    const cargas = obterTodasCargas()
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - diasParaManter)

    const cargasFiltradas = cargas.filter(c => {
      const dataCarga = new Date(c.data)
      return dataCarga >= dataLimite
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cargasFiltradas))
  } catch (error) {
    console.error('Erro ao limpar cargas antigas:', error)
  }
}
