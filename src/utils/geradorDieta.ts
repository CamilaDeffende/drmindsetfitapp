 
import { ALIMENTOS_TACO, type Alimento } from '@/data/alimentos-taco'
import type { PlanejamentoNutricional, Macronutrientes, Refeicao, AlimentoRefeicao, EstrategiaNutricional, Restricao, TipoRefeicao } from '@/types'

interface DadosUsuario {
  peso: number
  caloriasAlvo: number
  estrategia: EstrategiaNutricional
  restricoes: Restricao[]
  numeroRefeicoes: number
}

// Planos de refeições por número de refeições
const HORARIOS_REFEICOES: Record<number, Array<{ hora: string; nome: string }>> = {
  3: [
    { hora: '08:00', nome: 'Café da Manhã' },
    { hora: '13:00', nome: 'Almoço' },
    { hora: '20:00', nome: 'Jantar' }
  ],
  4: [
    { hora: '08:00', nome: 'Café da Manhã' },
    { hora: '12:30', nome: 'Almoço' },
    { hora: '16:00', nome: 'Lanche da Tarde' },
    { hora: '20:00', nome: 'Jantar' }
  ],
  5: [
    { hora: '07:00', nome: 'Café da Manhã' },
    { hora: '10:00', nome: 'Lanche da Manhã' },
    { hora: '13:00', nome: 'Almoço' },
    { hora: '16:30', nome: 'Lanche da Tarde' },
    { hora: '20:00', nome: 'Jantar' }
  ],
  6: [
    { hora: '07:00', nome: 'Café da Manhã' },
    { hora: '10:00', nome: 'Lanche da Manhã' },
    { hora: '13:00', nome: 'Almoço' },
    { hora: '16:00', nome: 'Lanche da Tarde' },
    { hora: '19:30', nome: 'Jantar' },
    { hora: '22:00', nome: 'Ceia' }
  ]
}

function calcularMacros(dados: DadosUsuario): Macronutrientes {
  // Ajuste calórico baseado na estratégia
  let calorias = dados.caloriasAlvo
  if (dados.estrategia === 'deficit-leve') calorias = dados.caloriasAlvo * 0.9
  if (dados.estrategia === 'deficit-moderado') calorias = dados.caloriasAlvo * 0.8
  if (dados.estrategia === 'deficit-agressivo') calorias = dados.caloriasAlvo * 0.75
  if (dados.estrategia === 'superavit') calorias = dados.caloriasAlvo * 1.15

  // Macronutrientes
  const proteina = Math.round(dados.peso * 2.2) // 2.2g/kg
  const gorduras = Math.round(dados.peso * 1) // 1g/kg
  const caloriasRestantes = calorias - (proteina * 4 + gorduras * 9)
  const carboidratos = Math.round(caloriasRestantes / 4)

  return {
    proteina,
    gorduras,
    carboidratos,
    calorias: Math.round(calorias)
  }
}

function filtrarAlimentosPorRestricoes(restricoes: Restricao[]): Alimento[] {
  let alimentosFiltrados = [...ALIMENTOS_TACO]

  if (restricoes.includes('lactose')) {
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['iogurte_grego', 'iogurte_desnatado', 'queijo_cottage', 'queijo_minas', 'leite_desnatado', 'requeijao_light'].includes(a.id)
    )
  }

  if (restricoes.includes('gluten')) {
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['pao_integral', 'macarrao_integral'].includes(a.id)
    )
  }

  if (restricoes.includes('ovo')) {
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['ovo_inteiro', 'clara_ovo'].includes(a.id)
    )
  }

  if (restricoes.includes('oleaginosas')) {
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['castanha_caju', 'castanha_para', 'amendoim', 'pasta_amendoim', 'nozes', 'amêndoas'].includes(a.id)
    )
  }

  if (restricoes.includes('vegetariano') || restricoes.includes('vegano')) {
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['frango_peito', 'frango_coxa', 'carne_patinho', 'carne_alcatra', 'carne_file_mignon',
        'tilapia', 'salmao', 'atum_conserva', 'sardinha', 'peito_peru', 'ovo_inteiro'].includes(a.id)
    )
  }

  if (restricoes.includes('vegano')) {
    alimentosFiltrados = alimentosFiltrados.filter(a => a.categoria !== 'proteina' || a.id.startsWith('whey') === false)
    alimentosFiltrados = alimentosFiltrados.filter(a =>
      !['iogurte_grego', 'iogurte_desnatado', 'queijo_cottage', 'queijo_minas', 'leite_desnatado', 'requeijao_light'].includes(a.id)
    )
  }

  return alimentosFiltrados
}

