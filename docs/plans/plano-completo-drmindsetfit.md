# PLANO COMPLETO DE IMPLEMENTAÇÃO — DRMINDSETFIT / MINDSETFIT
**Plataforma Fitness Científica Premium de Nível Mundial**

---

## Resumo

Implementar todas as funcionalidades restantes do DrMindSetFit para transformá-lo em um produto final de nível global, seguindo rigorosamente os princípios científicos, personalização profunda e experiência premium dark UI. O app substituirá planilhas, apps genéricos e prescrições manuais.

---

## Análise do Projeto Atual

### ✅ **O que está COMPLETO e FUNCIONAL:**

1. **Onboarding científico (8 steps)** - Coleta completa de dados:
   - Step 1: Perfil (nome, sexo, idade, altura, peso, objetivo, nível, modalidade)
   - Step 2: Avaliação física (IMC, biotipo, circunferências, Pollock 7, bioimpedância)
   - Step 3: Nível de atividade física (PAL 1.2-1.725)
   - Step 4: Nutrição (estratégia, refeições, restrições)
   - Step 5: Modalidades (musculação, corrida, bike, funcional, crossfit)
   - Step 6: Dias da semana
   - Step 7: Preferências alimentares
   - Step 8: Confirmação e geração de plano ativo

2. **Motor Metabólico** (`src/engine/metabolic/MetabolicEngine.ts`):
   - ✅ Mifflin-St Jeor implementado
   - ✅ Cálculo de BMR, TDEE, Target com ajuste por objetivo
   - ❌ Faltam: Cunningham, FAO/WHO, Harris-Benedict

3. **Motor Nutricional** (`src/engine/nutrition/NutritionEngine.ts`):
   - ✅ Cálculo de macros (proteína, carbo, gordura)
   - ✅ Distribuição em 4 refeições (25/30/25/20%)
   - ✅ Validação científica (tolerância 10%)
   - ✅ Funções de export/copy
   - ❌ Falta: Sistema de substituições inteligentes automático

4. **Motor de Treino Base** (`src/engine/workout/WorkoutEngine.ts`):
   - ✅ 5 modalidades básicas
   - ✅ Divisões por nível (iniciante → avançado)
   - ❌ Falta: Biblioteca completa de exercícios com execução detalhada

5. **Bibliotecas de Dados:**
   - ✅ Ciclismo indoor completo (50+ workouts em `cycling_bike_indoor.v1.json`)
   - ✅ Musculação (~900 linhas em arquivos JSON com exercícios detalhados)
   - ❌ Falta: Integração dessas bibliotecas no fluxo de geração de planos

6. **Dashboard** (`src/pages/Dashboard.tsx`):
   - ✅ Cards de métricas (calorias, passos, carga, hora)
   - ✅ Gráficos recharts (line + bar)
   - ❌ Falta: Mais insights, evolução corporal, gráficos de composição

7. **Planos Ativos** (`src/pages/PlanosAtivos.tsx`):
   - ✅ Visualização de plano ativo (nutrição + treino)
   - ❌ Falta: Edição pós-geração, histórico de versões

8. **Exportação PDF** (`src/lib/exportar-pdf.ts`):
   - ✅ jsPDF instalado e estrutura básica criada
   - ❌ Falta: PDFs profissionais completos (nutrição, treino, evolução)

9. **GPS/Running** (`src/pages/Running.tsx`):
   - ✅ Componente existe com simulação
   - ❌ Falta: Integração real com navigator.geolocation, mapas, histórico de percursos

### ⚠️ **Arquivos LEGADOS (para remover):**
- `src/components/steps/Step5Treino.tsx` (legado)
- `src/components/steps/Step7Acompanhamento.tsx` (legado)
- `src/components/steps/Step8Relatorio.tsx` (legado)
- `src/pages/onboarding/steps/Step3GlobalPerfil.tsx` (órfão, 251 bytes)
- `src/components/onboarding/OnboardingCarouselShell.tsx` (legado)

### 🎯 **Dependências Instaladas:**
- ✅ jsPDF + jspdf-autotable (PDF generation)
- ✅ recharts (gráficos)
- ✅ leaflet + react-leaflet (mapas GPS)
- ✅ html2canvas (screenshots)
- ✅ zod (validação)
- ✅ react-hook-form (forms)

---

## Passos de Implementação

