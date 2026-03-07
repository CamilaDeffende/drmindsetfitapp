// MF_ONBOARDING_CONTRACT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE3_STEP1_UI_V1

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { useNavigate } from "react-router-dom";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { useOnboardingStore } from "@/store/onboarding/onboardingStore";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const perfilSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Nome completo é obrigatório"),
  sexo: z.enum(["masculino", "feminino"]),
  idade: z.coerce.number().min(10, "Idade mínima: 10 anos").max(120, "Idade máxima: 120 anos"),
  altura: z.coerce.number().min(100, "Altura mínima: 100cm").max(250, "Altura máxima: 250cm"),
  pesoAtual: z.coerce.number().min(30, "Peso mínimo: 30kg").max(300, "Peso máximo: 300kg"),
  historicoPeso: z.string().optional(),
  nivelTreino: z.enum(["sedentario", "iniciante", "intermediario", "avancado", "atleta"]),
  modalidadePrincipal: z.enum(["musculacao", "funcional", "corrida", "crossfit", "spinning"]),
  frequenciaSemanal: z.coerce.number().min(1, "Mínimo 1 vez").max(7, "Máximo 7 vezes"),
  duracaoTreino: z.coerce.number().min(15, "Mínimo 15 min").max(240, "Máximo 240 min"),
  objetivo: z.enum(["emagrecimento", "reposicao", "hipertrofia", "performance", "longevidade"]),
});

const objetivos = [
  {
    key: "performance",
    label: "Performance",
    desc: "Direcionado para aumento de capacidade física.",
  },
  {
    key: "hipertrofia",
    label: "Hipertrofia",
    desc: "Foco em ganho de massa muscular com progressão.",
  },
  {
    key: "reposicao",
    label: "Recomposição",
    desc: "Melhora composição corporal com equilíbrio.",
  },
  {
    key: "emagrecimento",
    label: "Emagrecimento",
    desc: "Déficit com aderência e preservação de massa magra.",
  },
  {
    key: "longevidade",
    label: "Saúde / longevidade",
    desc: "Foco em consistência, energia e sustentabilidade.",
  },
] as const;

