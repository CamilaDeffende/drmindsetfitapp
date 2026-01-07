export default function HiitPlan() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-red-500">
          HIIT — Treino Intervalado de Alta Intensidade
        </h1>

        <p className="text-gray-300">
          Protocolo HIIT personalizado para maximizar gasto calórico, performance metabólica e condicionamento físico.
        </p>

        <div className="rounded-2xl border border-red-500/20 bg-neutral-900 p-6">
          <h2 className="text-xl font-semibold mb-2">Estrutura do HIIT (MVP)</h2>

          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Duração total</li>
            <li>Intervalos de esforço e descanso</li>
            <li>Frequência semanal</li>
            <li>Objetivo metabólico</li>
          </ul>

          <p className="mt-4 text-sm text-gray-400">
            ⚡ Este módulo será evoluído com protocolos avançados, progressões e controle de intensidade.
          </p>
        </div>
      </div>
    </div>
  );
}