### 🏗️ **FASE 1: LIMPEZA E ESTRUTURA (1-2 dias)**

#### **Passo 1.1: Remover arquivos legados**
- [ ] Deletar `src/components/steps/Step5Treino.tsx`
- [ ] Deletar `src/components/steps/Step7Acompanhamento.tsx`
- [ ] Deletar `src/components/steps/Step8Relatorio.tsx`
- [ ] Deletar `src/pages/onboarding/steps/Step3GlobalPerfil.tsx`
- [ ] Deletar `src/components/onboarding/OnboardingCarouselShell.tsx`
- [ ] Validar: `npm run type-check && npm run build`

#### **Passo 1.2: Criar estrutura de pastas para novos módulos**
- [ ] Criar `src/engine/bodyfat/` (para composição corporal avançada)
- [ ] Criar `src/engine/metabolic/equations/` (para novas equações)
- [ ] Criar `src/engine/running/` (para planos de corrida)
- [ ] Criar `src/engine/strength/` (para musculação avançada)
- [ ] Criar `src/services/export/` (para PDFs e relatórios)
- [ ] Criar `src/services/gps/` (para GPS tracking)
- [ ] Criar `src/services/history/` (para histórico e logs)

---

### 🔬 **FASE 2: MOTORES CIENTÍFICOS AVANÇADOS (3-5 dias)**

#### **Passo 2.1: Expandir Motor Metabólico com novas equações**
**Arquivo:** `src/engine/metabolic/equations/cunningham.ts`
- [ ] Implementar equação de Cunningham (BMR baseado em massa magra):
  - Fórmula: `BMR = 500 + (22 * leanBodyMassKg)`
  - Requer massa magra do onboarding (Step 2 - bioimpedância)
- [ ] Validar com testes unitários (casos conhecidos)

**Arquivo:** `src/engine/metabolic/equations/harris-benedict.ts`
- [ ] Implementar Harris-Benedict revisada:
  - Male: `BMR = 88.362 + (13.397 × W) + (4.799 × H) - (5.677 × A)`
  - Female: `BMR = 447.593 + (9.247 × W) + (3.098 × H) - (4.330 × A)`
- [ ] Validar com casos de teste

**Arquivo:** `src/engine/metabolic/equations/fao-who.ts`
- [ ] Implementar FAO/WHO por faixas etárias:
  - 18-30 anos, 30-60 anos, >60 anos (fórmulas diferentes)
- [ ] Validar com casos de teste

**Arquivo:** `src/engine/metabolic/MetabolicEngine.ts`
- [ ] Refatorar `computeMetabolic()` para aceitar `method` como parâmetro:
  - `method: "mifflin" | "cunningham" | "harris-benedict" | "fao-who"`
- [ ] Selecionar método automaticamente baseado em dados disponíveis:
  - Se tem massa magra → Cunningham (mais preciso)
  - Senão → Mifflin-St Jeor (padrão)
- [ ] Retornar no output qual método foi usado

#### **Passo 2.2: Motor de Composição Corporal Avançado**
**Arquivo:** `src/engine/bodyfat/pollock7.ts`
- [ ] Implementar cálculo de % gordura via Pollock 7 dobras:
  - Equações separadas para homem e mulher
  - Input: 7 medidas (peitoral, axilar, tríceps, subescapular, abdômen, suprailíaca, coxa)
  - Output: % gordura, massa magra, massa gorda
- [ ] Validar com casos conhecidos

**Arquivo:** `src/engine/bodyfat/bioimpedance.ts`
- [ ] Implementar validação de dados de bioimpedância:
  - % gordura: 5-50%
  - % massa magra: 50-90%
  - % água: 45-75%
  - Idade metabólica: 18-100 anos
- [ ] Calcular massa magra e massa gorda em kg

**Arquivo:** `src/engine/bodyfat/index.ts`
- [ ] Função unificada `computeBodyComposition()`:
  - Prioridade: bioimpedância > Pollock 7 > estimativa por IMC
  - Retornar: `{ method, fatPct, leanMassKg, fatMassKg, metabolicAge? }`

#### **Passo 2.3: Ajustes Dinâmicos de Macros conforme Biotipo**
**Arquivo:** `src/engine/nutrition/NutritionEngine.ts`
- [ ] Criar função `adjustMacrosByBiotype()`:
  - Ectomorfo: +10% carbo, -5% gordura (metabolismo rápido)
  - Endomorfo: -10% carbo, +5% gordura (sensibilidade insulínica)
  - Mesomorfo: padrão
  - Misto: média ponderada