export function Step1Perfil({ value, onChange, onNext }: OnboardingStepProps) {
  const navigate = useNavigate();
  const { state, updateState, nextStep } = useDrMindSetfit();

  const draftSeed = (value && typeof value === "object" ? value : {}) as Partial<PerfilUsuario>;
  const draftSSOT = useOnboardingStore((st) => st.draft) as Record<string, any>;

  const form = useForm<PerfilUsuario>({
    resolver: zodResolver(perfilSchema) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ...(draftSSOT as any),
      ...(draftSeed as any),

      nomeCompleto: (draftSeed.nomeCompleto ?? state.perfil?.nomeCompleto ?? "") as any,
      sexo: (draftSeed.sexo ?? state.perfil?.sexo ?? undefined) as any,
      idade: (draftSeed.idade ?? state.perfil?.idade ?? undefined) as any,
      altura: (draftSeed.altura ?? state.perfil?.altura ?? undefined) as any,
      pesoAtual: (draftSeed.pesoAtual ?? state.perfil?.pesoAtual ?? undefined) as any,
      historicoPeso: (draftSeed.historicoPeso ?? state.perfil?.historicoPeso ?? "") as any,
      nivelTreino: (draftSeed.nivelTreino ?? state.perfil?.nivelTreino ?? "intermediario") as any,
      modalidadePrincipal: (draftSeed.modalidadePrincipal ??
        state.perfil?.modalidadePrincipal ??
        "musculacao") as any,
      frequenciaSemanal: (draftSeed.frequenciaSemanal ?? state.perfil?.frequenciaSemanal ?? 4) as any,
      duracaoTreino: (draftSeed.duracaoTreino ?? state.perfil?.duracaoTreino ?? 60) as any,
      objetivo: (draftSeed.objetivo ?? state.perfil?.objetivo ?? "performance") as any,
    },
  });

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
      name: (_watchAll as any).nomeCompleto ?? "",
      sex: (_watchAll as any).sexo ?? "",
      age: (_watchAll as any).idade ?? "",
      heightCm: (_watchAll as any).altura ?? "",
      weightKg: (_watchAll as any).pesoAtual ?? "",
    },
    400
  );

  useEffect(() => {
    const data = form.getValues();

    const temEssenciais = data.sexo && data.idade && data.altura && data.pesoAtual;
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
    } catch {}
  }, [_watchAll, updateState, state, form]);

  const __goNextSafe = (data: PerfilUsuario) => {
    const nome = (data?.nomeCompleto || "").trim();
    if (!nome || nome.length < 3) {
      console.warn("Tentativa de avançar Step1 sem nome completo válido. Bloqueando goNextSafe.");
      return;
    }

    try {
      navigate("/onboarding/step-2", { replace: true });
    } catch {}

    try {
      saveOnboardingProgress({ step: 2, data: { step1: data } });
    } catch {}

    try {
      if (typeof onChange === "function") onChange(data);
    } catch {}

    try {
      if (typeof onNext === "function") onNext();
    } catch {}
  };

  const onSubmit = (data: PerfilUsuario) => {
    const nome = (data?.nomeCompleto || "").trim();
    if (!nome || nome.length < 3) {
      form.setError("nomeCompleto", {
        type: "manual",
        message: "Nome completo é obrigatório",
      });
      return;
    }

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

  const objetivoAtual = form.watch("objetivo");

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* BLOCO 1 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">Essenciais</h3>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nomeCompleto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-white/80">Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite seu nome completo"
                        autoComplete="name"
                        autoCorrect="off"
                        autoCapitalize="words"
                        spellCheck={false}
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
                          } catch {}
                        }}
                        className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-[1fr_110px] gap-3">
                <FormField
                  control={form.control}
                  name="sexo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] text-white/80">Sexo biológico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
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
                      <FormLabel className="text-[13px] text-white/80">Idade</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] text-white/80">Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="179"
                          {...field}
                          className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                        />
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
                      <FormLabel className="text-[13px] text-white/80">Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="90"
                          {...field}
                          className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
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
                    <FormLabel className="text-[13px] text-white/80">Histórico de peso (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Já pesei 90kg, emagreci para 75kg em 2020..."
                        className="min-h-[96px] resize-none rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* BLOCO 2 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">Direção do plano</h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Qual resultado você quer priorizar agora?
              </p>
            </div>

            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3">
                    {objetivos.map((item) => {
                      const active = objetivoAtual === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => field.onChange(item.key)}
                          className={[
                            "w-full rounded-[20px] border px-4 py-3 text-left transition-all",
                            active
                              ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_24px_rgba(34,197,94,0.08)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={[
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                active
                                  ? "border-emerald-400 bg-emerald-400 text-black"
                                  : "border-white/20 bg-transparent text-transparent",
                              ].join(" ")}
                            >
                              <Check className="h-3 w-3" />
                            </div>

                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold text-white">
                                {item.label}
                              </div>
                              <div className="mt-1 text-[12px] leading-5 text-white/50">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage className="pt-2" />
                </FormItem>
              )}
            />
          </section>

          {/* BLOCO 3 escondido logicamente, mas mantém dados importantes */}
          <div className="hidden">
            <FormField
              control={form.control}
              name="nivelTreino"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário</SelectItem>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="atleta">Atleta</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <FormField
              control={form.control}
              name="modalidadePrincipal"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musculacao">Musculação</SelectItem>
                    <SelectItem value="funcional">Funcional</SelectItem>
                    <SelectItem value="corrida">Corrida</SelectItem>
                    <SelectItem value="crossfit">Crossfit</SelectItem>
                    <SelectItem value="spinning">Spinning</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <FormField
              control={form.control}
              name="frequenciaSemanal"
              render={({ field }) => <Input type="number" {...field} />}
            />

            <FormField
              control={form.control}
              name="duracaoTreino"
              render={({ field }) => <Input type="number" {...field} />}
            />
          </div>

          {/* CTA local */}
          <div className="pt-1">
            <Button
              type="submit"
              className="h-14 w-full rounded-[20px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110"
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default Step1Perfil;