function criarAlimentoRefeicao(alimento: Alimento, gramas: number): AlimentoRefeicao {
  const fator = gramas / 100
  return {
    alimentoId: alimento.id,
    nome: alimento.nome,
    gramas,
    calorias: Math.round(alimento.calorias * fator),
    proteinas: Math.round(alimento.proteinas * fator * 10) / 10,
    carboidratos: Math.round(alimento.carboidratos * fator * 10) / 10,
    gorduras: Math.round(alimento.gorduras * fator * 10) / 10
  }
}

export function gerarDietaPersonalizada(dados: DadosUsuario): PlanejamentoNutricional {
  const macros = calcularMacros(dados)
  const alimentosDisponiveis = filtrarAlimentosPorRestricoes(dados.restricoes)
  const horas = HORARIOS_REFEICOES[dados.numeroRefeicoes]

  const refeicoes: Refeicao[] = []

  horas.forEach((horario) => {
    const alimentos: AlimentoRefeicao[] = []

    // Lógica para cada tipo de refeição
    if (horario.nome.includes('Café')) {
      // Café da manhã
      const aveia = alimentosDisponiveis.find(a => a.id === 'aveia')
      const banana = alimentosDisponiveis.find(a => a.id === 'banana')
      const whey = alimentosDisponiveis.find(a => a.id === 'whey_protein')
      const pasta = alimentosDisponiveis.find(a => a.id === 'pasta_amendoim')

      if (aveia) {
        const gramasAveia = 50
        alimentos.push(criarAlimentoRefeicao(aveia, gramasAveia))
      }

      if (banana) {
        const gramasBanana = 100
        alimentos.push(criarAlimentoRefeicao(banana, gramasBanana))
      }

      if (whey) {
        const gramasWhey = 30
        alimentos.push(criarAlimentoRefeicao(whey, gramasWhey))
      }

      if (pasta) {
        const gramasPasta = 15
        alimentos.push(criarAlimentoRefeicao(pasta, gramasPasta))
      }

    } else if (horario.nome.includes('Almoço') || horario.nome.includes('Jantar')) {
      // Refeições principais
      const arroz = alimentosDisponiveis.find(a => a.id === 'arroz_integral')
      const feijao = alimentosDisponiveis.find(a => a.id === 'feijao_carioca')
      const frango = alimentosDisponiveis.find(a => a.id === 'frango_peito')
      const brocolis = alimentosDisponiveis.find(a => a.id === 'brocolis')
      const azeite = alimentosDisponiveis.find(a => a.id === 'azeite')

      if (arroz) {
        const gramasArroz = 150
        alimentos.push(criarAlimentoRefeicao(arroz, gramasArroz))
      }

      if (feijao) {
        const gramasFeijao = 100
        alimentos.push(criarAlimentoRefeicao(feijao, gramasFeijao))
      }

      if (frango) {
        const gramasFrango = 150
        alimentos.push(criarAlimentoRefeicao(frango, gramasFrango))
      }

      if (brocolis) {
        const gramasBrocolis = 100
        alimentos.push(criarAlimentoRefeicao(brocolis, gramasBrocolis))
      }

      if (azeite) {
        const gramasAzeite = 10
        alimentos.push(criarAlimentoRefeicao(azeite, gramasAzeite))
      }

    } else {
      // Lanches
      const iogurte = alimentosDisponiveis.find(a => a.id === 'iogurte_grego')
      const fruta = alimentosDisponiveis.find(a => a.id === 'morango')
      const castanha = alimentosDisponiveis.find(a => a.id === 'castanha_caju')

      if (iogurte) {
        const gramasIogurte = 200
        alimentos.push(criarAlimentoRefeicao(iogurte, gramasIogurte))
      }

      if (fruta) {
        const gramasFruta = 150
        alimentos.push(criarAlimentoRefeicao(fruta, gramasFruta))
      }

      if (castanha) {
        const gramasCastanha = 30
        alimentos.push(criarAlimentoRefeicao(castanha, gramasCastanha))
      }
    }

    refeicoes.push({
      tipo: (horario.nome.includes('Café') ? 'cafe-da-manha' :
             horario.nome.includes('Almoço') ? 'almoco' :
             horario.nome.includes('Lanche') ? 'lanche-tarde' :
             horario.nome.includes('Jantar') ? 'jantar' : 'ceia') as TipoRefeicao,
      horario: horario.hora,
      nome: horario.nome,
      alimentos
    })
  })

  return {
    estrategia: dados.estrategia,
    restricoes: dados.restricoes,
    macros,
    refeicoesSelecionadas: horas.map(h =>
      (h.nome.includes('Café') ? 'cafe-da-manha' :
       h.nome.includes('Almoço') ? 'almoco' :
       h.nome.includes('Lanche') ? 'lanche-tarde' :
       h.nome.includes('Jantar') ? 'jantar' : 'ceia') as TipoRefeicao
    ),
    refeicoes
  }
}