- [ ] Integrar no `computeMacros()` com flag `applyBiotypeAdjustment: boolean`
- [ ] Validar que soma calórica permanece correta

#### **Passo 2.4: Sistema de Substituições Inteligentes**
**Arquivo:** `src/engine/nutrition/substitutions.ts`
- [ ] Criar base de dados de alimentos com macros equivalentes:
  - Proteínas: frango, peixe, carne vermelha, ovos, tofu, whey
  - Carbo: arroz, batata, aveia, pão integral, frutas
  - Gorduras: azeite, abacate, castanhas, salmão
- [ ] Função `findSubstitutions(alimento: string, count: number = 3)`:
  - Retorna 3 alternativas com macros similares (±10%)
  - Respeita restrições do usuário (vegetariano, sem lactose, etc)
- [ ] Integrar no plano alimentar gerado em Step 8

---

### 🏋️ **FASE 3: TREINOS MULTIMODAIS COMPLETOS (5-7 dias)**

#### **Passo 3.1: Motor de Musculação Completo**
**Arquivo:** `src/engine/strength/StrengthEngine.ts`
- [ ] Ler biblioteca JSON existente (`src/data/training/musculacao/*.json`)
- [ ] Criar função `generateStrengthPlan()`:
  - Input: level, daysPerWeek, goal, equipment
  - Output: semana completa com exercícios detalhados
  - Divisões:
    - 2-3x/semana: Full Body
    - 4x/semana: Upper/Lower
    - 5-6x/semana: Push/Pull/Legs ou ABCDE
- [ ] Para cada exercício incluir:
  - Nome, objetivo, execução passo-a-passo, foco muscular, cues técnicos
  - Erros comuns
  - 3 variações equivalentes (obrigatório)

**Arquivo:** `src/engine/strength/progressions.ts`
- [ ] Sistema de progressão semanal:
  - Semana 1: 3x8-10 (70% 1RM estimado)
  - Semana 2: 4x8-10 (72%)
  - Semana 3: 4x6-8 (75%)
  - Semana 4: deload 3x12 (60%)
- [ ] Função `applyProgression(week: number, baseReps: number)` → new reps + load%

#### **Passo 3.2: Motor de Corrida Completo**
**Arquivo:** `src/engine/running/RunningPlansEngine.ts`
- [ ] Implementar planos progressivos para 5k, 10k, 21k, 42k:
  - Input: currentLevel, targetDistance, weeksAvailable
  - Output: semana a semana com sessões detalhadas
- [ ] Tipos de treino:
  - Rodagem leve (Z2, 60-70% FCM)
  - Tempo run (Z3-Z4, 80-85% FCM)
  - Intervalado (Z5, 90-95% FCM)
  - Longão (Z2, progressivo)
  - Recuperação (Z1, 50-60% FCM)
- [ ] Para cada sessão incluir:
  - Distância alvo ou tempo
  - Pace alvo (min/km)
  - RPE (6-10 escala Borg)
  - Instruções de aquecimento e volta à calma

**Arquivo:** `src/engine/running/paceCalculator.ts`
- [ ] Função `calculatePaces(vdot: number)`:
  - VDOT de Daniels (tabela ou fórmula)
  - Retornar paces por zona: easy, tempo, threshold, interval, repetition
- [ ] Função `estimateVDOT(recentRaceTime: number, distance: "5k"|"10k"|"21k"|"42k")`

#### **Passo 3.3: Motor de Ciclismo Avançado (já tem biblioteca)**
**Arquivo:** `src/engine/cycling/CyclingEngine.ts`
- [ ] Integrar biblioteca existente (`cycling_bike_indoor.v1.json`)
- [ ] Criar função `generateCyclingPlan()`:
  - Input: level, goal (endurance/hiit/performance), daysPerWeek
  - Output: semana com workouts da biblioteca
  - Filtrar por PSE (perceived exertion), goal, level
- [ ] Incluir para cada workout:
  - Nome, duração, intensidade, cadência, zonas de esforço
  - Steps de execução, foco, cues, erros comuns, variações

