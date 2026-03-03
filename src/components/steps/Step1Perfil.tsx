// MF_ONBOARDING_CONTRACT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import type { PerfilUsuario } from "@/types";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { useNavigate } from "react-router-dom";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { useOnboardingStore } from "@/store/onboarding/onboardingStore";

type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

/**
 * Schema de validação do Step 1.
 * Aqui já garantimos que:
 * - nomeCompleto é obrigatório
 * - espaços em branco não são aceitos como nome
 */
const perfilSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, "Nome completo é obrigatório"),
  sexo: z.enum(["masculino", "feminino"]),
  idade: z
    .coerce.number()
    .min(10, "Idade mínima: 10 anos")
    .max(120, "Idade máxima: 120 anos"),
  altura: z
    .coerce.number()
    .min(100, "Altura mínima: 100cm")
    .max(250, "Altura máxima: 250cm"),
  pesoAtual: z
    .coerce.number()
    .min(30, "Peso mínimo: 30kg")
    .max(300, "Peso máximo: 300kg"),
  historicoPeso: z.string().optional(),
  nivelTreino: z.enum([
    "sedentario",
    "iniciante",
    "intermediario",
    "avancado",
    "atleta",
  ]),
  modalidadePrincipal: z.enum([
    "musculacao",
    "funcional",
    "corrida",
    "crossfit",
    "spinning",
  ]),
  frequenciaSemanal: z
    .coerce.number()
    .min(1, "Mínimo 1 vez")
    .max(7, "Máximo 7 vezes"),
  duracaoTreino: z
    .coerce.number()
    .min(15, "Mínimo 15 min")
    .max(240, "Máximo 240 min"),
  objetivo: z.enum([
    "emagrecimento",
    "reposicao",
    "hipertrofia",
    "performance",
    "longevidade",
  ]),
});

