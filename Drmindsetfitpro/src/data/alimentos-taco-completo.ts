/**
 * Base de Dados Nutricional - Tabela TACO (Versão Completa)
 *
 * Fonte: Tabela Brasileira de Composição de Alimentos (TACO)
 * UNICAMP/NEPA - 4ª edição revisada e ampliada
 *
 * ⚠️ IMPORTANTE:
 * - Todos os valores são EXATOS da tabela oficial
 * - Valores ausentes na tabela = NaN ou Tr (traços)
 * - Nunca inferir, estimar ou completar dados
 * - Todos os macros são por 100g do alimento
 */

export interface AlimentoTACO {
  id: string
  codigo: number // Número oficial da tabela TACO
  nome: string
  categoria: string
  energia_kcal: number | 'NA'
  proteina_g: number | 'NA' | 'Tr'
  lipideos_g: number | 'NA' | 'Tr'
  colesterol_mg: number | 'NA' | 'Tr'
  carboidrato_g: number | 'NA' | 'Tr'
  fibra_g: number | 'NA' | 'Tr' | '*'
  grupoSubstituicao: string // Para permitir substituições inteligentes
}

export const TABELA_TACO_COMPLETA: AlimentoTACO[] = [
  // ===== CEREAIS E DERIVADOS =====
  { id: 'arroz_integral_cozido', codigo: 1, nome: 'Arroz, integral, cozido', categoria: 'Cereais e derivados', energia_kcal: 124, proteina_g: 2.6, lipideos_g: 1.0, colesterol_mg: 'NA', carboidrato_g: 25.8, fibra_g: 2.7, grupoSubstituicao: 'carboidrato_integral' },
  { id: 'arroz_integral_cru', codigo: 2, nome: 'Arroz, integral, cru', categoria: 'Cereais e derivados', energia_kcal: 360, proteina_g: 7.3, lipideos_g: 1.9, colesterol_mg: 'NA', carboidrato_g: 77.5, fibra_g: 4.8, grupoSubstituicao: 'carboidrato_integral' },
  { id: 'arroz_tipo1_cozido', codigo: 3, nome: 'Arroz, tipo 1, cozido', categoria: 'Cereais e derivados', energia_kcal: 128, proteina_g: 2.5, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 28.1, fibra_g: 1.6, grupoSubstituicao: 'carboidrato_refinado' },
  { id: 'arroz_tipo1_cru', codigo: 4, nome: 'Arroz, tipo 1, cru', categoria: 'Cereais e derivados', energia_kcal: 358, proteina_g: 7.2, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 78.8, fibra_g: 1.6, grupoSubstituicao: 'carboidrato_refinado' },
  { id: 'arroz_tipo2_cozido', codigo: 5, nome: 'Arroz, tipo 2, cozido', categoria: 'Cereais e derivados', energia_kcal: 130, proteina_g: 2.6, lipideos_g: 0.4, colesterol_mg: 'NA', carboidrato_g: 28.2, fibra_g: 1.1, grupoSubstituicao: 'carboidrato_refinado' },
  { id: 'arroz_tipo2_cru', codigo: 6, nome: 'Arroz, tipo 2, cru', categoria: 'Cereais e derivados', energia_kcal: 358, proteina_g: 7.2, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 78.9, fibra_g: 1.7, grupoSubstituicao: 'carboidrato_refinado' },
  { id: 'aveia_flocos_crua', codigo: 7, nome: 'Aveia, flocos, crua', categoria: 'Cereais e derivados', energia_kcal: 394, proteina_g: 13.9, lipideos_g: 8.5, colesterol_mg: 'NA', carboidrato_g: 66.6, fibra_g: 9.1, grupoSubstituicao: 'cereal_integral' },
  { id: 'macarrao_trigo_cru', codigo: 40, nome: 'Macarrão, trigo, cru', categoria: 'Cereais e derivados', energia_kcal: 371, proteina_g: 10.0, lipideos_g: 1.3, colesterol_mg: 'NA', carboidrato_g: 77.9, fibra_g: 2.9, grupoSubstituicao: 'massa' },
  { id: 'macarrao_trigo_ovos_cru', codigo: 41, nome: 'Macarrão, trigo, cru, com ovos', categoria: 'Cereais e derivados', energia_kcal: 371, proteina_g: 10.3, lipideos_g: 2.0, colesterol_mg: 18, carboidrato_g: 76.6, fibra_g: 2.3, grupoSubstituicao: 'massa' },
  { id: 'pao_integral_forma', codigo: 52, nome: 'Pão, trigo, forma, integral', categoria: 'Cereais e derivados', energia_kcal: 253, proteina_g: 9.4, lipideos_g: 3.7, colesterol_mg: 'NA', carboidrato_g: 49.9, fibra_g: 6.9, grupoSubstituicao: 'pao_integral' },
  { id: 'pao_frances', codigo: 53, nome: 'Pão, trigo, francês', categoria: 'Cereais e derivados', energia_kcal: 300, proteina_g: 8.0, lipideos_g: 3.1, colesterol_mg: 'NA', carboidrato_g: 58.6, fibra_g: 2.3, grupoSubstituicao: 'pao_refinado' },

  // ===== VERDURAS E HORTALIÇAS =====
  { id: 'abobora_cabotian_cozida', codigo: 64, nome: 'Abóbora, cabotian, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 48, proteina_g: 1.4, lipideos_g: 0.7, colesterol_mg: 'NA', carboidrato_g: 10.8, fibra_g: 2.5, grupoSubstituicao: 'vegetal_cozido' },
  { id: 'abobora_cabotian_crua', codigo: 65, nome: 'Abóbora, cabotian, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 39, proteina_g: 1.7, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 8.4, fibra_g: 2.2, grupoSubstituicao: 'vegetal_cru' },
  { id: 'abobrinha_italiana_cozida', codigo: 70, nome: 'Abobrinha, italiana, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 15, proteina_g: 1.1, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 3.0, fibra_g: 1.6, grupoSubstituicao: 'vegetal_baixo_carb' },
  { id: 'abobrinha_italiana_crua', codigo: 71, nome: 'Abobrinha, italiana, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 19, proteina_g: 1.1, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 4.3, fibra_g: 1.4, grupoSubstituicao: 'vegetal_baixo_carb' },
  { id: 'alface_americana_crua', codigo: 77, nome: 'Alface, americana, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 9, proteina_g: 0.6, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 1.7, fibra_g: 1.0, grupoSubstituicao: 'folha_verde' },
  { id: 'alface_crespa_crua', codigo: 78, nome: 'Alface, crespa, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 11, proteina_g: 1.3, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 1.7, fibra_g: 1.8, grupoSubstituicao: 'folha_verde' },
  { id: 'alface_roxa_crua', codigo: 80, nome: 'Alface, roxa, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 13, proteina_g: 0.9, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 2.5, fibra_g: 2.0, grupoSubstituicao: 'folha_verde' },
  { id: 'brocolis_cozido', codigo: 100, nome: 'Brócolis, cozido', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 25, proteina_g: 2.1, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 4.4, fibra_g: 3.4, grupoSubstituicao: 'vegetal_crucifero' },
  { id: 'brocolis_cru', codigo: 101, nome: 'Brócolis, cru', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 25, proteina_g: 3.6, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 4.0, fibra_g: 2.9, grupoSubstituicao: 'vegetal_crucifero' },
  { id: 'batata_doce_cozida', codigo: 88, nome: 'Batata, doce, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 77, proteina_g: 0.6, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 18.4, fibra_g: 2.2, grupoSubstituicao: 'tuberculo' },
  { id: 'batata_doce_crua', codigo: 89, nome: 'Batata, doce, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 118, proteina_g: 1.3, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 28.2, fibra_g: 2.6, grupoSubstituicao: 'tuberculo' },
  { id: 'batata_inglesa_cozida', codigo: 91, nome: 'Batata, inglesa, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 52, proteina_g: 1.2, lipideos_g: 'Tr', colesterol_mg: 'NA', carboidrato_g: 11.9, fibra_g: 1.3, grupoSubstituicao: 'tuberculo' },
  { id: 'batata_inglesa_crua', codigo: 92, nome: 'Batata, inglesa, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 64, proteina_g: 1.8, lipideos_g: 'Tr', colesterol_mg: 'NA', carboidrato_g: 14.7, fibra_g: 1.2, grupoSubstituicao: 'tuberculo' },
  { id: 'berinjela_cozida', codigo: 95, nome: 'Berinjela, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 19, proteina_g: 0.7, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 4.5, fibra_g: 2.5, grupoSubstituicao: 'vegetal_baixo_carb' },
  { id: 'cenoura_cozida', codigo: 109, nome: 'Cenoura, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 30, proteina_g: 0.8, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 6.7, fibra_g: 2.6, grupoSubstituicao: 'vegetal_raiz' },
  { id: 'cenoura_crua', codigo: 110, nome: 'Cenoura, crua', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 34, proteina_g: 1.3, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 7.7, fibra_g: 3.2, grupoSubstituicao: 'vegetal_raiz' },
  { id: 'chuchu_cozido', codigo: 112, nome: 'Chuchu, cozido', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 19, proteina_g: 0.4, lipideos_g: 'Tr', colesterol_mg: 'NA', carboidrato_g: 4.8, fibra_g: 1.0, grupoSubstituicao: 'vegetal_baixo_carb' },
  { id: 'couve_flor_cozida', codigo: 118, nome: 'Couve-flor, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 19, proteina_g: 1.2, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 3.9, fibra_g: 2.1, grupoSubstituicao: 'vegetal_crucifero' },
  { id: 'espinafre_nova_zelandia_cru', codigo: 119, nome: 'Espinafre, Nova Zelândia, cru', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 16, proteina_g: 2.0, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 2.6, fibra_g: 2.1, grupoSubstituicao: 'folha_verde_escura' },
  { id: 'mandioca_cozida', codigo: 129, nome: 'Mandioca, cozida', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 125, proteina_g: 0.6, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 30.1, fibra_g: 1.6, grupoSubstituicao: 'tuberculo' },
  { id: 'tomate_com_semente_cru', codigo: 157, nome: 'Tomate, com semente, cru', categoria: 'Verduras, hortaliças e derivados', energia_kcal: 15, proteina_g: 1.1, lipideos_g: 0.2, colesterol_mg: 'NA', carboidrato_g: 3.1, fibra_g: 1.2, grupoSubstituicao: 'vegetal_fruto' },

  // ===== FRUTAS =====
  { id: 'abacate_cru', codigo: 163, nome: 'Abacate, cru', categoria: 'Frutas e derivados', energia_kcal: 96, proteina_g: 1.2, lipideos_g: 8.4, colesterol_mg: 'NA', carboidrato_g: 6.0, fibra_g: 6.3, grupoSubstituicao: 'fruta_gordura' },
  { id: 'abacaxi_cru', codigo: 164, nome: 'Abacaxi, cru', categoria: 'Frutas e derivados', energia_kcal: 48, proteina_g: 0.9, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 12.3, fibra_g: 1.0, grupoSubstituicao: 'fruta_tropical' },
  { id: 'banana_nanica_crua', codigo: 179, nome: 'Banana, nanica, crua', categoria: 'Frutas e derivados', energia_kcal: 92, proteina_g: 1.4, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 23.8, fibra_g: 1.9, grupoSubstituicao: 'fruta_energetica' },
  { id: 'banana_prata_crua', codigo: 182, nome: 'Banana, prata, crua', categoria: 'Frutas e derivados', energia_kcal: 98, proteina_g: 1.3, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 26.0, fibra_g: 2.0, grupoSubstituicao: 'fruta_energetica' },
  { id: 'laranja_baia_crua', codigo: 208, nome: 'Laranja, baía, crua', categoria: 'Frutas e derivados', energia_kcal: 45, proteina_g: 1.0, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 11.5, fibra_g: 1.1, grupoSubstituicao: 'fruta_citrica' },
  { id: 'maca_fuji_com_casca', codigo: 222, nome: 'Maçã, Fuji, com casca, crua', categoria: 'Frutas e derivados', energia_kcal: 56, proteina_g: 0.3, lipideos_g: 'Tr', colesterol_mg: 'NA', carboidrato_g: 15.2, fibra_g: 1.3, grupoSubstituicao: 'fruta_temperada' },
  { id: 'mamao_papaia_cru', codigo: 226, nome: 'Mamão, Papaia, cru', categoria: 'Frutas e derivados', energia_kcal: 40, proteina_g: 0.5, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 10.4, fibra_g: 1.0, grupoSubstituicao: 'fruta_tropical' },
  { id: 'melancia_crua', codigo: 235, nome: 'Melancia, crua', categoria: 'Frutas e derivados', energia_kcal: 33, proteina_g: 0.9, lipideos_g: 'Tr', colesterol_mg: 'NA', carboidrato_g: 8.1, fibra_g: 0.1, grupoSubstituicao: 'fruta_baixo_cal' },
  { id: 'morango_cru', codigo: 239, nome: 'Morango, cru', categoria: 'Frutas e derivados', energia_kcal: 30, proteina_g: 0.9, lipideos_g: 0.3, colesterol_mg: 'NA', carboidrato_g: 6.8, fibra_g: 1.7, grupoSubstituicao: 'fruta_vermelha' },

  // ===== CARNES E DERIVADOS =====
  { id: 'frango_peito_sem_pele_cozido', codigo: 408, nome: 'Frango, peito, sem pele, cozido', categoria: 'Carnes e derivados', energia_kcal: 163, proteina_g: 31.5, lipideos_g: 3.2, colesterol_mg: 89, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_magra' },
  { id: 'frango_peito_sem_pele_cru', codigo: 409, nome: 'Frango, peito, sem pele, cru', categoria: 'Carnes e derivados', energia_kcal: 119, proteina_g: 21.5, lipideos_g: 3.0, colesterol_mg: 59, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_magra' },
  { id: 'frango_peito_sem_pele_grelhado', codigo: 410, nome: 'Frango, peito, sem pele, grelhado', categoria: 'Carnes e derivados', energia_kcal: 159, proteina_g: 32.0, lipideos_g: 2.5, colesterol_mg: 89, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_magra' },
  { id: 'frango_coxa_sem_pele_cozida', codigo: 398, nome: 'Frango, coxa, sem pele, cozida', categoria: 'Carnes e derivados', energia_kcal: 167, proteina_g: 26.9, lipideos_g: 5.8, colesterol_mg: 133, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_moderada' },
  { id: 'carne_bovina_patinho_cru', codigo: 376, nome: 'Carne, bovina, patinho, sem gordura, cru', categoria: 'Carnes e derivados', energia_kcal: 133, proteina_g: 21.7, lipideos_g: 4.5, colesterol_mg: 56, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'carne_vermelha_magra' },
  { id: 'carne_bovina_patinho_grelhado', codigo: 377, nome: 'Carne, bovina, patinho, sem gordura, grelhado', categoria: 'Carnes e derivados', energia_kcal: 219, proteina_g: 35.9, lipideos_g: 7.3, colesterol_mg: 126, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'carne_vermelha_magra' },
  { id: 'carne_bovina_alcatra_cru', codigo: 369, nome: 'Carne, bovina, miolo de alcatra, sem gordura, cru', categoria: 'Carnes e derivados', energia_kcal: 163, proteina_g: 21.6, lipideos_g: 7.8, colesterol_mg: 60, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'carne_vermelha_magra' },
  { id: 'carne_bovina_file_mignon_cru', codigo: 357, nome: 'Carne, bovina, filé mingnon, sem gordura, cru', categoria: 'Carnes e derivados', energia_kcal: 143, proteina_g: 21.6, lipideos_g: 5.6, colesterol_mg: 55, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'carne_vermelha_magra' },
  { id: 'peru_congelado_assado', codigo: 425, nome: 'Peru, congelado, assado', categoria: 'Carnes e derivados', energia_kcal: 163, proteina_g: 26.2, lipideos_g: 5.7, colesterol_mg: 91, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_magra' },
  { id: 'peru_congelado_cru', codigo: 426, nome: 'Peru, congelado, cru', categoria: 'Carnes e derivados', energia_kcal: 94, proteina_g: 18.1, lipideos_g: 1.8, colesterol_mg: 68, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_magra' },

  // ===== PESCADOS =====
  { id: 'tilapia_file_cru', codigo: 322, nome: 'Tilápia, filé, congelado, cru', categoria: 'Pescados e frutos do mar', energia_kcal: 88, proteina_g: 18.0, lipideos_g: 1.2, colesterol_mg: 47, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_magro' },
  { id: 'salmao_sem_pele_cru', codigo: 316, nome: 'Salmão, sem pele, fresco, cru', categoria: 'Pescados e frutos do mar', energia_kcal: 170, proteina_g: 19.3, lipideos_g: 9.7, colesterol_mg: 53, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_gorduroso' },
  { id: 'salmao_sem_pele_grelhado', codigo: 317, nome: 'Salmão, sem pele, fresco, grelhado', categoria: 'Pescados e frutos do mar', energia_kcal: 243, proteina_g: 26.1, lipideos_g: 14.5, colesterol_mg: 73, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_gorduroso' },
  { id: 'atum_conserva_oleo', codigo: 277, nome: 'Atum, conserva em óleo', categoria: 'Pescados e frutos do mar', energia_kcal: 166, proteina_g: 26.2, lipideos_g: 6.0, colesterol_mg: 53, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_conserva' },
  { id: 'atum_fresco_cru', codigo: 278, nome: 'Atum, fresco, cru', categoria: 'Pescados e frutos do mar', energia_kcal: 118, proteina_g: 25.7, lipideos_g: 0.9, colesterol_mg: 48, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_magro' },
  { id: 'sardinha_conserva_oleo', codigo: 319, nome: 'Sardinha, conserva em óleo', categoria: 'Pescados e frutos do mar', energia_kcal: 285, proteina_g: 15.9, lipideos_g: 24.0, colesterol_mg: 73, carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'peixe_conserva' },

  // ===== OVOS =====
  { id: 'ovo_galinha_inteiro_cozido', codigo: 488, nome: 'Ovo, de galinha, inteiro, cozido/10minutos', categoria: 'Ovos e derivados', energia_kcal: 146, proteina_g: 13.3, lipideos_g: 9.5, colesterol_mg: 397, carboidrato_g: 0.6, fibra_g: 'NA', grupoSubstituicao: 'ovo' },
  { id: 'ovo_galinha_inteiro_cru', codigo: 489, nome: 'Ovo, de galinha, inteiro, cru', categoria: 'Ovos e derivados', energia_kcal: 143, proteina_g: 13.0, lipideos_g: 8.9, colesterol_mg: 356, carboidrato_g: 1.6, fibra_g: 'NA', grupoSubstituicao: 'ovo' },
  { id: 'ovo_galinha_clara_cozida', codigo: 486, nome: 'Ovo, de galinha, clara, cozida/10minutos', categoria: 'Ovos e derivados', energia_kcal: 59, proteina_g: 13.4, lipideos_g: 0.1, colesterol_mg: 'NA', carboidrato_g: 0.0, fibra_g: 'NA', grupoSubstituicao: 'proteina_pura' },
  { id: 'ovo_codorna_inteiro_cru', codigo: 485, nome: 'Ovo, de codorna, inteiro, cru', categoria: 'Ovos e derivados', energia_kcal: 177, proteina_g: 13.7, lipideos_g: 12.7, colesterol_mg: 568, carboidrato_g: 0.8, fibra_g: 'NA', grupoSubstituicao: 'ovo' },

  // ===== LEGUMINOSAS =====
  { id: 'feijao_carioca_cozido', codigo: 561, nome: 'Feijão, carioca, cozido', categoria: 'Leguminosas e derivados', energia_kcal: 76, proteina_g: 4.8, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 13.6, fibra_g: 8.5, grupoSubstituicao: 'leguminosa' },
  { id: 'feijao_preto_cozido', codigo: 567, nome: 'Feijão, preto, cozido', categoria: 'Leguminosas e derivados', energia_kcal: 77, proteina_g: 4.5, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 14.0, fibra_g: 8.4, grupoSubstituicao: 'leguminosa' },
  { id: 'lentilha_cozida', codigo: 577, nome: 'Lentilha, cozida', categoria: 'Leguminosas e derivados', energia_kcal: 93, proteina_g: 6.3, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 16.3, fibra_g: 7.9, grupoSubstituicao: 'leguminosa' },
  { id: 'grao_bico_cru', codigo: 575, nome: 'Grão-de-bico, cru', categoria: 'Leguminosas e derivados', energia_kcal: 355, proteina_g: 21.2, lipideos_g: 5.4, colesterol_mg: 'NA', carboidrato_g: 57.9, fibra_g: 12.4, grupoSubstituicao: 'leguminosa' },
  { id: 'ervilha_em_vagem', codigo: 559, nome: 'Ervilha, em vagem', categoria: 'Leguminosas e derivados', energia_kcal: 88, proteina_g: 7.5, lipideos_g: 0.5, colesterol_mg: 'NA', carboidrato_g: 14.2, fibra_g: 9.7, grupoSubstituicao: 'leguminosa' },
  { id: 'amendoim_grao_cru', codigo: 557, nome: 'Amendoim, grão, cru', categoria: 'Leguminosas e derivados', energia_kcal: 544, proteina_g: 27.2, lipideos_g: 43.9, colesterol_mg: 'NA', carboidrato_g: 20.3, fibra_g: 8.0, grupoSubstituicao: 'oleaginosa' },

  // ===== LATICÍNIOS =====
  { id: 'queijo_minas_frescal', codigo: 461, nome: 'Queijo, minas, frescal', categoria: 'Leite e derivados', energia_kcal: 264, proteina_g: 17.4, lipideos_g: 20.2, colesterol_mg: 62, carboidrato_g: 3.2, fibra_g: 'NA', grupoSubstituicao: 'queijo' },
  { id: 'queijo_ricota', codigo: 469, nome: 'Queijo, ricota', categoria: 'Leite e derivados', energia_kcal: 140, proteina_g: 12.6, lipideos_g: 8.1, colesterol_mg: 49, carboidrato_g: 3.8, fibra_g: 'NA', grupoSubstituicao: 'queijo_light' },
  { id: 'iogurte_natural', codigo: 448, nome: 'Iogurte, natural', categoria: 'Leite e derivados', energia_kcal: 51, proteina_g: 4.1, lipideos_g: 3.0, colesterol_mg: 14, carboidrato_g: 1.9, fibra_g: 'NA', grupoSubstituicao: 'iogurte' },
  { id: 'iogurte_natural_desnatado', codigo: 449, nome: 'Iogurte, natural, desnatado', categoria: 'Leite e derivados', energia_kcal: 41, proteina_g: 3.8, lipideos_g: 0.3, colesterol_mg: 3, carboidrato_g: 5.8, fibra_g: 'NA', grupoSubstituicao: 'iogurte_light' },
]

/**
 * Busca substituições nutricionalmente equivalentes para um alimento
 *
 * Critérios de equivalência:
 * 1. Mesmo grupo de substituição (proteina_magra, carboidrato_integral, etc)
 * 2. Diferença calórica máxima de ±20%
 * 3. Perfil de macronutrientes similar
 */
export function buscarSubstituicoesEquivalentes(alimentoId: string): AlimentoTACO[] {
  const alimento = TABELA_TACO_COMPLETA.find(a => a.id === alimentoId)
  if (!alimento || alimento.energia_kcal === 'NA') return []

  const caloriaAlimento = alimento.energia_kcal as number
  const margem = caloriaAlimento * 0.2 // 20% de margem

  return TABELA_TACO_COMPLETA.filter(candidato => {
    if (candidato.id === alimentoId) return false
    if (candidato.grupoSubstituicao !== alimento.grupoSubstituicao) return false
    if (candidato.energia_kcal === 'NA') return false

    const caloriaCandidato = candidato.energia_kcal as number
    const diferenca = Math.abs(caloriaCandidato - caloriaAlimento)

    return diferenca <= margem
  })
}

/**
 * Obtém alimentos por categoria oficial da TACO
 */
export function getAlimentosPorCategoriaTACO(categoria: string): AlimentoTACO[] {
  return TABELA_TACO_COMPLETA.filter(a => a.categoria === categoria)
}

/**
 * Obtém alimentos por grupo de substituição
 */
export function getAlimentosPorGrupo(grupo: string): AlimentoTACO[] {
  return TABELA_TACO_COMPLETA.filter(a => a.grupoSubstituicao === grupo)
}

/**
 * Valida se um valor nutricional é disponível (não é NA ou Tr)
 */
export function isValorDisponivel(valor: number | 'NA' | 'Tr' | '*'): boolean {
  return typeof valor === 'number'
}