#### **Passo 3.4: Motor de CrossFit WODs**
**Arquivo:** `src/engine/crossfit/CrossFitEngine.ts`
- [ ] Criar biblioteca de WODs estruturados:
  - AMRAP (As Many Rounds As Possible)
  - EMOM (Every Minute On the Minute)
  - For Time (completar o mais rápido possível)
  - Chipper (lista longa de exercícios)
- [ ] Categorizar por intensidade (PSE 6-10)
- [ ] Incluir:
  - Skill (olímpicos, ginástica)
  - Metcon (condicionamento metabólico)
  - Strength (força)
- [ ] Função `generateCrossFitWeek()`:
  - Input: level, daysPerWeek
  - Output: variação skill+metcon, força+metcon, metcon puro, etc

#### **Passo 3.5: Motor de Funcional**
**Arquivo:** `src/engine/functional/FunctionalEngine.ts`
- [ ] Criar planos com 3 pilares:
  - Força: agachamento, empurrão, puxada, core
  - Cardio: HIIT, LISS, circuitos
  - Mobilidade: alongamento dinâmico, yoga, foam rolling
- [ ] Função `generateFunctionalWeek()`:
  - Input: level, daysPerWeek, emphasis (strength/cardio/mobility)
  - Output: sessões balanceadas
  - Alternar padrões de movimento

---

### 📱 **FASE 4: DASHBOARD EXPANDIDO E UX PREMIUM (3-4 dias)**

#### **Passo 4.1: Dashboard com Evolução Corporal**
**Arquivo:** `src/pages/Dashboard.tsx`
- [ ] Adicionar seção "Evolução Corporal":
  - Gráfico de peso (últimos 30/90 dias)
  - Gráfico de % gordura (se disponível)
  - Gráfico de medidas (cintura, braço, coxa)
- [ ] Card de "Composição Atual":
  - % gordura, massa magra, massa gorda
  - Progresso vs objetivo

#### **Passo 4.2: Insights Inteligentes**
**Arquivo:** `src/components/dashboard/InsightsCard.tsx`
- [ ] Criar sistema de insights baseado em dados:
  - "Você perdeu 2kg nas últimas 4 semanas - ótima consistência!"
  - "Sua carga semanal aumentou 15% - considere semana de deload"
  - "Você está 200 kcal abaixo da meta 3 dias seguidos - ajustar?"
- [ ] Usar ícones + cores (verde = bom, amarelo = atenção, vermelho = ação necessária)

#### **Passo 4.3: Gráficos de Performance**
**Arquivo:** `src/components/dashboard/PerformanceCharts.tsx`
- [ ] Gráfico de volume de treino (kg × reps × séries por semana)
- [ ] Gráfico de consistência (% dias treinados vs planejados)
- [ ] Gráfico de paces (corrida) - evolução temporal
- [ ] Gráfico de FTP/potência (ciclismo)

#### **Passo 4.4: Cards de Treino do Dia**
**Arquivo:** `src/components/dashboard/TodayWorkoutCard.tsx`
- [ ] Mostrar treino de hoje com:
  - Modalidade + título
  - Tempo estimado
  - Botão "Iniciar Treino" (navega para /treino-ativo)
- [ ] Se já completou, mostrar resumo (tempo, carga, RPE)

---

### 📄 **FASE 5: RELATÓRIOS E PDFs PROFISSIONAIS (3-4 dias)**

#### **Passo 5.1: PDF de Plano Nutricional**
**Arquivo:** `src/services/export/NutritionPDF.ts`
- [ ] Gerar PDF profissional com:
  - Cabeçalho DrMindSetFit (logo + branding)
  - Dados do usuário (nome, idade, peso, altura)
  - Objetivos e estratégia
  - Resumo calórico e macros (tabela)
  - Refeições detalhadas (4-6 refeições):
    - Horário, alimentos, quantidades, macros
    - Substituições para cada alimento (3 opções)
  - Observações científicas (hidratação, timing, fibras)
  - Footer com data de geração
- [ ] Usar jsPDF + jspdf-autotable
- [ ] Design dark premium (preto/cinza escuro, acentos azul/verde neon)

#### **Passo 5.2: PDF de Plano de Treino**
**Arquivo:** `src/services/export/TrainingPDF.ts`
- [ ] Gerar PDF profissional com:
  - Cabeçalho DrMindSetFit
  - Dados do usuário + modalidades
  - Semana completa (seg-dom):
    - Dia, modalidade, título da sessão
    - Exercícios com séries, reps, carga sugerida
    - Instruções de execução, cues técnicos
    - Variações equivalentes
  - Observações de progressão (semana a semana)
  - Protocolo de aquecimento e alongamento
