// Biblioteca de Alimentos baseada na Tabela TACO
// Todos os valores são por 100g do alimento

export interface Alimento {
  id: string
  nome: string
  categoria: string
  calorias: number // kcal por 100g
  proteinas: number // g por 100g
  carboidratos: number // g por 100g
  gorduras: number // g por 100g
  fibras: number // g por 100g
}

export const ALIMENTOS_TACO: Alimento[] = [
  // PROTEÍNAS - CARNES E OVOS
  { id: 'frango_peito', nome: 'Peito de Frango Grelhado', categoria: 'proteina', calorias: 165, proteinas: 31.0, carboidratos: 0, gorduras: 3.6, fibras: 0 },
  { id: 'frango_coxa', nome: 'Coxa de Frango sem Pele', categoria: 'proteina', calorias: 127, proteinas: 19.0, carboidratos: 0, gorduras: 5.4, fibras: 0 },
  { id: 'carne_patinho', nome: 'Carne Bovina Patinho', categoria: 'proteina', calorias: 158, proteinas: 21.4, carboidratos: 0, gorduras: 7.8, fibras: 0 },
  { id: 'carne_alcatra', nome: 'Carne Bovina Alcatra', categoria: 'proteina', calorias: 192, proteinas: 23.6, carboidratos: 0, gorduras: 10.4, fibras: 0 },
  { id: 'carne_file_mignon', nome: 'Filé Mignon', categoria: 'proteina', calorias: 189, proteinas: 22.0, carboidratos: 0, gorduras: 11.0, fibras: 0 },
  { id: 'tilapia', nome: 'Tilápia', categoria: 'proteina', calorias: 96, proteinas: 20.1, carboidratos: 0, gorduras: 1.6, fibras: 0 },
  { id: 'salmao', nome: 'Salmão', categoria: 'proteina', calorias: 211, proteinas: 19.9, carboidratos: 0, gorduras: 14.6, fibras: 0 },
  { id: 'atum_conserva', nome: 'Atum em Conserva', categoria: 'proteina', calorias: 118, proteinas: 26.4, carboidratos: 0, gorduras: 0.8, fibras: 0 },
  { id: 'sardinha', nome: 'Sardinha em Conserva', categoria: 'proteina', calorias: 134, proteinas: 24.6, carboidratos: 0, gorduras: 3.7, fibras: 0 },
  { id: 'ovo_inteiro', nome: 'Ovo Cozido Inteiro', categoria: 'proteina', calorias: 146, proteinas: 13.3, carboidratos: 1.6, gorduras: 8.9, fibras: 0 },
  { id: 'clara_ovo', nome: 'Clara de Ovo', categoria: 'proteina', calorias: 48, proteinas: 10.9, carboidratos: 1.3, gorduras: 0, fibras: 0 },
  { id: 'peito_peru', nome: 'Peito de Peru', categoria: 'proteina', calorias: 103, proteinas: 21.9, carboidratos: 1.3, gorduras: 1.1, fibras: 0 },

  // CARBOIDRATOS - GRÃOS E CEREAIS
  { id: 'arroz_branco', nome: 'Arroz Branco Cozido', categoria: 'carboidrato', calorias: 130, proteinas: 2.5, carboidratos: 28.1, gorduras: 0.2, fibras: 1.6 },
  { id: 'arroz_integral', nome: 'Arroz Integral Cozido', categoria: 'carboidrato', calorias: 124, proteinas: 2.6, carboidratos: 25.8, gorduras: 1.0, fibras: 2.7 },
  { id: 'batata_doce', nome: 'Batata Doce Cozida', categoria: 'carboidrato', calorias: 77, proteinas: 0.6, carboidratos: 18.4, gorduras: 0.1, fibras: 2.2 },
  { id: 'batata_inglesa', nome: 'Batata Inglesa Cozida', categoria: 'carboidrato', calorias: 52, proteinas: 1.2, carboidratos: 11.9, gorduras: 0.1, fibras: 1.3 },
  { id: 'mandioca', nome: 'Mandioca Cozida', categoria: 'carboidrato', calorias: 125, proteinas: 0.6, carboidratos: 30.1, gorduras: 0.3, fibras: 1.6 },
  { id: 'macarrao_integral', nome: 'Macarrão Integral Cozido', categoria: 'carboidrato', calorias: 127, proteinas: 5.3, carboidratos: 24.4, gorduras: 1.3, fibras: 3.9 },
  { id: 'aveia', nome: 'Aveia em Flocos', categoria: 'carboidrato', calorias: 394, proteinas: 13.9, carboidratos: 66.6, gorduras: 8.5, fibras: 9.1 },
  { id: 'quinoa', nome: 'Quinoa Cozida', categoria: 'carboidrato', calorias: 120, proteinas: 4.4, carboidratos: 21.3, gorduras: 1.9, fibras: 2.8 },
  { id: 'tapioca', nome: 'Tapioca', categoria: 'carboidrato', calorias: 358, proteinas: 1.0, carboidratos: 88.7, gorduras: 0.5, fibras: 0.6 },
  { id: 'pao_integral', nome: 'Pão Integral', categoria: 'carboidrato', calorias: 253, proteinas: 9.4, carboidratos: 49.0, gorduras: 3.0, fibras: 6.9 },
  { id: 'granola', nome: 'Granola', categoria: 'carboidrato', calorias: 434, proteinas: 11.2, carboidratos: 63.2, gorduras: 14.8, fibras: 7.2 },

  // CARBOIDRATOS - LEGUMINOSAS
  { id: 'feijao_carioca', nome: 'Feijão Carioca Cozido', categoria: 'carboidrato', calorias: 76, proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5, fibras: 8.5 },
  { id: 'feijao_preto', nome: 'Feijão Preto Cozido', categoria: 'carboidrato', calorias: 77, proteinas: 4.5, carboidratos: 14.0, gorduras: 0.5, fibras: 8.4 },
  { id: 'lentilha', nome: 'Lentilha Cozida', categoria: 'carboidrato', calorias: 93, proteinas: 6.3, carboidratos: 16.0, gorduras: 0.5, fibras: 7.9 },
  { id: 'grao_bico', nome: 'Grão de Bico Cozido', categoria: 'carboidrato', calorias: 121, proteinas: 6.8, carboidratos: 18.8, gorduras: 2.0, fibras: 5.4 },
  { id: 'ervilha', nome: 'Ervilha Cozida', categoria: 'carboidrato', calorias: 63, proteinas: 5.4, carboidratos: 9.8, gorduras: 0.2, fibras: 7.5 },

  // GORDURAS SAUDÁVEIS
  { id: 'azeite', nome: 'Azeite de Oliva', categoria: 'gordura', calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100, fibras: 0 },
  { id: 'oleo_coco', nome: 'Óleo de Coco', categoria: 'gordura', calorias: 862, proteinas: 0, carboidratos: 0, gorduras: 100, fibras: 0 },
  { id: 'abacate', nome: 'Abacate', categoria: 'gordura', calorias: 96, proteinas: 1.2, carboidratos: 6.0, gorduras: 8.4, fibras: 6.3 },
  { id: 'castanha_caju', nome: 'Castanha de Caju', categoria: 'gordura', calorias: 570, proteinas: 18.5, carboidratos: 29.1, gorduras: 46.3, fibras: 3.7 },
  { id: 'castanha_para', nome: 'Castanha do Pará', categoria: 'gordura', calorias: 643, proteinas: 14.5, carboidratos: 15.1, gorduras: 63.5, fibras: 7.9 },
  { id: 'amendoim', nome: 'Amendoim', categoria: 'gordura', calorias: 567, proteinas: 27.2, carboidratos: 20.3, gorduras: 43.9, fibras: 8.0 },
  { id: 'pasta_amendoim', nome: 'Pasta de Amendoim Integral', categoria: 'gordura', calorias: 589, proteinas: 25.8, carboidratos: 20.0, gorduras: 50.0, fibras: 8.5 },
  { id: 'nozes', nome: 'Nozes', categoria: 'gordura', calorias: 654, proteinas: 15.2, carboidratos: 13.7, gorduras: 65.2, fibras: 6.7 },
  { id: 'amêndoas', nome: 'Amêndoas', categoria: 'gordura', calorias: 579, proteinas: 21.2, carboidratos: 21.7, gorduras: 49.9, fibras: 12.5 },

  // LATICÍNIOS
  { id: 'iogurte_grego', nome: 'Iogurte Grego Natural', categoria: 'proteina', calorias: 59, proteinas: 10.0, carboidratos: 3.6, gorduras: 0.4, fibras: 0 },
  { id: 'iogurte_desnatado', nome: 'Iogurte Natural Desnatado', categoria: 'proteina', calorias: 41, proteinas: 4.3, carboidratos: 5.9, gorduras: 0.2, fibras: 0 },
  { id: 'queijo_cottage', nome: 'Queijo Cottage', categoria: 'proteina', calorias: 98, proteinas: 11.1, carboidratos: 3.4, gorduras: 4.3, fibras: 0 },
  { id: 'queijo_minas', nome: 'Queijo Minas Frescal', categoria: 'proteina', calorias: 264, proteinas: 17.4, carboidratos: 2.9, gorduras: 20.8, fibras: 0 },
  { id: 'leite_desnatado', nome: 'Leite Desnatado', categoria: 'proteina', calorias: 35, proteinas: 3.4, carboidratos: 4.9, gorduras: 0.1, fibras: 0 },
  { id: 'requeijao_light', nome: 'Requeijão Light', categoria: 'proteina', calorias: 138, proteinas: 8.5, carboidratos: 4.0, gorduras: 9.5, fibras: 0 },

  // VEGETAIS E VERDURAS
  { id: 'brocolis', nome: 'Brócolis Cozido', categoria: 'vegetal', calorias: 25, proteinas: 2.3, carboidratos: 4.0, gorduras: 0.4, fibras: 3.4 },
  { id: 'couve_flor', nome: 'Couve-flor Cozida', categoria: 'vegetal', calorias: 20, proteinas: 1.5, carboidratos: 4.0, gorduras: 0.2, fibras: 2.1 },
  { id: 'espinafre', nome: 'Espinafre Cozido', categoria: 'vegetal', calorias: 23, proteinas: 3.0, carboidratos: 3.6, gorduras: 0.3, fibras: 2.4 },
  { id: 'alface', nome: 'Alface', categoria: 'vegetal', calorias: 15, proteinas: 1.4, carboidratos: 2.9, gorduras: 0.2, fibras: 2.0 },
  { id: 'tomate', nome: 'Tomate', categoria: 'vegetal', calorias: 15, proteinas: 1.1, carboidratos: 3.1, gorduras: 0.2, fibras: 1.2 },
  { id: 'cenoura', nome: 'Cenoura Crua', categoria: 'vegetal', calorias: 34, proteinas: 1.3, carboidratos: 7.7, gorduras: 0.2, fibras: 3.2 },
  { id: 'abobrinha', nome: 'Abobrinha Cozida', categoria: 'vegetal', calorias: 20, proteinas: 1.2, carboidratos: 4.3, gorduras: 0.2, fibras: 1.4 },
  { id: 'berinjela', nome: 'Berinjela Cozida', categoria: 'vegetal', calorias: 20, proteinas: 0.8, carboidratos: 4.7, gorduras: 0.1, fibras: 2.5 },
  { id: 'pimentao', nome: 'Pimentão', categoria: 'vegetal', calorias: 21, proteinas: 1.0, carboidratos: 4.6, gorduras: 0.3, fibras: 1.9 },
  { id: 'chuchu', nome: 'Chuchu Cozido', categoria: 'vegetal', calorias: 19, proteinas: 0.7, carboidratos: 4.5, gorduras: 0.2, fibras: 1.4 },

  // FRUTAS
  { id: 'banana', nome: 'Banana', categoria: 'fruta', calorias: 92, proteinas: 1.3, carboidratos: 23.8, gorduras: 0.1, fibras: 2.0 },
  { id: 'maca', nome: 'Maçã', categoria: 'fruta', calorias: 56, proteinas: 0.3, carboidratos: 14.9, gorduras: 0.1, fibras: 1.3 },
  { id: 'mamao', nome: 'Mamão Papaya', categoria: 'fruta', calorias: 40, proteinas: 0.5, carboidratos: 10.4, gorduras: 0.1, fibras: 1.8 },
  { id: 'morango', nome: 'Morango', categoria: 'fruta', calorias: 30, proteinas: 0.9, carboidratos: 6.8, gorduras: 0.3, fibras: 1.7 },
  { id: 'melancia', nome: 'Melancia', categoria: 'fruta', calorias: 33, proteinas: 0.9, carboidratos: 8.1, gorduras: 0.1, fibras: 0.1 },
  { id: 'laranja', nome: 'Laranja', categoria: 'fruta', calorias: 45, proteinas: 1.0, carboidratos: 11.5, gorduras: 0.1, fibras: 2.2 },
  { id: 'kiwi', nome: 'Kiwi', categoria: 'fruta', calorias: 51, proteinas: 1.1, carboidratos: 12.2, gorduras: 0.6, fibras: 2.7 },
  { id: 'abacaxi', nome: 'Abacaxi', categoria: 'fruta', calorias: 48, proteinas: 0.9, carboidratos: 12.3, gorduras: 0.1, fibras: 1.0 },

  // SUPLEMENTOS E PROTEÍNAS
  { id: 'whey_protein', nome: 'Whey Protein Isolado', categoria: 'suplemento', calorias: 360, proteinas: 90.0, carboidratos: 2.0, gorduras: 1.0, fibras: 0 },
  { id: 'creatina', nome: 'Creatina Monohidratada', categoria: 'suplemento', calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 },
  { id: 'bcaa', nome: 'BCAA', categoria: 'suplemento', calorias: 20, proteinas: 5.0, carboidratos: 0, gorduras: 0, fibras: 0 },
  { id: 'albumina', nome: 'Albumina', categoria: 'suplemento', calorias: 365, proteinas: 81.0, carboidratos: 5.0, gorduras: 0.5, fibras: 0 },
]

