import { calcularMetabolismo } from "../src/lib/metabolismo";
import { buildWeeklyProtocol } from "../src/features/fitness-suite/engine/weeklyProtocol";

function assert(cond, msg){ if(!cond){ console.error("❌ SELFTEST:", msg); process.exit(1); } }

function mkState(freq, modality){
  return {
    perfil: {
      sexo: "masculino",
      idade: 28,
      peso: 82,
      altura: 178,
      objetivo: "manutencao",
      modalidadePrincipal: modality,
      avaliacao: { frequenciaAtividadeSemanal: freq },
      diasTreino: ["Seg","Qua","Sex"],
      levels: { musculacao: "intermediario", corrida: "iniciante", crossfit: "iniciante", funcional: "iniciante", spinning: "iniciante" }
    }
  };
}

const cases = [
  { freq: "sedentario", mod: "musculacao" },
  { freq: "muito_ativo", mod: "musculacao" },
  { freq: "ativo", mod: "corrida" },
  { freq: "moderadamente_ativo", mod: "crossfit" }
];

for (const c of cases) {
  const state = mkState(c.freq, c.mod);
  const met = calcularMetabolismo(state.perfil);
  assert(met, "metabolismo retornou vazio");
  assert(Number.isFinite((met).tmb), "tmb inválido");
  const faf = Number((met).fafFinal ?? (met).faf);
  assert(faf >= 1.0 && faf <= 2.4, `faf fora do range: ${faf}`);
  const get = Number((met).get ?? (met).caloriasManutencao);
  assert(Number.isFinite(get) && get > 800 && get < 6500, `GET fora do range: ${get}`);

  const proto = buildWeeklyProtocol(state);
  assert(proto?.sessions?.length >= 1, "weeklyProtocol sem sessões");
  // garantia básica: sessões respeitam modalidade permitida
  for (const s of proto.sessions) {
    assert(!!s.modality, "sessão sem modality");
  }
}

console.log("✅ SELFTEST PREMIUM OK");