- [ ] Layout limpo, legível, imprimível

#### **Passo 5.3: PDF de Evolução Corporal**
**Arquivo:** `src/services/export/EvolutionPDF.ts`
- [ ] Gerar PDF com:
  - Gráficos de peso, % gordura, medidas
  - Tabela de evolução (data, peso, % gordura, massa magra)
  - Fotos de progresso (se usuário adicionar)
  - Insights e conquistas
  - Comparação com metas

#### **Passo 5.4: Botões de Export em todas as telas**
- [ ] Adicionar botão "Exportar PDF" em:
  - `/planos-ativos` (tab Nutrição)
  - `/planos-ativos` (tab Treino)
  - `/dashboard` (Evolução)
  - `/historico` (Relatório completo)

---

### 🗺️ **FASE 6: GPS TRACKING REAL (2-3 dias)**

#### **Passo 6.1: Integração com Geolocation API**
**Arquivo:** `src/services/gps/GPSService.ts`
- [ ] Criar serviço GPS:
  - `startTracking()` → solicitar permissão e iniciar
  - `stopTracking()` → parar e salvar percurso
  - `getCurrentPosition()` → ponto atual
  - `watchPosition()` → monitorar em tempo real
- [ ] Calcular em tempo real:
  - Distância percorrida (haversine)
  - Tempo decorrido
  - Pace atual (min/km)
  - Pace médio
- [ ] Salvar pontos GPS (lat, lng, timestamp, altitude)

#### **Passo 6.2: Componente de Mapa Interativo**
**Arquivo:** `src/components/gps/RunningMap.tsx`
- [ ] Usar react-leaflet para mostrar mapa
- [ ] Plotar rota em tempo real (polyline)
- [ ] Marcadores: início (verde), fim (vermelho), km a km (azul)
- [ ] Controles: zoom, centralizar, fullscreen

#### **Passo 6.3: Histórico de Percursos**
**Arquivo:** `src/pages/Running.tsx`
- [ ] Refatorar para usar GPS real ao invés de simulação
- [ ] Salvar percursos em localStorage:
  - `mf:running:history` → array de corridas
  - Cada corrida: { id, date, distance, time, pace, route: [pontos GPS] }
- [ ] Tela de histórico: lista de corridas passadas
- [ ] Clicar em corrida → ver mapa + detalhes

---

### 📊 **FASE 7: HISTÓRICO E LOGS COMPLETOS (2-3 dias)**

#### **Passo 7.1: Sistema de Logs de Treino**
**Arquivo:** `src/services/history/TrainingLog.ts`
- [ ] Criar estrutura de log:
  ```typescript
  type TrainingLog = {
    id: string
    date: string
    modality: Modality
    exercises: {
      name: string
      sets: { reps: number; loadKg: number; rpe: number }[]
    }[]
    totalVolume: number // kg × reps
    duration: number // minutos
    notes: string
    rpeOverall: number
  }
  ```
- [ ] Funções:
  - `saveLog(log: TrainingLog)`
  - `getLogs(filter?: { modality, dateRange })`
  - `getVolumeHistory(weeks: number)` → array de volume por semana
  - `getConsistency(weeks: number)` → % dias treinados

#### **Passo 7.2: Sistema de Logs de Nutrição**
**Arquivo:** `src/services/history/NutritionLog.ts`
- [ ] Criar estrutura de log:
  ```typescript
  type NutritionLog = {
    id: string
    date: string
    meals: { name: string; kcal: number; P: number; C: number; F: number }[]
    totals: { kcal: number; P: number; C: number; F: number }
    target: { kcal: number; P: number; C: number; F: number }
    adherence: number // % aderência à meta
    weight?: number
  }
  ```
- [ ] Funções:
  - `saveLog(log: NutritionLog)`
  - `getLogs(dateRange)`
  - `getAdherenceHistory(weeks: number)` → array de % aderência
  - `getWeightHistory(weeks: number)` → array de peso

#### **Passo 7.3: Tela de Histórico Completo**
**Arquivo:** `src/pages/HistoryReports.tsx`
- [ ] Expandir para incluir:
  - Filtros: modalidade, período (7d/30d/90d/1ano)
  - Gráficos de volume de treino
  - Gráficos de aderência nutricional
  - Gráficos de peso e composição corporal
  - Lista de treinos passados (clicável para detalhes)
  - Lista de dias nutricionais (clicável para detalhes)