// Função para buscar alimentos por categoria
export function getAlimentosPorCategoria(categoria: string): Alimento[] {
  return ALIMENTOS_TACO.filter(a => a.categoria === categoria)
}

// Função para buscar alimento por ID
export function getAlimentoPorId(id: string): Alimento | undefined {
  return ALIMENTOS_TACO.find(a => a.id === id)
}

// Função para calcular calorias baseado em gramas
export function calcularCalorias(alimento: Alimento, gramas: number): number {
  return Math.round((alimento.calorias * gramas) / 100)
}

// Função para encontrar substitutos equivalentes (mesma categoria e kcal similares)
export function encontrarSubstitutos(alimentoId: string, quantidade: number = 5): Array<{ alimento: Alimento; gramagem: number }> {
  const alimento = getAlimentoPorId(alimentoId)
  if (!alimento) return []

  const caloriasAlvo = alimento.calorias
  const categoria = alimento.categoria

  // Buscar alimentos da mesma categoria
  const candidatos = ALIMENTOS_TACO
    .filter(a => a.id !== alimentoId && a.categoria === categoria)
    .map(a => ({
      alimento: a,
      diferenca: Math.abs(a.calorias - caloriasAlvo),
      gramagem: Math.round((caloriasAlvo * 100) / a.calorias) // Gramas necessárias para atingir as mesmas calorias
    }))
    .sort((a, b) => a.diferenca - b.diferenca)
    .slice(0, quantidade)

  return candidatos.map(c => ({ alimento: c.alimento, gramagem: c.gramagem }))
}