export function Step1Perfil({ value, onChange, onNext }: OnboardingStepProps) {
  const navigate = useNavigate();
  const { state, updateState, nextStep } = useDrMindSetfit();

  // BLOCK2A: UNLOCK Step1 -> Step2 (persist progress + draft + goNext)
  const __goNextSafe = (data: PerfilUsuario) => {
    const nome = (data?.nomeCompleto || "").trim();
    if (!nome || nome.length < 3) {
      console.warn(
        "Tentativa de avançar Step1 sem nome completo válido. Bloqueando goNextSafe."
      );
      return;
    }

    try {
      navigate("/onboarding/step-2", { replace: true });
    } catch (e) {}

    try {
      saveOnboardingProgress({ step: 2, data: { step1: data } });
    } catch (e) {}

    try {
      if (typeof onChange === "function") onChange(data);
    } catch (e) {}

    try {
      if (typeof onNext === "function") onNext();
    } catch (e) {}
  };

  /* MF_STEP1_DRAFT_SEED */
  const draftSeed = (value && typeof value === "object" ? value : {}) as Partial<
    PerfilUsuario
  >;

  // MF_STEP1_SSOT_DRAFT_V1
  const draftSSOT = useOnboardingStore((st) => st.draft) as Record<
    string,
    any
  >;

  const form = useForm<PerfilUsuario>({
    resolver: zodResolver(perfilSchema) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ...(draftSSOT as any),
      ...(draftSeed as any),

      // se não houver draft nem state.perfil => vem vazio (placeholders só visual)
      nomeCompleto:
        (draftSeed.nomeCompleto ??
          state.perfil?.nomeCompleto ??
          "") as any,

      sexo: (draftSeed.sexo ??
        state.perfil?.sexo ??
        undefined) as any,

      idade: (draftSeed.idade ??
        state.perfil?.idade ??
        undefined) as any,

      altura: (draftSeed.altura ??
        state.perfil?.altura ??
        undefined) as any,

      pesoAtual: (draftSeed.pesoAtual ??
        state.perfil?.pesoAtual ??
        undefined) as any,

      historicoPeso: (draftSeed.historicoPeso ??
        state.perfil?.historicoPeso ??
        "") as any,

      nivelTreino: (draftSeed.nivelTreino ??
        state.perfil?.nivelTreino ??
        undefined) as any,

      modalidadePrincipal: (draftSeed.modalidadePrincipal ??
        state.perfil?.modalidadePrincipal ??
        undefined) as any,

      frequenciaSemanal: (draftSeed.frequenciaSemanal ??
        state.perfil?.frequenciaSemanal ??
        undefined) as any,

      duracaoTreino: (draftSeed.duracaoTreino ??
        state.perfil?.duracaoTreino ??
        undefined) as any,

      objetivo: (draftSeed.objetivo ??
        state.perfil?.objetivo ??
        undefined) as any,
    },
  });

  // MF_STEP1_AUTOSAVE_WATCH_V1
  const _watchAll = form.watch();
  useOnboardingDraftSaver(
    {
      nomeCompleto: (_watchAll as any).nomeCompleto ?? "",
      sexo: (_watchAll as any).sexo ?? "",
      idade: (_watchAll as any).idade ?? "",
      altura: (_watchAll as any).altura ?? "",
      pesoAtual: (_watchAll as any).pesoAtual ?? "",

      historicoPeso: (_watchAll as any).historicoPeso ?? "",
      nivelTreino: (_watchAll as any).nivelTreino ?? "",
      modalidadePrincipal: (_watchAll as any).modalidadePrincipal ?? "",
      frequenciaSemanal: (_watchAll as any).frequenciaSemanal ?? "",
      duracaoTreino: (_watchAll as any).duracaoTreino ?? "",
      objetivo: (_watchAll as any).objetivo ?? "",

      // aliases EN
      name: (_watchAll as any).nomeCompleto ?? "",
      sex: (_watchAll as any).sexo ?? "",
      age: (_watchAll as any).idade ?? "",
      heightCm: (_watchAll as any).altura ?? "",
      weightKg: (_watchAll as any).pesoAtual ?? "",
    },
    400
  );

  // 🔧 Autosave: sempre que os ESSENCIAIS estiverem preenchidos,
  // espelha no contexto e zera metabolismo pra forçar recálculo no Step3
  useEffect(() => {
    const data = form.getValues();

    const temEssenciais =
      data.sexo &&
      data.idade &&
      data.altura &&
      data.pesoAtual;

    if (!temEssenciais) return;

    try {
      updateState({
        metabolismo: undefined,
        resultadoMetabolico: undefined,
        perfil: {
          ...(state as any)?.perfil,
          ...data,
        },
        avaliacao: {
          ...((state as any)?.avaliacao ?? {}),
          altura: data.altura,
          peso: data.pesoAtual,
        },
      } as any);
    } catch (e) {}
  }, [_watchAll, updateState, state, form]);

  const onSubmit = (data: PerfilUsuario) => {
    const nome = (data?.nomeCompleto || "").trim();
    if (!nome || nome.length < 3) {
      form.setError("nomeCompleto", {
        type: "manual",
        message: "Nome completo é obrigatório",
      });
      return;
    }

    // Submit “oficial”: garante persistência e também zera metabolismo
    updateState({
      metabolismo: undefined,
      resultadoMetabolico: undefined,
      perfil: {
        ...(state as any)?.perfil,
        ...data,
      },
      avaliacao: {
        ...((state as any)?.avaliacao ?? {}),
        altura: data.altura,
        peso: data.pesoAtual,
      },
    } as any);

    nextStep();
    __goNextSafe(data);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="mf-step-root">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Base do seu plano
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Esses dados calibram as estimativas iniciais (metabolismo, gasto
          diário e distribuição de macros). Preencha o essencial com precisão —
          isso aumenta a qualidade do treino, da dieta e do relatório final.
        </p>
      </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Vamos calibrar seu protocolo
        </h2>
        <p className="text-muted-foreground">
          Leva ~2 minutos. Quanto mais fiel, mais assertivo o seu plano.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados para calibração</CardTitle>
          <CardDescription>
            Usamos isso para estimar metabolismo, definir metas e personalizar
            treino + nutrição nas próximas etapas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 sm:space-y-7"
            >
              {/* Dados Pessoais Essenciais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Essenciais</h3>

                <FormField
                  control={form.control}
                  name="nomeCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu nome completo"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            try {
                              if (typeof onChange === "function") {
                                const next = {
                                  ...form.getValues(),
                                  nomeCompleto: (e.target as any).value,
                                };
                                onChange(next);
                              }
                            } catch (e) {}
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo biológico (para cálculos)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">
                              Masculino
                            </SelectItem>
                            <SelectItem value="feminino">
                              Feminino
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade (anos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="altura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="170" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pesoAtual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso Atual (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="70"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="historicoPeso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico de peso (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Já pesei 90kg, emagreci para 75kg em 2020..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Direção do plano */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg">Direção do plano</h3>

                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Qual resultado você quer priorizar agora?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="emagrecimento">
                            Emagrecimento
                          </SelectItem>
                          <SelectItem value="reposicao">
                            Recomposição Corporal
                          </SelectItem>
                          <SelectItem value="hipertrofia">
                            Hipertrofia
                          </SelectItem>
                          <SelectItem value="performance">
                            Performance
                          </SelectItem>
                          <SelectItem value="longevidade">
                            Saúde / Longevidade
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Não precisa ter botão de submit aqui; o shell usa o "Continuar" global */}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}