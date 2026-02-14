import "./report.styles.css";

export default function PremiumReport() {
  return (
    <div id="premium-report" className="report">
      <section className="cover">
        <h1>DrMindSetFit</h1>
        <p>Saúde · Performance · Estética</p>
      </section>

      <section>
        <h2>Resumo Executivo</h2>
        <p>Plano personalizado baseado em ciência e dados.</p>
      </section>

      <section>
        <h2>Avaliação Física</h2>
        <p>Composição corporal e indicadores estratégicos.</p>
      </section>

      <section>
        <h2>Metabolismo & Estratégia</h2>
        <p>Equações metabólicas e plano calórico.</p>
      </section>

      <section>
        <h2>Treino & Nutrição</h2>
        <p>Estratégia aplicada conforme objetivo.</p>
      </section>

      <footer>
        <p>DrMindSetFit · Relatório Profissional</p>
      </footer>
    </div>
  );
}
