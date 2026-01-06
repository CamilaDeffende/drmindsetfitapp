// Database de alimentos com macros e substituições

export interface AlimentoDatabase {
  id: string
  nome: string
  categoria: 'carboidrato' | 'proteina' | 'proteina-vegetal' | 'legume' | 'folhoso' | 'fruta' | 'gordura' | 'laticinio'
  porcaoPadrao: number // gramas
  macrosPor100g: {
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
  substituicoes: string[] // IDs de outros alimentos que podem substituir
  vegano: boolean
  vegetariano: boolean
}

export const ALIMENTOS_DATABASE: AlimentoDatabase[] = [
  // CARBOIDRATOS
  {
    id: 'arroz-branco',
    nome: 'Arroz Branco',
    categoria: 'carboidrato',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3 },
    substituicoes: ['arroz-integral', 'batata-doce', 'batata-inglesa', 'macarrao-integral', 'quinoa'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'arroz-integral',
    nome: 'Arroz Integral',
    categoria: 'carboidrato',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 123, proteinas: 2.6, carboidratos: 25.8, gorduras: 1 },
    substituicoes: ['arroz-branco', 'batata-doce', 'quinoa', 'macarrao-integral', 'aveia'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'batata-doce',
    nome: 'Batata Doce',
    categoria: 'carboidrato',
    porcaoPadrao: 200,
    macrosPor100g: { calorias: 86, proteinas: 1.6, carboidratos: 20, gorduras: 0.1 },
    substituicoes: ['batata-inglesa', 'mandioca', 'inhame', 'arroz-branco', 'macarrao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'batata-inglesa',
    nome: 'Batata Inglesa',
    categoria: 'carboidrato',
    porcaoPadrao: 200,
    macrosPor100g: { calorias: 77, proteinas: 2, carboidratos: 17, gorduras: 0.1 },
    substituicoes: ['batata-doce', 'mandioca', 'inhame', 'arroz-branco', 'macarrao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'macarrao-integral',
    nome: 'Macarrão Integral',
    categoria: 'carboidrato',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 124, proteinas: 5, carboidratos: 26, gorduras: 0.5 },
    substituicoes: ['macarrao', 'arroz-integral', 'quinoa', 'batata-doce', 'aveia'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'macarrao',
    nome: 'Macarrão',
    categoria: 'carboidrato',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 131, proteinas: 5, carboidratos: 25, gorduras: 1.1 },
    substituicoes: ['macarrao-integral', 'arroz-branco', 'batata-inglesa', 'quinoa', 'aveia'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'quinoa',
    nome: 'Quinoa',
    categoria: 'carboidrato',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 120, proteinas: 4.4, carboidratos: 21.3, gorduras: 1.9 },
    substituicoes: ['arroz-integral', 'arroz-branco', 'macarrao-integral', 'batata-doce', 'aveia'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'aveia',
    nome: 'Aveia',
    categoria: 'carboidrato',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 389, proteinas: 16.9, carboidratos: 66.3, gorduras: 6.9 },
    substituicoes: ['granola', 'tapioca', 'pao-integral', 'batata-doce', 'quinoa'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'mandioca',
    nome: 'Mandioca',
    categoria: 'carboidrato',
    porcaoPadrao: 200,
    macrosPor100g: { calorias: 125, proteinas: 0.6, carboidratos: 30, gorduras: 0.4 },
    substituicoes: ['batata-doce', 'batata-inglesa', 'inhame', 'arroz-branco', 'macarrao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'inhame',
    nome: 'Inhame',
    categoria: 'carboidrato',
    porcaoPadrao: 200,
    macrosPor100g: { calorias: 118, proteinas: 1.5, carboidratos: 27.6, gorduras: 0.2 },
    substituicoes: ['batata-doce', 'batata-inglesa', 'mandioca', 'arroz-integral', 'quinoa'],
    vegano: true,
    vegetariano: true
  },

  // PROTEÍNAS ANIMAIS
  {
    id: 'frango-peito',
    nome: 'Peito de Frango Grelhado',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6 },
    substituicoes: ['carne-bovina', 'peixe-tilapia', 'atum', 'carne-suina', 'peru'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'carne-bovina',
    nome: 'Carne Bovina Magra',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 250, proteinas: 26, carboidratos: 0, gorduras: 15 },
    substituicoes: ['frango-peito', 'carne-suina', 'peixe-salmao', 'peru', 'patinho'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'peixe-tilapia',
    nome: 'Tilápia Grelhada',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 96, proteinas: 20, carboidratos: 0, gorduras: 1.7 },
    substituicoes: ['peixe-salmao', 'atum', 'frango-peito', 'carne-bovina', 'bacalhau'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'peixe-salmao',
    nome: 'Salmão Grelhado',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 208, proteinas: 22, carboidratos: 0, gorduras: 13 },
    substituicoes: ['peixe-tilapia', 'atum', 'bacalhau', 'frango-peito', 'carne-bovina'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'carne-suina',
    nome: 'Lombo Suíno',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 242, proteinas: 27, carboidratos: 0, gorduras: 14 },
    substituicoes: ['frango-peito', 'carne-bovina', 'peru', 'peixe-salmao', 'patinho'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'atum',
    nome: 'Atum em Lata',
    categoria: 'proteina',
    porcaoPadrao: 120,
    macrosPor100g: { calorias: 116, proteinas: 26, carboidratos: 0, gorduras: 0.8 },
    substituicoes: ['peixe-tilapia', 'peixe-salmao', 'sardinha', 'frango-peito', 'bacalhau'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'peru',
    nome: 'Peito de Peru',
    categoria: 'proteina',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 135, proteinas: 30, carboidratos: 0, gorduras: 1.5 },
    substituicoes: ['frango-peito', 'carne-bovina', 'peixe-tilapia', 'atum', 'carne-suina'],
    vegano: false,
    vegetariano: false
  },
  {
    id: 'ovo',
    nome: 'Ovos',
    categoria: 'proteina',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11 },
    substituicoes: ['frango-peito', 'queijo-cottage', 'tofu', 'iogurte-grego', 'proteina-texturizada'],
    vegano: false,
    vegetariano: true
  },

  // PROTEÍNAS VEGETAIS
  {
    id: 'tofu',
    nome: 'Tofu',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 76, proteinas: 8, carboidratos: 1.9, gorduras: 4.8 },
    substituicoes: ['proteina-texturizada', 'tempeh', 'seitan', 'grao-de-bico', 'lentilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'proteina-texturizada',
    nome: 'Proteína Texturizada de Soja (PTS)',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 80,
    macrosPor100g: { calorias: 336, proteinas: 52, carboidratos: 30, gorduras: 0.5 },
    substituicoes: ['tofu', 'tempeh', 'seitan', 'grao-de-bico', 'lentilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'tempeh',
    nome: 'Tempeh',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 193, proteinas: 20, carboidratos: 9, gorduras: 11 },
    substituicoes: ['tofu', 'proteina-texturizada', 'seitan', 'grao-de-bico', 'lentilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'seitan',
    nome: 'Seitan (Carne de Glúten)',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 370, proteinas: 75, carboidratos: 14, gorduras: 1.9 },
    substituicoes: ['tofu', 'tempeh', 'proteina-texturizada', 'grao-de-bico', 'lentilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'grao-de-bico',
    nome: 'Grão de Bico',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 164, proteinas: 8.9, carboidratos: 27.4, gorduras: 2.6 },
    substituicoes: ['lentilha', 'feijao-preto', 'tofu', 'proteina-texturizada', 'ervilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'lentilha',
    nome: 'Lentilha',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 116, proteinas: 9, carboidratos: 20, gorduras: 0.4 },
    substituicoes: ['grao-de-bico', 'feijao-preto', 'tofu', 'proteina-texturizada', 'ervilha'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'feijao-preto',
    nome: 'Feijão Preto',
    categoria: 'proteina-vegetal',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 132, proteinas: 8.9, carboidratos: 23.7, gorduras: 0.5 },
    substituicoes: ['lentilha', 'grao-de-bico', 'feijao-carioca', 'ervilha', 'tofu'],
    vegano: true,
    vegetariano: true
  },

  // LEGUMES
  {
    id: 'brocolis',
    nome: 'Brócolis',
    categoria: 'legume',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 34, proteinas: 2.8, carboidratos: 7, gorduras: 0.4 },
    substituicoes: ['couve-flor', 'aspargo', 'abobrinha', 'vagem', 'cenoura'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'couve-flor',
    nome: 'Couve-flor',
    categoria: 'legume',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 25, proteinas: 1.9, carboidratos: 5, gorduras: 0.3 },
    substituicoes: ['brocolis', 'abobrinha', 'aspargo', 'vagem', 'cenoura'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'cenoura',
    nome: 'Cenoura',
    categoria: 'legume',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 41, proteinas: 0.9, carboidratos: 10, gorduras: 0.2 },
    substituicoes: ['beterraba', 'abobrinha', 'vagem', 'brocolis', 'pepino'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'abobrinha',
    nome: 'Abobrinha',
    categoria: 'legume',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 17, proteinas: 1.2, carboidratos: 3.1, gorduras: 0.3 },
    substituicoes: ['brocolis', 'couve-flor', 'berinjela', 'vagem', 'cenoura'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'vagem',
    nome: 'Vagem',
    categoria: 'legume',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 31, proteinas: 1.8, carboidratos: 7, gorduras: 0.1 },
    substituicoes: ['brocolis', 'aspargo', 'abobrinha', 'couve-flor', 'cenoura'],
    vegano: true,
    vegetariano: true
  },

  // FOLHOSOS
  {
    id: 'alface',
    nome: 'Alface',
    categoria: 'folhoso',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 15, proteinas: 1.4, carboidratos: 2.9, gorduras: 0.2 },
    substituicoes: ['rucula', 'agriao', 'espinafre', 'couve', 'acelga'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'rucula',
    nome: 'Rúcula',
    categoria: 'folhoso',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 25, proteinas: 2.6, carboidratos: 3.7, gorduras: 0.7 },
    substituicoes: ['alface', 'agriao', 'espinafre', 'couve', 'acelga'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'espinafre',
    nome: 'Espinafre',
    categoria: 'folhoso',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 23, proteinas: 2.9, carboidratos: 3.6, gorduras: 0.4 },
    substituicoes: ['couve', 'acelga', 'alface', 'rucula', 'agriao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'couve',
    nome: 'Couve',
    categoria: 'folhoso',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 49, proteinas: 4.3, carboidratos: 10, gorduras: 0.9 },
    substituicoes: ['espinafre', 'acelga', 'rucula', 'alface', 'agriao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'agriao',
    nome: 'Agrião',
    categoria: 'folhoso',
    porcaoPadrao: 50,
    macrosPor100g: { calorias: 11, proteinas: 2.3, carboidratos: 1.3, gorduras: 0.1 },
    substituicoes: ['rucula', 'alface', 'espinafre', 'couve', 'acelga'],
    vegano: true,
    vegetariano: true
  },

  // FRUTAS
  {
    id: 'banana',
    nome: 'Banana',
    categoria: 'fruta',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 89, proteinas: 1.1, carboidratos: 23, gorduras: 0.3 },
    substituicoes: ['maca', 'mamao', 'morango', 'abacaxi', 'manga'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'maca',
    nome: 'Maçã',
    categoria: 'fruta',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 52, proteinas: 0.3, carboidratos: 14, gorduras: 0.2 },
    substituicoes: ['banana', 'pera', 'morango', 'laranja', 'mamao'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'mamao',
    nome: 'Mamão',
    categoria: 'fruta',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 43, proteinas: 0.5, carboidratos: 11, gorduras: 0.3 },
    substituicoes: ['banana', 'maca', 'abacaxi', 'melancia', 'manga'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'morango',
    nome: 'Morango',
    categoria: 'fruta',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 32, proteinas: 0.7, carboidratos: 7.7, gorduras: 0.3 },
    substituicoes: ['mirtilo', 'framboesa', 'maca', 'banana', 'abacaxi'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'abacaxi',
    nome: 'Abacaxi',
    categoria: 'fruta',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 50, proteinas: 0.5, carboidratos: 13, gorduras: 0.1 },
    substituicoes: ['mamao', 'manga', 'melancia', 'banana', 'laranja'],
    vegano: true,
    vegetariano: true
  },

  // LATICÍNIOS E DERIVADOS
  {
    id: 'iogurte-grego',
    nome: 'Iogurte Grego Natural',
    categoria: 'laticinio',
    porcaoPadrao: 150,
    macrosPor100g: { calorias: 59, proteinas: 10, carboidratos: 3.6, gorduras: 0.4 },
    substituicoes: ['queijo-cottage', 'iogurte-natural', 'leite-desnatado', 'kefir', 'ricota'],
    vegano: false,
    vegetariano: true
  },
  {
    id: 'queijo-cottage',
    nome: 'Queijo Cottage',
    categoria: 'laticinio',
    porcaoPadrao: 100,
    macrosPor100g: { calorias: 98, proteinas: 11, carboidratos: 3.4, gorduras: 4.3 },
    substituicoes: ['iogurte-grego', 'ricota', 'queijo-minas', 'tofu', 'ovo'],
    vegano: false,
    vegetariano: true
  },

  // GORDURAS SAUDÁVEIS
  {
    id: 'azeite',
    nome: 'Azeite de Oliva',
    categoria: 'gordura',
    porcaoPadrao: 10,
    macrosPor100g: { calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100 },
    substituicoes: ['oleo-coco', 'abacate', 'castanhas', 'amendoim', 'amêndoas'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'abacate',
    nome: 'Abacate',
    categoria: 'gordura',
    porcaoPadrao: 70,
    macrosPor100g: { calorias: 160, proteinas: 2, carboidratos: 8.5, gorduras: 14.7 },
    substituicoes: ['azeite', 'castanhas', 'amendoim', 'oleo-coco', 'amêndoas'],
    vegano: true,
    vegetariano: true
  },
  {
    id: 'castanhas',
    nome: 'Castanhas (mix)',
    categoria: 'gordura',
    porcaoPadrao: 30,
    macrosPor100g: { calorias: 607, proteinas: 20, carboidratos: 21, gorduras: 50 },
    substituicoes: ['amendoim', 'amêndoas', 'nozes', 'abacate', 'azeite'],
    vegano: true,
    vegetariano: true
  }
]

// Função para buscar alimento por ID
export function buscarAlimento(id: string): AlimentoDatabase | undefined {
  return ALIMENTOS_DATABASE.find(a => a.id === id)
}

// Função para buscar substituições de um alimento
export function buscarSubstituicoes(alimentoId: string): AlimentoDatabase[] {
  const alimento = buscarAlimento(alimentoId)
  if (!alimento) return []

  return alimento.substituicoes
    .map(id => buscarAlimento(id))
    .filter((a): a is AlimentoDatabase => a !== undefined)
}

// Calcular macros para uma quantidade específica
export function calcularMacros(alimentoId: string, gramas: number) {
  const alimento = buscarAlimento(alimentoId)
  if (!alimento) return null

  const fator = gramas / 100
  return {
    calorias: Math.round(alimento.macrosPor100g.calorias * fator),
    proteinas: Math.round(alimento.macrosPor100g.proteinas * fator * 10) / 10,
    carboidratos: Math.round(alimento.macrosPor100g.carboidratos * fator * 10) / 10,
    gorduras: Math.round(alimento.macrosPor100g.gorduras * fator * 10) / 10
  }
}