- [ ] Botão "Exportar Relatório PDF" (período selecionado)

---

### ⚙️ **FASE 8: AJUSTES PÓS-ONBOARDING E EDIÇÃO (2-3 dias)**

#### **Passo 8.1: Tela de Edição de Plano Nutricional**
**Arquivo:** `src/pages/EditDiet.tsx` (já existe, expandir)
- [ ] Permitir editar:
  - Calorias alvo
  - Distribuição de macros (sliders)
  - Refeições (adicionar/remover)
  - Alimentos por refeição (substituir, ajustar quantidade)
- [ ] Validar em tempo real (NutritionEngine.validateDietScience)
- [ ] Salvar nova versão do plano ativo
- [ ] Histórico de versões (até 5 últimas)

#### **Passo 8.2: Tela de Edição de Plano de Treino**
**Arquivo:** `src/pages/EditTraining.tsx` (criar)
- [ ] Permitir editar:
  - Dias da semana
  - Modalidade por dia
  - Exercícios (substituir por equivalente)
  - Séries, reps, carga
- [ ] Botão "Regenerar Semana" (mantém dias, regenera exercícios)
- [ ] Salvar nova versão do plano ativo

#### **Passo 8.3: Sistema de Versioning**
**Arquivo:** `src/services/plan.service.ts` (expandir)
- [ ] Salvar histórico de planos:
  - `mf:activePlan:history` → array de planos antigos
  - Manter até 10 versões
- [ ] Função `rollbackToPlan(version: number)` → restaurar plano anterior
- [ ] Mostrar em UI: "Você está na versão 3 de 5 - Ver anteriores"

---

### 🎨 **FASE 9: POLIMENTO UX PREMIUM (2-3 dias)**

#### **Passo 9.1: Animações e Transições**
**Arquivo:** `src/components/ui/transitions.tsx`
- [ ] Usar framer-motion para:
  - Fade in/out de cards
  - Slide entre steps do onboarding
  - Bounce em notificações de sucesso
  - Shimmer em loading states
- [ ] Manter performance (60fps)

#### **Passo 9.2: Dark Theme Premium Consistency**
- [ ] Revisar todas as telas para usar:
  - CSS variables do `index.css` (--background, --foreground, etc)
  - Evitar gradientes (usar cores sólidas)
  - Acentos azul/cyan/verde neon (`--neon-blue`, `--neon-green`)
  - Glows e borders sutis (`.glow-blue`, `.neon-border`)
- [ ] Testar em mobile (responsividade)

#### **Passo 9.3: Feedback Visual**
**Arquivo:** `src/components/ui/toast.tsx`
- [ ] Usar sonner (já instalado) para:
  - Sucesso: "Plano gerado com sucesso!"
  - Erro: "Erro ao salvar dados - tente novamente"
  - Info: "Lembre-se de beber água!"
- [ ] Ícones + cores consistentes

#### **Passo 9.4: Loading States**
- [ ] Adicionar skeletons em:
  - Dashboard (enquanto carrega dados)
  - Planos ativos (enquanto gera plano)
  - Histórico (enquanto processa logs)
- [ ] Usar `mf-progress` animation do `index.css`

---

### 🧪 **FASE 10: TESTES E VALIDAÇÃO CIENTÍFICA (2-3 dias)**

#### **Passo 10.1: Testes Unitários de Motores**
**Arquivo:** `src/engine/__tests__/` (criar)
- [ ] Testar MetabolicEngine:
  - Casos conhecidos (BMR, TDEE)
  - Edge cases (peso muito baixo, muito alto)
- [ ] Testar NutritionEngine:
  - Soma de macros = target kcal
  - Distribuição de refeições correta
- [ ] Testar WorkoutEngine:
  - Geração de semanas completas
  - Ordenação por dia

#### **Passo 10.2: Validação Científica Manual**
- [ ] Criar 5 perfis fictícios:
  - Ectomorfo iniciante (emagrecimento)
  - Mesomorfo intermediário (hipertrofia)
  - Endomorfo avançado (recomposição)
  - Mulher atleta (performance)
  - Homem sedentário (longevidade)
