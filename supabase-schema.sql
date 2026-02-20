-- ========================================
-- DRMINDSETFIT - SCHEMA DO BANCO DE DADOS
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Cole e Execute

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABELA: subscriptions (Assinaturas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'free')),
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- ========================================
-- TABELA: profiles (Perfis dos Usuários)
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ========================================
-- TABELA: treinos (Histórico de Treinos)
-- ========================================
CREATE TABLE IF NOT EXISTS public.treinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    dados JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca por usuário e data
CREATE INDEX IF NOT EXISTS idx_treinos_user_id ON public.treinos(user_id);
CREATE INDEX IF NOT EXISTS idx_treinos_data ON public.treinos(data DESC);
CREATE INDEX IF NOT EXISTS idx_treinos_user_data ON public.treinos(user_id, data DESC);

-- ========================================
-- TABELA: nutricoes (Histórico de Nutrição)
-- ========================================
CREATE TABLE IF NOT EXISTS public.nutricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    dados JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nutricoes_user_id ON public.nutricoes(user_id);
CREATE INDEX IF NOT EXISTS idx_nutricoes_data ON public.nutricoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_nutricoes_user_data ON public.nutricoes(user_id, data DESC);

-- ========================================
-- TABELA: corridas (Histórico de Corridas)
-- ========================================
CREATE TABLE IF NOT EXISTS public.corridas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    dados JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_corridas_user_id ON public.corridas(user_id);
CREATE INDEX IF NOT EXISTS idx_corridas_data ON public.corridas(data DESC);
CREATE INDEX IF NOT EXISTS idx_corridas_user_data ON public.corridas(user_id, data DESC);

-- ========================================
-- RLS (Row Level Security) - SEGURANÇA
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridas ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies para profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies para treinos
CREATE POLICY "Users can view own treinos"
    ON public.treinos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treinos"
    ON public.treinos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treinos"
    ON public.treinos FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treinos"
    ON public.treinos FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para nutricoes
CREATE POLICY "Users can view own nutricoes"
    ON public.nutricoes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutricoes"
    ON public.nutricoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutricoes"
    ON public.nutricoes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutricoes"
    ON public.nutricoes FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para corridas
CREATE POLICY "Users can view own corridas"
    ON public.corridas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own corridas"
    ON public.corridas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own corridas"
    ON public.corridas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own corridas"
    ON public.corridas FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para subscriptions
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- CRIAR ASSINATURA FREE AUTOMÁTICA
-- ========================================
-- Quando um usuário se cadastra, criar assinatura free automaticamente

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar assinatura free
    INSERT INTO public.subscriptions (user_id, status, plan)
    VALUES (NEW.id, 'free', 'free');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar subscription ao cadastrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- SEED DATA (Opcional - para testes)
-- ========================================
-- Descomente se quiser dados de teste

/*
-- Inserir usuário de teste (substitua com ID real)
INSERT INTO public.subscriptions (user_id, status, plan, current_period_end)
VALUES (
    'YOUR_TEST_USER_ID_HERE',
    'active',
    'premium',
    NOW() + INTERVAL '30 days'
);
*/

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
-- Execute estas queries para verificar se tudo foi criado:

SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'profiles', 'treinos', 'nutricoes', 'corridas');

-- Se retornar 5 linhas, tudo foi criado com sucesso! ✅
