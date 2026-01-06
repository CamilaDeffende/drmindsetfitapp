# 🚀 GUIA DE CONFIGURAÇÃO COMERCIAL - DrMindSetfit

## ✅ O QUE FOI IMPLEMENTADO

### 1. Sistema de Autenticação Completo
- ✅ Login com email/senha
- ✅ Cadastro de novos usuários
- ✅ Recuperação de senha
- ✅ Proteção de rotas privadas
- ✅ Context API para gerenciar autenticação

### 2. Sistema de Assinaturas
- ✅ Hook `useSubscription` para verificar plano ativo
- ✅ Paywall automático em rotas premium
- ✅ Tela de upgrade personalizada
- ✅ Verificação de acesso por funcionalidade

### 3. Estrutura de Banco de Dados
- ✅ Schema SQL completo no arquivo `supabase-schema.sql`
- ✅ Tabelas: subscriptions, profiles, treinos, nutricoes, corridas
- ✅ Row Level Security (RLS) configurado
- ✅ Triggers automáticos
- ✅ Assinatura FREE criada automaticamente

### 4. Páginas Comerciais
- ✅ `/login` - Tela de login
- ✅ `/signup` - Cadastro de usuários
- ✅ `/pricing` - Página de planos (Free vs Premium R$ 97,99/mês)
- ✅ Componente `ProtectedRoute` com paywall integrado

### 5. Rotas Protegidas
- Dashboard básico: qualquer usuário logado
- Features premium: apenas assinantes
  - Treino personalizado
  - Dieta personalizada
  - Módulo de corrida
  - Relatórios PDF
  - Edição de dieta

---

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### ETAPA 1: Criar Projeto Supabase (5 minutos)

1. Acesse https://supabase.com
2. Crie uma conta gratuita
3. Clique em "New Project"
4. Preencha:
   - Nome: `drmindsetfit-prod`
   - Database Password: gere uma senha forte (GUARDE!)
   - Region: South America (São Paulo)
5. Aguarde ~2 minutos para o projeto ser criado

### ETAPA 2: Configurar Banco de Dados (3 minutos)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)
7. Aguarde a mensagem de sucesso ✅

**Verificação**: Execute esta query para confirmar:
\`\`\`sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'profiles', 'treinos', 'nutricoes', 'corridas');
\`\`\`
Deve retornar 5 linhas!

### ETAPA 3: Configurar Autenticação no Supabase

1. No Supabase, vá em **Authentication** → **Providers**
2. Em "Email", certifique-se que está habilitado
3. Configure:
   - ✅ Enable email provider
   - ✅ Confirm email: **DESATIVADO** (para facilitar testes)
   - Depois de testar, você pode ativar confirmação de email

### ETAPA 4: Pegar Credenciais do Supabase

1. No Supabase, vá em **Settings** → **API**
2. Copie estas informações:
   - **Project URL**: algo como `https://xxxxx.supabase.co`
   - **anon public key**: começa com `eyJ...`

### ETAPA 5: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie o arquivo `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

