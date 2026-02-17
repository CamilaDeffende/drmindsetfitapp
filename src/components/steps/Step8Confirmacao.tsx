// MF_ONBOARDING_CONTRACT_V1
type Props = {
  summary: any;
  onConfirm: () => void;
  onBack?: () => void;
};

export default function Step8Confirmacao({ summary, onConfirm, onBack }: Props) {
  // MF_VOID_UNUSED_PROPS_V1
  void onBack;

  return (
    <div data-testid="mf-step-root">
      <h2 className="text-xl font-semibold">Confirmação</h2>

      <pre className="mt-4 p-3 rounded-lg bg-white/5 text-xs overflow-auto">
        {JSON.stringify(summary, null, 2)}
      </pre>

      <div className="mt-6 flex justify-between">
<button onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  );
}
