import { jsPDF } from "jspdf";
import { adaptActivePlanNutrition } from "@/services/nutrition/nutrition.adapter";

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

  function __mfBuildCanonicalTrainingForPdf() {
    try {
      const __mfRaw = (typeof window !== "undefined") ? localStorage.getItem("mf:activePlan:v1") : null;
      const __mfAp = __mfRaw ? JSON.parse(__mfRaw) : null;
      const __mfW = (__mfAp && __mfAp.training && Array.isArray(__mfAp.training.workouts)) ? __mfAp.training.workouts : [];
      if (!__mfW.length) return null;

      const __createdAt = __mfAp?.createdAt ?? new Date().toISOString();
      const __start = new Date(__createdAt);
      const __end = new Date(__start.getTime() + 28 * 24 * 60 * 60 * 1000);

      return {
        estrategia: "Treino oficial do plano ativo",
        dataInicio: __start.toISOString(),
        dataFim: __end.toISOString(),
        duracaoSemanas: 4,
        treino: {
          divisao: {
            tipo: "Plano semanal ativo",
            intensidade: String(__mfW[0]?.intensity ?? "auto"),
          },
          frequencia: __mfW.length,
          treinos: __mfW.map((w: any, idx: number) => {
            const exercises = (Array.isArray(w?.blocks) ? w.blocks : [])
              .flatMap((b: any) => Array.isArray(b?.exercises) ? b.exercises : []);

            const grupamentos = Array.from(
              new Set(exercises.map((ex: any) => ex?.muscleGroup).filter(Boolean).map(String))
            );

            return {
              dia: String(w?.dayLabel ?? w?.dayKey ?? `Dia ${idx + 1}`),
              grupamentos,
              exercicios: exercises.map((ex: any, exIdx: number) => ({
                exercicio: {
                  id: String(ex?.exerciseId ?? `ex-${idx + 1}-${exIdx + 1}`),
                  nome: String(ex?.name ?? `Exercício ${exIdx + 1}`),
                  grupoMuscular: ex?.muscleGroup,
                },
                series: Number(ex?.sets ?? 0) || 0,
                repeticoes: String(ex?.reps ?? "—"),
                descanso: Number(ex?.restSec ?? 0) || 0,
                observacoes: ex?.notes,
              })),
            };
          }),
        },
      };
    } catch {
      return null;
    }
  }

  const __mfPdfTraining = __mfBuildCanonicalTrainingForPdf() ?? state.treinoAtivo;

  // ===== PLANO ATIVO - TREINO =====
  if (__mfPdfTraining && __mfPdfTraining.treino) {
    checkPageBreak(100)
    doc.addPage()
    yPos = 20

    doc.setFontSize(18)
    doc.setTextColor(34, 197, 94) // Verde
    doc.text('💪 Plano Ativo - Treino', 20, yPos)
    yPos += 10

    const { semanaAtual, totalSemanas, status } = calcularSemanaAtual(
      __mfPdfTraining.dataInicio,
      __mfPdfTraining.dataFim,
      __mfPdfTraining.duracaoSemanas
    )

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(`Estratégia: ${__mfPdfTraining.estrategia}`, 25, yPos)
    yPos += 7
    doc.text(`Período: ${formatarPeriodo(__mfPdfTraining.dataInicio, __mfPdfTraining.dataFim)}`, 25, yPos)
    yPos += 7
    doc.text(`Semana Atual: ${semanaAtual} de ${totalSemanas}`, 25, yPos)
    yPos += 7
    doc.text(`Status: ${status === 'ativo' ? 'Em andamento' : status === 'finalizado' ? 'Finalizado' : 'Aguardando'}`, 25, yPos)
    yPos += 7
    doc.text(`Divisão: ${__mfPdfTraining.treino.divisao.tipo}`, 25, yPos)
    yPos += 7
    doc.text(`Frequência: ${__mfPdfTraining.treino.frequencia}x por semana`, 25, yPos)
    yPos += 7
    doc.text(`Intensidade: ${__mfPdfTraining.treino.divisao.intensidade}`, 25, yPos)
    yPos += 12

    // Carregar cargas salvas
    const cargasSalvas = obterTodasCargas()

    // Treinos por dia
    __mfPdfTraining.treino.treinos.forEach((treinoDia: any) => {
      checkPageBreak(80)

      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(`${treinoDia.dia} - ${treinoDia.grupamentos.join(', ')}`, 25, yPos)
      yPos += 8

      treinoDia.exercicios.forEach((exercicioTreino: any, indexEx: number) => {
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

  
  // MF_PDF_DIAG_V1
  const __mfPdfDiagEnabled =
    (typeof window !== "undefined") &&
    (String(localStorage.getItem("mf:pdf:diag") || "") === "1");

  const __mfPdfDiag = (msg: string, extra?: any) => {
    try {
      if (!__mfPdfDiagEnabled) return;
      console.log("MF_PDF_DIAG:", msg, extra ?? "");
    } catch {}
  };

  try {
    __mfPdfDiag("start", { ua: typeof navigator !== "undefined" ? navigator.userAgent : "na" });
  } catch {}

// Salvar PDF

  // MF_PDF_NUTRITION_SSOT_V1 (Dieta do dia via SSOT / localStorage)
  // Motivo: no export, state.dietaAtiva pode não estar populado. Fonte da verdade: mf:activePlan:v1.
  try {
    const __mfRawN = (typeof window !== "undefined") ? localStorage.getItem("mf:activePlan:v1") : null;
    const __mfApN = __mfRawN ? JSON.parse(__mfRawN) : null;

    const __adapted: any = adaptActivePlanNutrition(__mfApN?.nutrition);
    const __kcal = (__adapted?.kcalTarget ?? null);
    const __macros = (__adapted?.macros ?? null);
    const __meals = Array.isArray(__adapted?.meals) ? __adapted.meals : [];

    const __hasMacros =
      !!(__macros && (
        Number(__macros?.proteina || 0) > 0 ||
        Number(__macros?.carboidratos || 0) > 0 ||
        Number(__macros?.gorduras || 0) > 0 ||
        Number(__macros?.calorias || 0) > 0
      ));

    const __hasMeals = __meals.length > 0;
    const __hasKcal = Number(__kcal || 0) > 0;

    // Renderiza se houver evidência real de dieta (kcal+macros ou refeições)
    if (__hasMeals || __hasMacros || __hasKcal) {
      const __docN: any = doc;

      // Página nova: evita colidir com rodapé/template
      __docN.addPage();
      let yN = 20;
      const xN = 14;

      const __ensure = (need: number) => {
        if (yN + need > 285) {
          __docN.addPage();
          yN = 20;
        }
      };

      __docN.setFontSize(14);
      __docN.text("Dieta do dia", xN, yN);
      yN += 8;

      __docN.setFontSize(10);

      if (__hasKcal) {
        __ensure(10);
        __docN.text(`Calorias alvo: ${Number(__kcal).toFixed(0)} kcal`, xN, yN);
        yN += 7;
      }

      if (__hasMacros) {
        __ensure(16);
        const cal = Number(__macros?.calorias || 0);
        const pG = Number(__macros?.proteina || 0);
        const cG = Number(__macros?.carboidratos || 0);
        const gG = Number(__macros?.gorduras || 0);

        if (cal > 0) { __docN.text(`Calorias: ${cal.toFixed(0)} kcal/dia`, xN, yN); yN += 6; }
        if (pG > 0)  { __docN.text(`Proteínas: ${pG.toFixed(0)} g`, xN, yN); yN += 6; }
        if (cG > 0)  { __docN.text(`Carboidratos: ${cG.toFixed(0)} g`, xN, yN); yN += 6; }
        if (gG > 0)  { __docN.text(`Gorduras: ${gG.toFixed(0)} g`, xN, yN); yN += 6; }

        yN += 2;
      }

      if (__hasMeals) {
        __ensure(10);
        __docN.setFontSize(12);
        __docN.text("Refeições", xN, yN);
        yN += 7;
        __docN.setFontSize(9);

        for (let i = 0; i < __meals.length; i++) {
          const m = __meals[i] || {};
          const nome = String(m?.nome || m?.tipo || `Refeição ${i+1}`);
          const horario = String(m?.horario || "");
          const title = horario ? `${nome} (${horario})` : nome;

          __ensure(10);
          __docN.text(title, xN, yN);
          yN += 5;

          const foods = Array.isArray(m?.alimentos) ? m.alimentos : [];
          for (let j = 0; j < foods.length; j++) {
            const a = foods[j] || {};
            const an = String(a?.nome || a?.food || a?.alimento || "Item");
            const aq = (a?.quantidade ?? a?.gramas ?? a?.g ?? null);
            const unit = (aq !== null && aq !== undefined) ? `${String(aq)}g` : "";
            const kcal = (a?.calorias ?? a?.kcal ?? null);
            const kcalTxt = (kcal !== null && kcal !== undefined) ? ` (${String(kcal)} kcal)` : "";
            const line = `• ${an}${unit ? " - " + unit : ""}${kcalTxt}`;
            __ensure(6);
            __docN.text(line, xN + 4, yN);
            yN += 4;
          }
        }
      }
    }
  } catch(_e) {
    try { __mfPdfDiag?.("MF_PDF_NUTRITION_SSOT_V1 error", String(_e)); } catch {}
  }



const nomeArquivo = `DrMindSetFit_Completo_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
  try {
    if (__mfPdfDiagEnabled) {
      try { (doc as any).setFontSize?.(9); } catch {}
      try { (doc as any).text?.("MF_PDF_DIAG_OK", 14, 292); } catch {}
      try {
        const n = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : null;
        __mfPdfDiag("before_save pages", n);
      } catch(_e) { __mfPdfDiag("before_save pages err", String(_e)); }
    }
  } catch {}
  doc.save(nomeArquivo)
  return nomeArquivo
}
