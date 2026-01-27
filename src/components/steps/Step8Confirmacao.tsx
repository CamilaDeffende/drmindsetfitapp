
type Props = {
  summary: any;
  onConfirm: () => void;
  onBack?: () => void;
};

export default function Step8Confirmacao({ summary, onConfirm, onBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">Confirmação</h2>

      <pre className="mt-4 p-3 rounded-lg bg-white/5 text-xs overflow-auto">
        {JSON.stringify(summary, null, 2)}
      </pre>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack}>Voltar</button>
        <button onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  );
}