- [ ] Passar cada um pelo onboarding
- [ ] Validar cientificamente:
  - BMR condiz com equações padrão
  - Macros fazem sentido (proteína 1.6-2.2g/kg, etc)
  - Treinos progressivos e balanceados
- [ ] Documentar em `docs/validation/scientific-validation.md`

#### **Passo 10.3: Build e Type-check Verde**
- [ ] Rodar `npm run type-check` (0 erros)
- [ ] Rodar `npm run build` (sucesso)
- [ ] Rodar `npm run lint` (0 warnings críticos)

---

### 🚀 **FASE 11: FEATURES FUTURAS (Opcional, após MVP)**

#### **Passo 11.1: Integração com Wearables**
- [ ] API Strava (corrida, ciclismo)
- [ ] API Garmin
- [ ] Apple Health / Google Fit
- [ ] Sincronizar passos, calorias, treinos automaticamente

#### **Passo 11.2: Notificações Push**
- [ ] Lembrete de treino (30min antes)
- [ ] Lembrete de refeição
- [ ] Parabéns por consistência (7 dias seguidos)
- [ ] Alerta de deload necessário (carga muito alta)

#### **Passo 11.3: Social e Comunidade**
- [ ] Feed de conquistas
- [ ] Compartilhar evolução (PDF gerado)
- [ ] Challenges (30 dias correndo, etc)

#### **Passo 11.4: Backend e API**
- [ ] Migrar de localStorage para Supabase (já instalado)
- [ ] Autenticação multi-user
- [ ] Sincronização entre dispositivos
- [ ] Backup em nuvem

---

## Arquivos a Modificar/Criar

### **Arquivos a CRIAR:**

#### **Motores Científicos:**
- `src/engine/metabolic/equations/cunningham.ts` - Equação Cunningham
- `src/engine/metabolic/equations/harris-benedict.ts` - Harris-Benedict
- `src/engine/metabolic/equations/fao-who.ts` - FAO/WHO
- `src/engine/bodyfat/pollock7.ts` - Cálculo Pollock 7 dobras
- `src/engine/bodyfat/bioimpedance.ts` - Validação bioimpedância
- `src/engine/bodyfat/index.ts` - Unificador de composição corporal
- `src/engine/nutrition/substitutions.ts` - Sistema de substituições
- `src/engine/strength/StrengthEngine.ts` - Motor de musculação completo
- `src/engine/strength/progressions.ts` - Sistema de progressão
- `src/engine/running/RunningPlansEngine.ts` - Planos 5k/10k/21k/42k
- `src/engine/running/paceCalculator.ts` - Calculadora de paces
- `src/engine/cycling/CyclingEngine.ts` - Motor de ciclismo
- `src/engine/crossfit/CrossFitEngine.ts` - Motor de CrossFit WODs
- `src/engine/functional/FunctionalEngine.ts` - Motor funcional

#### **Serviços:**
- `src/services/export/NutritionPDF.ts` - PDF de nutrição
- `src/services/export/TrainingPDF.ts` - PDF de treino
- `src/services/export/EvolutionPDF.ts` - PDF de evolução
- `src/services/gps/GPSService.ts` - Serviço GPS real
- `src/services/history/TrainingLog.ts` - Logs de treino
- `src/services/history/NutritionLog.ts` - Logs de nutrição

#### **Componentes:**
- `src/components/dashboard/InsightsCard.tsx` - Insights inteligentes
- `src/components/dashboard/PerformanceCharts.tsx` - Gráficos de performance
- `src/components/dashboard/TodayWorkoutCard.tsx` - Card de treino do dia
- `src/components/gps/RunningMap.tsx` - Mapa interativo
- `src/components/ui/transitions.tsx` - Animações framer-motion

#### **Páginas:**
- `src/pages/EditTraining.tsx` - Edição de plano de treino

### **Arquivos a MODIFICAR:**

- `src/engine/metabolic/MetabolicEngine.ts` - Adicionar suporte a múltiplas equações
- `src/engine/nutrition/NutritionEngine.ts` - Adicionar ajustes por biotipo
- `src/pages/Dashboard.tsx` - Expandir com evolução e insights
- `src/pages/Running.tsx` - Substituir simulação por GPS real
- `src/pages/HistoryReports.tsx` - Expandir com logs completos
- `src/pages/EditDiet.tsx` - Melhorar edição e validação
- `src/services/plan.service.ts` - Adicionar versioning

