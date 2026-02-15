/**
 * Exportação de PDF do Plano Nutricional
 * Design premium com branding DrMindSetFit
 */

import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type NutritionPDFInput = {
  userName: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  targetKcal: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  meals: Array<{
    name: string;
    time?: string;
    totalKcal: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  }>;
};

/**
 * Gera PDF profissional do plano nutricional
 */
export async function generateNutritionPDF(input: NutritionPDFInput): Promise<jsPDF> {
  const doc = new jsPDF();
  let yPos = 20;

  // Função auxiliar para quebra de página
  const checkPageBreak = (height: number) => {
    if (yPos + height > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  // ===== CABEÇALHO =====
  doc.setFillColor(0, 149, 255);
  doc.rect(0, 0, 210, 35, "F");

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("DrMindSetFit", 20, 18);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(240, 240, 240);
  doc.text("Plano Nutricional Científico Personalizado", 20, 27);

  yPos = 45;

  // ===== INFORMAÇÕES DO USUÁRIO =====
  checkPageBreak(40);

  doc.setFontSize(16);
  doc.setTextColor(0, 149, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Usuário", 20, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const userData = [
    `Nome: ${input.userName}`,
    `Idade: ${input.age} anos`,
    `Peso: ${input.weight} kg`,
    `Altura: ${input.height} cm`,
    `Objetivo: ${input.goal}`,
    `Data: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
  ];

  userData.forEach((line) => {
    doc.text(line, 20, yPos);
    yPos += 6;
  });

  yPos += 10;

  // ===== RESUMO CALÓRICO E MACROS =====
  checkPageBreak(50);

  doc.setFontSize(16);
  doc.setTextColor(0, 149, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Nutricional", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const macroLines = [
    `Calorias Diárias: ${input.targetKcal} kcal`,
    `Proteínas: ${input.macros.proteinG}g (${Math.round((input.macros.proteinG * 4 / input.targetKcal) * 100)}%)`,
    `Carboidratos: ${input.macros.carbsG}g (${Math.round((input.macros.carbsG * 4 / input.targetKcal) * 100)}%)`,
    `Gorduras: ${input.macros.fatG}g (${Math.round((input.macros.fatG * 9 / input.targetKcal) * 100)}%)`,
  ];

  macroLines.forEach((line) => {
    doc.text(line, 20, yPos);
    yPos += 6;
  });

  yPos += 10;

  // ===== REFEIÇÕES DIÁRIAS =====
  checkPageBreak(40);

  doc.setFontSize(16);
  doc.setTextColor(0, 149, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Refeições Diárias", 20, yPos);
  yPos += 10;

  input.meals.forEach((meal) => {
    checkPageBreak(30);

    doc.setFontSize(13);
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    const mealTitle = meal.time ? `${meal.name} (${meal.time})` : meal.name;
    doc.text(mealTitle, 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const mealLines = [
      `Calorias: ${meal.totalKcal} kcal`,
      `Proteína: ${meal.totalProtein}g | Carboidratos: ${meal.totalCarbs}g | Gorduras: ${meal.totalFat}g`,
    ];

    mealLines.forEach((line) => {
      doc.text(line, 25, yPos);
      yPos += 5;
    });

    yPos += 8;
  });

  // ===== OBSERVAÇÕES CIENTÍFICAS =====
  checkPageBreak(60);

  doc.setFontSize(16);
  doc.setTextColor(0, 149, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Observações Científicas", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const observations = [
    "• Proteína: Distribua ao longo do dia (≥20g por refeição) para maximizar síntese proteica.",
    "• Carboidratos: Ajuste conforme volume/intensidade do treino. Priorize pré e pós-treino.",
    "• Gorduras: Mantenha mínimo fisiológico (0.8-1.0g/kg). Evite em pré-treino imediato.",
    "• Hidratação: 35-40ml/kg de peso corporal. Aumente em dias de treino intenso.",
    "• Fibras: 25-35g/dia para saúde gastrointestinal e saciedade.",
  ];

  observations.forEach((obs) => {
    checkPageBreak(8);
    const lines = doc.splitTextToSize(obs, 170);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5 + 2;
  });

  // ===== RODAPÉ =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `DrMindSetFit - Plataforma Fitness Científica | Página ${i} de ${totalPages}`,
      105,
      290,
      { align: "center" }
    );
  }

  return doc;
}

/**
 * Salva PDF do plano nutricional
 */
export async function saveNutritionPDF(input: NutritionPDFInput): Promise<void> {
  const doc = await generateNutritionPDF(input);
  doc.save(`DrMindSetFit_Plano_Nutricional_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
