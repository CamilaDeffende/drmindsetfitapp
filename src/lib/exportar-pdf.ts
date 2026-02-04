import { jsPDF } from "jspdf";
/**
 * Sistema completo de exportação de PDF
 * Inclui todos os dados: perfil, métricas, planos ativos (dieta e treino), cargas registradas
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DrMindSetfitState } from '@/types'
import { obterTodasCargas } from './cargas-storage'
import { calcularSemanaAtual, formatarPeriodo } from './planos-ativos-utils'

export async function exportarPDFCompleto(
  state: DrMindSetfitState,
  passosHoje: number,
  cargaHoje: number,
  cargaSemana: number
) {
  const doc = new jsPDF()
  let yPos = 20

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (altura: number) => {
    if (yPos + altura > 280) {
      doc.addPage()
      yPos = 20
    }
  }

  // ===== CABEÇALHO =====
  doc.setFontSize(24)
  doc.setTextColor(34, 197, 94) // Verde
  doc.text('Dr. MindSetFit', 20, yPos)
  yPos += 10
  doc.setFontSize(16)
  doc.setTextColor(100, 100, 100)
  doc.text('Relatório Completo de Saúde e Performance', 20, yPos)
  yPos += 15

  // Linha separadora
  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, 190, yPos)
  yPos += 10

  // ===== DADOS DO PERFIL =====
  checkPageBreak(50)
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Dados do Perfil', 20, yPos)
  yPos += 10

  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  if (state.perfil) {
    doc.text(`Nome: ${state.perfil.nomeCompleto || 'N/A'}`, 25, yPos)
    yPos += 7
    doc.text(`Idade: ${state.perfil.idade || 'N/A'} anos`, 25, yPos)
    yPos += 7
    doc.text(`Altura: ${state.perfil.altura || 'N/A'} cm`, 25, yPos)
    yPos += 7
    doc.text(`Peso Atual: ${state.perfil.pesoAtual || 'N/A'} kg`, 25, yPos)
    yPos += 7
    doc.text(`Objetivo: ${state.perfil.objetivo || 'N/A'}`, 25, yPos)
    yPos += 7
    doc.text(`Nível: ${state.perfil.nivelTreino || 'N/A'}`, 25, yPos)
    yPos += 7
    doc.text(`Modalidade: ${state.perfil.modalidadePrincipal || 'N/A'}`, 25, yPos)
    yPos += 7
    doc.text(`Frequência Semanal: ${state.perfil.frequenciaSemanal || 0}x`, 25, yPos)
    yPos += 12
  }

  // ===== MÉTRICAS DE HOJE =====
  checkPageBreak(50)
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Métricas de Hoje', 20, yPos)
  yPos += 10

  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  const metaPassos = 10000
  const caloriasQueimadas = Math.floor(passosHoje * 0.04)
  doc.text(`Passos: ${passosHoje.toLocaleString('pt-BR')} (Meta: ${metaPassos.toLocaleString('pt-BR')})`, 25, yPos)
  yPos += 7
  doc.text(`Calorias Queimadas: ${caloriasQueimadas} kcal`, 25, yPos)
  
  yPos += 8;
  {
  const __src: any = (typeof state !== "undefined" ? (state as any) : null);
  const __weekly =
    __src?.metabolismo?.nivelAtividadeSemanal ??
    __src?.resultadoMetabolico?.nivelAtividadeSemanal ??
    __src?.nivelAtividadeSemanal ??
    __src?.perfil?.nivelAtividadeSemanal ??
    "—";
  doc.text(`Atividade semanal: ${String(__weekly)}`, 25, yPos);
}
yPos += 7
  doc.text(`Peso Levantado Hoje: ${cargaHoje.toLocaleString('pt-BR')} kg`, 25, yPos)
  yPos += 7
  doc.text(`Peso Total da Semana: ${cargaSemana.toLocaleString('pt-BR')} kg`, 25, yPos)
  yPos += 12

  // ===== PLANO ATIVO - DIETA =====
  if (state.dietaAtiva && state.dietaAtiva.nutricao) {
    checkPageBreak(100)
    doc.setFontSize(18)
    doc.setTextColor(34, 197, 94) // Verde
    doc.text('📋 Plano Ativo - Dieta', 20, yPos)
    yPos += 10

    const { semanaAtual, totalSemanas, status, diasRestantes } = calcularSemanaAtual(
      state.dietaAtiva.dataInicio,
      state.dietaAtiva.dataFim,
      state.dietaAtiva.duracaoSemanas
    )

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Estratégia: ${state.dietaAtiva.estrategia}`, 25, yPos)
    yPos += 7
    doc.text(`Período: ${formatarPeriodo(state.dietaAtiva.dataInicio, state.dietaAtiva.dataFim)}`, 25, yPos)
    yPos += 7
    doc.text(`Semana Atual: ${semanaAtual} de ${totalSemanas}`, 25, yPos)
    yPos += 7
    doc.text(`Status: ${status === 'ativo' ? 'Em andamento' : status === 'finalizado' ? 'Finalizado' : 'Aguardando'}`, 25, yPos)
    yPos += 7
    doc.text(`Dias Restantes: ${diasRestantes}`, 25, yPos)
    yPos += 12

    // Macronutrientes
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Metas Diárias', 25, yPos)
    yPos += 8

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    const { macros } = state.dietaAtiva.nutricao
    doc.text(`Calorias: ${macros.calorias} kcal/dia`, 30, yPos)
    yPos += 7
    doc.text(`Proteínas: ${macros.proteina}g`, 30, yPos)
    yPos += 7
    doc.text(`Carboidratos: ${macros.carboidratos}g`, 30, yPos)
    yPos += 7
    doc.text(`Gorduras: ${macros.gorduras}g`, 30, yPos)
    yPos += 12

    // Refeições
    if (state.dietaAtiva.nutricao.refeicoes.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('Refeições do Dia', 25, yPos)
      yPos += 8

      state.dietaAtiva.nutricao.refeicoes.forEach((refeicao) => {
        checkPageBreak(40)

        const totalCalorias = refeicao.alimentos.reduce((acc, a) => acc + a.calorias, 0)

        doc.setFontSize(12)
        doc.setTextColor(34, 197, 94)
        doc.text(`${refeicao.nome} (${refeicao.horario})`, 30, yPos)
        yPos += 6

        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Total: ${totalCalorias} kcal`, 35, yPos)
        yPos += 6

        refeicao.alimentos.forEach((alimento) => {
          checkPageBreak(10)
          doc.setFontSize(9)
          doc.setTextColor(100, 100, 100)
          doc.text(`• ${alimento.nome} - ${alimento.gramas}g (${alimento.calorias} kcal)`, 40, yPos)
          yPos += 5
        })
        yPos += 5
      })
    }
  }

  // ===== PLANO ATIVO - TREINO =====
  if (state.treinoAtivo && state.treinoAtivo.treino) {
    checkPageBreak(100)
    doc.addPage()
    yPos = 20

    doc.setFontSize(18)
    doc.setTextColor(34, 197, 94) // Verde
    doc.text('💪 Plano Ativo - Treino', 20, yPos)
    yPos += 10

    const { semanaAtual, totalSemanas, status } = calcularSemanaAtual(
      state.treinoAtivo.dataInicio,
      state.treinoAtivo.dataFim,
      state.treinoAtivo.duracaoSemanas
    )

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Estratégia: ${state.treinoAtivo.estrategia}`, 25, yPos)
    yPos += 7
    doc.text(`Período: ${formatarPeriodo(state.treinoAtivo.dataInicio, state.treinoAtivo.dataFim)}`, 25, yPos)
    yPos += 7
    doc.text(`Semana Atual: ${semanaAtual} de ${totalSemanas}`, 25, yPos)
    yPos += 7
    doc.text(`Status: ${status === 'ativo' ? 'Em andamento' : status === 'finalizado' ? 'Finalizado' : 'Aguardando'}`, 25, yPos)
    yPos += 7
    doc.text(`Divisão: ${state.treinoAtivo.treino.divisao.tipo}`, 25, yPos)
    yPos += 7
    doc.text(`Frequência: ${state.treinoAtivo.treino.frequencia}x por semana`, 25, yPos)
    yPos += 7
    doc.text(`Intensidade: ${state.treinoAtivo.treino.divisao.intensidade}`, 25, yPos)
    yPos += 12

    // Carregar cargas salvas
    const cargasSalvas = obterTodasCargas()

    // Treinos por dia
    state.treinoAtivo.treino.treinos.forEach((treinoDia) => {
      checkPageBreak(80)

      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(`${treinoDia.dia} - ${treinoDia.grupamentos.join(', ')}`, 25, yPos)
      yPos += 8

      treinoDia.exercicios.forEach((exercicioTreino, indexEx) => {
        checkPageBreak(30)

        doc.setFontSize(11)
        doc.setTextColor(60, 60, 60)
        doc.text(`${indexEx + 1}. ${exercicioTreino.exercicio.nome}`, 30, yPos)
        yPos += 6

        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`${exercicioTreino.series} séries x ${exercicioTreino.repeticoes} reps • ${exercicioTreino.descanso}s descanso`, 35, yPos)
        yPos += 5

        // Cargas registradas por série
        const cargasExercicio = cargasSalvas.filter(
          c => c.exercicioId === exercicioTreino.exercicio.id && c.dia === treinoDia.dia
        )

        if (cargasExercicio.length > 0) {
          cargasExercicio.sort((a, b) => a.serie - b.serie)
          const cargasTexto = cargasExercicio.map(c => `S${c.serie}: ${c.carga}kg`).join(' | ')
          doc.setTextColor(34, 197, 94)
          doc.text(`Cargas: ${cargasTexto}`, 35, yPos)
          yPos += 5
        }

        yPos += 3
      })

      yPos += 5
    })
  }

  // ===== HISTÓRICO DE CORRIDAS =====
  if (state.corridas && state.corridas.length > 0) {
    checkPageBreak(100)
    doc.addPage()
    yPos = 20

    doc.setFontSize(18)
    doc.setTextColor(34, 197, 94)
    doc.text('🏃 Histórico de Corridas', 20, yPos)
    yPos += 10

    const ultimasCorridas = state.corridas.slice(-10).reverse()

    ultimasCorridas.forEach((corrida) => {
      checkPageBreak(25)

      const dataCorrida = new Date(corrida.dataTimestamp)

      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`${format(dataCorrida, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 25, yPos)
      yPos += 6

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Distância: ${corrida.distancia.toFixed(2)} km`, 30, yPos)
      yPos += 5
      doc.text(`Pace: ${corrida.pace} min/km`, 30, yPos)
      yPos += 5
      doc.text(`Duração: ${Math.floor(corrida.duracao / 60)} min`, 30, yPos)
      yPos += 5
      doc.text(`Calorias: ${corrida.calorias} kcal`, 30, yPos)
      yPos += 8
    })
  }

  // ===== RODAPÉ FINAL =====
  doc.addPage()
  yPos = 20

  doc.setFontSize(16)
  doc.setTextColor(34, 197, 94)
  doc.text('Informações do Relatório', 20, yPos)
  yPos += 15

  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 25, yPos)
  yPos += 10
  doc.text('Sistema: Dr. MindSetFit - Saúde e Performance', 25, yPos)
  yPos += 10
  doc.text('Este relatório contém dados sensíveis. Mantenha em sigilo.', 25, yPos)

  // Salvar PDF

  // MF_PDF_TRAINING_V3 (Treinos da semana via SSOT)
  try {
    const __mfRaw = (typeof window !== "undefined") ? localStorage.getItem("mf:activePlan:v1") : null;
    const __mfAp = __mfRaw ? JSON.parse(__mfRaw) : null;
    const __mfW = (__mfAp && __mfAp.training && Array.isArray(__mfAp.training.workouts)) ? __mfAp.training.workouts : [];

    if (__mfW.length) {
      const __doc: any = doc; // jsPDF instance (template uses 'doc')
      let yPdf = 20;          // cursor local (não depende do template)
      const xPdf = 14;

      // título
      __doc.setFontSize(14);
      __doc.text("Treinos da semana", xPdf, yPdf);
      yPdf += 8;

      __doc.setFontSize(10);

      for (let i = 0; i < __mfW.length; i++) {
        const w = __mfW[i] || {};
        const line =
          `${w.day || "DIA"} • ${w.modality || "Atividade"} — ${w.title || "Treino do dia"}` +
          (w.durationMin ? ` (${w.durationMin} min)` : "");

        // quebra de página simples (A4 mm ~ 297; margem segura)
        if (yPdf > 285) {
          __doc.addPage();
          yPdf = 20;
          __doc.setFontSize(14);
          __doc.text("Treinos da semana (cont.)", xPdf, yPdf);
          yPdf += 8;
          __doc.setFontSize(10);
        }

        yPdf += 6;
        __doc.text(line, xPdf, yPdf);
      }

      yPdf += 8;
    }
  } catch {}

const nomeArquivo = `DrMindSetFit_Completo_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
  doc.save(nomeArquivo)

  return nomeArquivo
}
