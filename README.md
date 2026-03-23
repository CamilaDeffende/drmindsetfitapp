# MindsetFit

Aplicativo fitness premium com onboarding guiado, dashboard free/premium, plano alimentar, plano de treino, corrida, relatórios, recursos offline e empacotamento mobile com Capacitor.

O projeto roda como aplicação web com Vite/React e também pode ser publicado como app Android/iOS a partir do `dist`.

## Visao Geral

O fluxo principal hoje e:

1. assinatura, login ou cadastro
2. onboarding em multiplas etapas
3. geracao de plano ativo
4. acesso ao dashboard
5. modulos premium de treino, nutricao, corrida e relatorios

Rotas principais atualmente implementadas:

- `/assinatura`
- `/login`
- `/signup`
- `/checkout`
- `/onboarding/*`
- `/dashboard`
- `/dashboardpremium`
- `/running`
- `/treino`
- `/nutrition`
- `/cardio`
- `/hiit`
- `/planos-ativos`
- `/report`
- `/history`
- `/download`
- `/ai`
- `/wearables`
- `/achievements`
- `/conflicts`
- `/progress`
- `/live-workout`

## Stack

- React 18 + TypeScript
- Vite 6
- React Router 6
- Tailwind CSS
- Radix UI
- Zustand
- Supabase Auth/DB
- Stripe
- Recharts + Chart.js
- jsPDF + html2canvas + @react-pdf/renderer
- i18next
- Capacitor
- Playwright + Vitest

## Arquitetura Rapida

- [src/main.tsx](E:/projetos/drmindsetfitapp/src/main.tsx): bootstrap, providers, splash screen e diagnostico de boot.
- [src/App.tsx](E:/projetos/drmindsetfitapp/src/App.tsx): roteamento principal, code splitting e protecao de rotas.
- [src/contexts/AuthContext.tsx](E:/projetos/drmindsetfitapp/src/contexts/AuthContext.tsx): autenticacao e fallback para modo demo.
- [src/contexts/DrMindSetfitContext.tsx](E:/projetos/drmindsetfitapp/src/contexts/DrMindSetfitContext.tsx): estado persistido do onboarding e do plano ativo.
- [src/services/plan.service.ts](E:/projetos/drmindsetfitapp/src/services/plan.service.ts): geracao e persistencia do plano ativo.
- [src/engine](E:/projetos/drmindsetfitapp/src/engine): motores de calculo metabolico, nutricao e treino.
- [src/pages](E:/projetos/drmindsetfitapp/src/pages): telas do produto.
- [src/features](E:/projetos/drmindsetfitapp/src/features): modulos de produto isolados, incluindo `fitness-suite`, PWA e run-pro.

## Modo Demo e Modo Real

O projeto possui dois modos de funcionamento:

- Modo real: usa Supabase quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estao configurados.
- Modo demo: se essas variaveis nao existirem, a aplicacao sobe sem quebrar e usa autenticacao mock para facilitar desenvolvimento local.

Esse comportamento esta implementado em [src/lib/supabase.ts](E:/projetos/drmindsetfitapp/src/lib/supabase.ts) e [src/contexts/AuthContext.tsx](E:/projetos/drmindsetfitapp/src/contexts/AuthContext.tsx).

## Requisitos

- Node.js 20+
- npm
- opcional: Android Studio para build Android
- opcional: Xcode para build iOS

## Variaveis de Ambiente

Use `.env.local` como base. Exemplo disponivel em [.env.example](E:/projetos/drmindsetfitapp/.env.example).

Principais variaveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_APP_URL`
- `VITE_SUBSCRIPTION_PRICE_ID`
- `VITE_MONTHLY_PRICE`
- `VITE_MAP_PROVIDER`
- `VITE_GOOGLE_MAPS_KEY`

## Como Rodar

Instalar dependencias:

```bash
npm install
```

Ambiente de desenvolvimento:

```bash
npm run dev
```

O servidor local sobe na porta `8080`.

## Scripts Importantes

- `npm run dev`: ambiente local
- `npm run build`: build de producao
- `npm run type-check`: checagem TypeScript
- `npm run lint`: lint principal do projeto
- `npm run verify`: guardas internas + lint + type-check + build
- `npm run test`: suite Vitest
- `npm run test:run`: execucao unica do Vitest
- `npm run test:e2e`: Playwright E2E
- `npm run test:visual`: testes visuais
- `npm run analyze:bundle`: gera analise de bundle

## Validacao Minima Antes de Entregar

Pelo fluxo do projeto, o esperado e manter:

```bash
npm run type-check
npm run build
```

Quando a mudanca for mais ampla, prefira:

```bash
npm run verify
```

## Web, PWA e Mobile

- O app usa Vite PWA no navegador.
- Em build para Capacitor, o PWA e desativado para evitar problemas no WebView.
- O `base` do Vite esta configurado como relativo para funcionar corretamente no empacotamento mobile.
- A configuracao do Capacitor esta em [capacitor.config.ts](E:/projetos/drmindsetfitapp/capacitor.config.ts).

Para build web:

```bash
npm run build
```

Para sincronizar com plataformas mobile, use o fluxo normal do Capacitor adotado pelo time apos gerar o `dist`.

## Estado e Persistencia

- Parte relevante do estado e salva em `localStorage`.
- O onboarding concluido e o plano ativo sao reidratados automaticamente.
- A assinatura premium e usada para liberar rotas protegidas.

Arquivos uteis:

- [src/contexts/DrMindSetfitContext.tsx](E:/projetos/drmindsetfitapp/src/contexts/DrMindSetfitContext.tsx)
- [src/components/ProtectedRoute.tsx](E:/projetos/drmindsetfitapp/src/components/ProtectedRoute.tsx)
- [src/services/plan.service.ts](E:/projetos/drmindsetfitapp/src/services/plan.service.ts)

## Funcionalidades Ja Presentes

- onboarding em etapas
- autenticacao com Supabase
- fallback demo para desenvolvimento
- dashboard free e premium
- treino ativo
- plano nutricional
- cardio e HIIT
- corrida
- historico e relatorios
- exportacao de PDF
- wearables
- gamificacao
- recursos offline
- PWA
- empacotamento Android/iOS com Capacitor

## Estrutura do Repositorio

```text
src/
  components/
  contexts/
  engine/
  features/
  hooks/
  lib/
  pages/
  services/
  store/
  styles/
  sync/
  types/
tests/
android/
ios/
public/
```

## Observacoes

- O projeto tem historico de evolucao incremental, entao alguns arquivos de documentacao antigos podem nao refletir exatamente o estado atual da aplicacao.
- O `README` anterior era o template padrao do Vite; este arquivo foi atualizado para espelhar a base real.
