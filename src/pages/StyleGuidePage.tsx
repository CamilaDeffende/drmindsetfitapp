// MF_NEON_UIKIT_V1
import { MFPageShell } from "@/components/mf/MFPageShell";
import { MFCard } from "@/components/mf/MFCard";
import { MFButton } from "@/components/mf/MFButton";
import { MFBadge } from "@/components/mf/MFBadge";

export default function StyleGuidePage() {
  return (
    <MFPageShell
      title="Style Guide — MF Neon Premium"
      subtitle="Tokens, componentes base e padrões visuais do DrMindSetFit."
      headerRight={<MFBadge tone="blue">MF Neon V1</MFBadge>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <MFCard
          title="Cards Premium"
          subtitle="Painel com borda e glow controlado"
          glow="blue"
        >
          <div className="space-y-3">
            <p className="text-sm mf-subtle">
              Use <code className="text-mf-text">MFCard</code> como container padrão das seções.
            </p>
            <div className="flex flex-wrap gap-2">
              <MFBadge>Default</MFBadge>
              <MFBadge tone="blue">Blue</MFBadge>
              <MFBadge tone="purple">Purple</MFBadge>
              <MFBadge tone="green">Green</MFBadge>
            </div>
          </div>
        </MFCard>

        <MFCard title="Botões" subtitle="CTA com neon + acessibilidade" glow="purple">
          <div className="flex flex-wrap gap-2">
            <MFButton>Primary</MFButton>
            <MFButton variant="ghost">Ghost</MFButton>
            <MFButton variant="neonBlue">Neon Blue</MFButton>
            <MFButton variant="neonPurple">Neon Purple</MFButton>
            <MFButton variant="neonGreen">Neon Green</MFButton>
          </div>
        </MFCard>

        <MFCard title="Layout" subtitle="Shell padrão das páginas" glow="green" className="md:col-span-2">
          <p className="text-sm mf-subtle">
            Use <code className="text-mf-text">MFPageShell</code> para padronizar título, subtítulo,
            container e fundo neon em qualquer tela.
          </p>
        </MFCard>
      </div>
    </MFPageShell>
  );
}
