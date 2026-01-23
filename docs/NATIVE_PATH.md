# MindsetFit — Caminho Nativo (Futuro) • Estratégia rápida e premium

Este app hoje é **Vite + React + TypeScript (PWA)**. A PWA já entrega experiência “app-like”, mas há limites reais quando o produto precisa de **Corrida PRO Elite** com GPS forte.

## Objetivo
Evoluir para experiência nativa mantendo:
- **Core web** (UI/negócio) reaproveitável
- **BUILD verde** constante
- Roadmap incremental (sem reescrever do zero)

---

## Opção A — Capacitor (recomendação “rápida”)
**Quando usar:** queremos nativo *rápido* reaproveitando 90% do app web.

### Prós
- Reaproveita o app atual (React/Vite) dentro de um shell nativo
- Acesso a plugins nativos: permissões, sensores, storage, deep links
- Time-to-market muito menor
- Excelente para “primeiro release” na App Store/Play Store

### Contras
- Performance e UX dependem do WebView (em geral ótimo para apps de UI)
- GPS background exige plugin e implementação cuidadosa
- Mapas nativos “puro” demandam integração extra

### Melhor uso no MindsetFit
- Publicar rapidamente versão mobile instalável (app store)
- Ativar **plugins de GPS**, permissões avançadas e “background mode”
- Manter PWA como canal rápido (web) e Capacitor como canal premium (store)

---

## Opção B — React Native (recomendação “mais pura”, mais custo)
**Quando usar:** precisamos de UX nativo extremo e controle total.

### Prós
- UI realmente nativa
- Melhor controle de performance
- Melhor base para features muito profundas de sensores e background

### Contras
- Reescrita significativa (UI e navegação)
- Duplicação de lógica se não houver disciplina de “shared core”
- Time-to-market e custo maiores

### Melhor uso no MindsetFit
- Fase enterprise / escala global
- Quando GPS background e mapas/sensores forem core 24/7
- Quando o time e orçamento comportarem migração gradual

---

## O que só “nativo” resolve bem (ou melhora muito)
1. **GPS em background** (corrida com tela desligada, travas de energia)
2. **Controle fino de permissões** (always / when-in-use)
3. **Serviços em segundo plano** e continuidade de tracking
4. **Notificações locais** avançadas (splits, pace alerts)
5. **Integração com HealthKit/Google Fit** (futuro)
6. **Mapas nativos** (Google/Apple) com performance superior em certos cenários

---

## Estratégia recomendada (premium e pragmática)
1. **PWA (agora)**: já instalada + offline básico + UX app-like.
2. **Capacitor (próxima fase)**: empacotar o app atual como app store.
3. **Plugins nativos por necessidade**: GPS background, permissões, storage.
4. **RN somente se/quando**:
   - tracking em background for requisito diário
   - mapa/sensores forem “always on”
   - precisarmos de UX nativo absoluto

---

## Checklist técnico futuro (quando iniciar Capacitor)
- Estruturar `apps/mobile/` (shell) e manter `src/` como core web
- Feature flags por plataforma (web/pwa/capacitor)
- Política de permissões e privacidade (localização sensível)
- Pipeline CI: build web + build mobile (sem quebrar a main)