### **Arquivos a DELETAR:**

- `src/components/steps/Step5Treino.tsx` (legado)
- `src/components/steps/Step7Acompanhamento.tsx` (legado)
- `src/components/steps/Step8Relatorio.tsx` (legado)
- `src/pages/onboarding/steps/Step3GlobalPerfil.tsx` (órfão)
- `src/components/onboarding/OnboardingCarouselShell.tsx` (legado)

---

## Critérios de Sucesso

### **Científico:**
- [ ] Todas as 4 equações metabólicas implementadas e validadas
- [ ] Cálculo de composição corporal por 3 métodos (bio, Pollock 7, IMC)
- [ ] Ajustes de macros por biotipo funcionando
- [ ] Substituições inteligentes respeitando restrições
- [ ] Progressões de treino seguindo literatura (ACSM)
- [ ] Planos de corrida baseados em VDOT de Daniels
- [ ] Cálculo de paces e zonas cientificamente correto

### **Funcional:**
- [ ] Onboarding completo gerando plano ativo personalizado
- [ ] Dashboard mostrando evolução corporal em tempo real
- [ ] PDFs profissionais exportáveis (nutrição, treino, evolução)
- [ ] GPS tracking salvando percursos reais
- [ ] Histórico de treinos e nutrição com gráficos
- [ ] Edição de planos pós-geração funcionando
- [ ] Versioning de planos (rollback possível)

### **UX Premium:**
- [ ] Dark theme consistente em todas as telas
- [ ] Animações suaves (framer-motion)
- [ ] Loading states e skeletons em todas as operações assíncronas
- [ ] Toasts informativos e coloridos (sonner)
- [ ] Responsivo mobile-first (testado em 320px-1920px)
- [ ] Sem gradientes visuais (cores sólidas com glows)

### **Técnico:**
- [ ] `npm run type-check` 0 erros
- [ ] `npm run build` sucesso
- [ ] `npm run lint` 0 warnings críticos
- [ ] Todos os arquivos legados removidos
- [ ] Código documentado (JSDoc em funções críticas)
- [ ] Estrutura de pastas organizada

### **Entrega:**
- [ ] Aplicativo pronto para produção
- [ ] Documentação científica validada (`docs/validation/`)
- [ ] Plano de testes executado (5 perfis fictícios validados)
- [ ] README atualizado com instruções completas
- [ ] Deploy em Vercel funcionando (`vercel --prod`)

---

## Notas Importantes

### **Princípios Inegociáveis:**
1. **Ciência > Motivação**: Nenhuma frase vazia, apenas dados e evidências
2. **Nenhuma menção a dores/lesões/reabilitação**: Foco em performance e saúde
3. **Build verde sempre**: Type-check e build antes de cada commit
4. **Mudanças cirúrgicas**: Não quebrar estrutura existente
5. **Mobile-first**: UI premium otimizada para celular
6. **Dados guiam decisões**: Tudo rastreável e auditável

### **Fluxo de Entrega Padrão:**
1. Implementar feature
2. Validar `npm run type-check`
3. Validar `npm run build`
4. `git add -A && git commit -m "feat(area): descrição"`
5. `git push origin main`
6. Deploy: `vercel --prod`

### **Priorização:**
- **Alta**: Motores científicos, PDFs, edição de planos
- **Média**: GPS real, histórico completo, ajustes por biotipo
- **Baixa**: Wearables, notificações, social

### **Estimativa Total:**
- **Tempo estimado**: 25-35 dias de desenvolvimento focado
- **Complexidade**: Alta (motores científicos + UX premium)
- **Risco**: Baixo (base sólida já existe, expansão incremental)

---

## Resultado Final Esperado

Um aplicativo fitness de **nível mundial** que:

✅ É **cientificamente confiável** (4 equações metabólicas, Pollock 7, bioimpedância)
✅ É **extremamente personalizado** (biotipo, composição, preferências, restrições)
✅ Tem **experiência premium** (dark UI, animações, gráficos interativos)
✅ É **escalável** (estrutura modular, versioning, histórico)
✅ É **profissional** (PDFs exportáveis, relatórios detalhados)
✅ Funciona para **iniciantes e atletas** (progressões adaptativas)
✅ É **referência global** em fitness digital

---

**Este plano será executado fase por fase, mantendo o build verde e validando cientificamente cada implementação.**
