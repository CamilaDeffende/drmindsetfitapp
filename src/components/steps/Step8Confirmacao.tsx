// MF_ONBOARDING_CONTRACT_V1

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  summary: any;
  onConfirm: () => void;
  onBack?: () => void;
};

export default function Step8Confirmacao({
  summary,
  onConfirm,
  onBack,
}: Props) {
  const s = (summary ?? {}) as any;

  const step1 = s.step1 ?? {};
  const step2 = s.step2 ?? {};
  const step3 = s.step3 ?? {};
  const step4 = s.step4 ?? {};
  const step5Modalidades = s.step5Modalidades ?? {};
  const step6DiasSemana = s.step6DiasSemana ?? {};
  const step7Dieta = s.step7Dieta ?? {};
  const metabolismo =
    s.metabolismo ?? step3.metabolismo ?? step3.resultadoMetabolico ?? {};
  const nutricao = s.nutricao ?? step4.nutricao ?? {};

  const perfil = {
    nome: step1.nomeCompleto ?? step2.nomeCompleto ?? "",
    sexo: step1.sexo ?? step2.sexo ?? "",
    idade: step1.idade ?? step2.idade ?? "",
    altura: step1.altura ?? step2.altura ?? "",
    peso:
      step2.peso ??
      step2.pesoAtual ??
      step1.pesoAtual ??
      s.perfil?.pesoAtual ??
      "",
    objetivo: step1.objetivo ?? step2.objetivo ?? "",
    nivelTreino: step1.nivelTreino ?? "",
    frequenciaSemanal: step1.frequenciaSemanal ?? "",
    modalidadePrincipal: step1.modalidadePrincipal ?? "",
  };

  const diasTreino: string[] = Array.isArray(step6DiasSemana.days)
    ? step6DiasSemana.days
    : [];

  const modalidadePrincipal =
    step5Modalidades.primary ?? perfil.modalidadePrincipal ?? null;
  const modalidadeSecundaria = step5Modalidades.secondary ?? null;

  const tipoDieta =
    step7Dieta?.tipo ??
    step7Dieta?.dietType ??
    (typeof step7Dieta === "string" ? step7Dieta : null);

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      data-testid="mf-step-root"
    >
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Confirmação
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Revise o resumo do seu protocolo antes de concluir. Você poderá
          ajustar tudo depois no painel, sem perder nada.
        </p>
      </div>

      {/* Perfil / dados básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>
            Dados usados para estimar metabolismo e orientar o treino.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Nome</span>
            <div className="font-medium">{perfil.nome || "—"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Sexo biológico</span>
            <div className="font-medium">
              {perfil.sexo === "masculino"
                ? "Masculino"
                : perfil.sexo === "feminino"
                ? "Feminino"
                : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Idade</span>
            <div className="font-medium">
              {perfil.idade ? `${perfil.idade} anos` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Altura</span>
            <div className="font-medium">
              {perfil.altura ? `${perfil.altura} cm` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Peso</span>
            <div className="font-medium">
              {perfil.peso ? `${perfil.peso} kg` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Objetivo principal</span>
            <div className="font-medium capitalize">
              {perfil.objetivo || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metabolismo */}
      <Card>
        <CardHeader>
          <CardTitle>Metabolismo e energia diária</CardTitle>
          <CardDescription>
            Números que sustentam calorias e macros do plano.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">TMB (repouso)</span>
            <div className="font-semibold text-lg">
              {metabolismo.tmb ? `${metabolismo.tmb} kcal` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">GET / TDEE</span>
            <div className="font-semibold text-lg">
              {metabolismo.get ? `${metabolismo.get} kcal` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Meta diária</span>
            <div className="font-semibold text-lg">
              {metabolismo.caloriasAlvo
                ? `${metabolismo.caloriasAlvo} kcal`
                : "—"}
            </div>
          </div>

          {metabolismo.faixaSegura && (
            <div className="sm:col-span-3 text-xs text-muted-foreground mt-2">
              Faixa segura trabalhada:{" "}
              <strong>
                {metabolismo.faixaSegura.minimo} –{" "}
                {metabolismo.faixaSegura.maximo} kcal
              </strong>
              .
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrição */}
      <Card>
        <CardHeader>
          <CardTitle>Plano alimentar</CardTitle>
          <CardDescription>
            Estratégia calórica, macros e tipo de dieta escolhidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Estratégia</span>
            <div className="font-medium capitalize">
              {nutricao.estrategia
                ? nutricao.estrategia.replace("-", " ")
                : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Calorias alvo</span>
            <div className="font-medium">
              {nutricao.kcalAlvo
                ? `${nutricao.kcalAlvo} kcal`
                : metabolismo.caloriasAlvo
                ? `${metabolismo.caloriasAlvo} kcal`
                : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Tipo de dieta</span>
            <div className="font-medium capitalize">
              {tipoDieta || "Padrão / onívora"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Macros (g/dia)</span>
            <div className="font-medium">
              {nutricao.macros
                ? `${nutricao.macros.proteina}g P • ${nutricao.macros.carboidratos}g C • ${nutricao.macros.gorduras}g G`
                : "Serão calculadas no painel"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treino */}
      <Card>
        <CardHeader>
          <CardTitle>Treino</CardTitle>
          <CardDescription>
            Modalidade principal, secundária e dias de treino escolhidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Modalidade principal</span>
            <div className="font-medium capitalize">
              {modalidadePrincipal || "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Modalidade secundária</span>
            <div className="font-medium capitalize">
              {modalidadeSecundaria || "—"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Dias de treino</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {diasTreino.length ? (
                diasTreino.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 rounded-full border border-white/10 text-xs uppercase"
                  >
                    {d}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  Nenhum dia selecionado (pode ajustar depois).
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JSON bruto opcional pra debug */}
      <details>
        <summary className="text-xs text-muted-foreground cursor-pointer">
          Ver detalhes técnicos (JSON bruto)
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-xs">
          {JSON.stringify(summary ?? {}, null, 2)}
        </pre>
      </details>

      {/* Ações */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            Voltar
          </Button>
        )}
        <Button
          type="button"
          onClick={onConfirm}
          className="w-full sm:w-auto bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
        >
          Confirmar e ir para o painel
        </Button>
      </div>
    </div>
  );
}