/**
 * Utilitários para gestão de Planos Ativos (Dieta e Treino)
 * com suporte a períodos fixos e cálculo de semana atual
 */

import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns'

/**
 * Calcula qual semana atual do plano baseado na data de hoje
 * @param dataInicio - Data inicial do plano (YYYY-MM-DD)
 * @param dataFim - Data final do plano (YYYY-MM-DD)
 * @param duracaoSemanas - Duração total do plano em semanas
 * @returns Objeto com informações da semana atual
 */
export function calcularSemanaAtual(
  dataInicio: string,
  dataFim: string,
  duracaoSemanas: number
): {
  semanaAtual: number
  totalSemanas: number
  status: 'antes' | 'ativo' | 'finalizado'
  diasRestantes: number
  progressoPorcentagem: number
} {
  const hoje = new Date()
  const inicio = parseISO(dataInicio)
  const fim = parseISO(dataFim)

  // Verifica status do plano
  let status: 'antes' | 'ativo' | 'finalizado'
  if (isBefore(hoje, inicio)) {
    status = 'antes'
  } else if (isAfter(hoje, fim)) {
    status = 'finalizado'
  } else {
    status = 'ativo'
  }

  // Calcula dias desde o início
  const diasDesdeInicio = differenceInDays(hoje, inicio)

  // Calcula semana atual (1-indexed)
  const semanaAtual = Math.max(1, Math.min(
    Math.floor(diasDesdeInicio / 7) + 1,
    duracaoSemanas
  ))

  // Calcula dias restantes
  const diasRestantes = Math.max(0, differenceInDays(fim, hoje))

  // Calcula progresso em porcentagem
  const duracaoTotalDias = differenceInDays(fim, inicio)
  const diasDecorridos = differenceInDays(hoje, inicio)
  const progressoPorcentagem = Math.min(100, Math.max(0, (diasDecorridos / duracaoTotalDias) * 100))

  return {
    semanaAtual,
    totalSemanas: duracaoSemanas,
    status,
    diasRestantes,
    progressoPorcentagem
  }
}

/**
 * Formata período para exibição
 * @param dataInicio - Data inicial (YYYY-MM-DD)
 * @param dataFim - Data final (YYYY-MM-DD)
 * @returns String formatada "DD/MM/YYYY → DD/MM/YYYY"
 */
export function formatarPeriodo(dataInicio: string, dataFim: string): string {
  const inicio = parseISO(dataInicio)
  const fim = parseISO(dataFim)

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return `${formatDate(inicio)} → ${formatDate(fim)}`
}

/**
 * Gera mensagem de status do plano
 */
export function getMensagemStatus(status: 'antes' | 'ativo' | 'finalizado'): {
  texto: string
  cor: string
} {
  switch (status) {
    case 'antes':
      return {
        texto: 'Plano ainda não iniciado',
        cor: 'text-[#1E6BFF]'
      }
    case 'ativo':
      return {
        texto: 'Plano em andamento',
        cor: 'text-green-400'
      }
    case 'finalizado':
      return {
        texto: 'Plano finalizado — aguardando próximo ajuste',
        cor: 'text-yellow-400'
      }
  }
}