2. Edite `.env` e cole suas credenciais:
\`\`\`env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (preencher depois)
VITE_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
VITE_APP_URL=http://localhost:5173
VITE_MONTHLY_PRICE=9799
\`\`\`

3. **Reinicie o servidor de desenvolvimento**:
\`\`\`bash
npm run dev
\`\`\`

---

## 🧪 TESTAR SISTEMA DE AUTENTICAÇÃO

### Teste 1: Criar Conta
1. Acesse: http://localhost:5173/signup
2. Preencha:
   - Nome: Seu Nome
   - Email: teste@teste.com
   - Senha: 123456
3. Clique em "Criar conta grátis"
4. **Deve criar conta e redirecionar para /pricing**

### Teste 2: Login
1. Acesse: http://localhost:5173/login
2. Use as credenciais criadas acima
3. Clique em "Entrar"
4. **Deve redirecionar para /dashboard**

### Teste 3: Verificar Paywall
1. Estando logado, tente acessar: http://localhost:5173/treino
2. **Deve mostrar tela de "Premium Necessário"**
3. Clique em "Assinar Premium"
4. **Deve abrir página /pricing**

### Teste 4: Verificar Banco de Dados
No Supabase, vá em **Table Editor**:
- Abra tabela `subscriptions` → deve ter 1 registro com `status: free`
- Abra tabela `profiles` → deve ter 1 registro com seu nome

---

## 💳 ETAPA 6: INTEGRAR STRIPE (Pagamentos)

### 1. Criar Conta Stripe

1. Acesse: https://stripe.com/br
2. Crie uma conta
3. Preencha os dados da empresa
4. Ative modo de teste (Test Mode)

### 2. Criar Produto no Stripe

1. No dashboard Stripe, vá em **Products** → **Add Product**
2. Preencha:
   - Name: `DrMindSetfit Premium`
   - Description: `Acesso completo ao app DrMindSetfit`
   - Price: `R$ 97,99`
   - Billing period: `Monthly (mensal)`
   - Currency: `BRL (Brazilian Real)`
3. Clique em **Save product**
4. **Copie o Price ID** (começa com `price_...`)

### 3. Pegar API Keys do Stripe

1. No Stripe, vá em **Developers** → **API Keys**
2. Copie:
   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (começa com `sk_test_...`)

3. Atualize o `.env`:
\`\`\`env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
VITE_SUBSCRIPTION_PRICE_ID=price_xxxxx
\`\`\`

### 4. Criar Webhook Backend (Node.js)

⚠️ **IMPORTANTE**: O Stripe precisa de um backend para processar pagamentos.

Opção A: **Usar Vercel Functions** (Recomendado)

Crie: `/api/create-checkout-session.ts`
\`\`\`typescript
import Stripe from 'stripe'
import { VercelRequest, VercelResponse } from '@vercel/node'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, priceId } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: \`\${process.env.VITE_APP_URL}/dashboard?success=true\`,
      cancel_url: \`\${process.env.VITE_APP_URL}/pricing?canceled=true\`,
      client_reference_id: userId,
      metadata: { userId },
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar checkout' })
  }
}
\`\`\`

Crie: `/api/webhook.ts`
\`\`\`typescript
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (não anon)
)

export const config = { api: { bodyParser: false } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`)
  }

  // Processar eventos
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId) break

      // Atualizar subscription no Supabase
      await supabase.from('subscriptions').update({
        status: 'active',
        plan: 'premium',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('user_id', userId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase.from('subscriptions').update({
        status: 'canceled',
        plan: 'free',
      }).eq('stripe_subscription_id', subscription.id)

      break
    }
  }

  res.status(200).json({ received: true })
}
\`\`\`

---

## 🚀 DEPLOY EM PRODUÇÃO

### 1. Deploy do Frontend (Vercel)

1. Push seu código para GitHub
2. Acesse https://vercel.com
3. Importe seu repositório
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY`
   - `VITE_SUBSCRIPTION_PRICE_ID`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY` (pegar no Supabase Settings → API)
5. Deploy!

### 2. Configurar Webhook no Stripe

1. No Stripe, vá em **Developers** → **Webhooks**
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.vercel.app/api/webhook`
4. Eventos a escutar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copie o **Signing secret** e adicione ao `.env` como `STRIPE_WEBHOOK_SECRET`

---

## ✅ CHECKLIST FINAL

- [ ] Projeto Supabase criado
- [ ] Schema SQL executado (5 tabelas criadas)
- [ ] Variáveis VITE_SUPABASE_* configuradas
- [ ] Cadastro funcionando
- [ ] Login funcionando
- [ ] Paywall funcionando (bloqueia rotas premium)
- [ ] Conta Stripe criada
- [ ] Produto Premium criado no Stripe (R$ 97,99/mês)
- [ ] Variáveis STRIPE configuradas
- [ ] Backend (Vercel Functions) criado
- [ ] Webhook configurado no Stripe
- [ ] Deploy em produção feito
- [ ] Teste completo: cadastro → login → assinar → funciona!

---

## 📊 PRÓXIMOS PASSOS (Opcional)

1. **Email Marketing**:
   - Integrar Resend ou SendGrid
   - Email de boas-vindas
   - Email de renovação

2. **Analytics**:
   - Google Analytics
   - Posthog (open source)

3. **Suporte**:
   - Chat (Intercom, Crisp)
   - Helpdesk (Zendesk)

4. **App Mobile**:
   - Considerar React Native

---

## 🆘 SUPORTE

Se encontrar problemas:

1. **Erro de autenticação**: Verifique se as variáveis SUPABASE estão corretas
2. **Paywall não funciona**: Verifique se o RLS está habilitado no Supabase
3. **Stripe não processa**: Verifique os webhooks e os logs
4. **Deploy falhou**: Verifique as variáveis de ambiente na Vercel

---

## 💰 CUSTOS ESTIMADOS

- **Supabase**: Grátis até 500MB database, depois $25/mês
- **Stripe**: 2.9% + R$ 0,30 por transação
- **Vercel**: Grátis (hobby plan)
- **Total**: ~R$ 0-150/mês dependendo do volume

Com 400 assinantes pagantes:
- Receita: R$ 39.196,00
- Stripe (3%): -R$ 1.175,88
- Infraestrutura: -R$ 150,00
- **Lucro líquido: ~R$ 37.870/mês** 🚀

---

**Pronto para começar a vender!** 💪
