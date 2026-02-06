import { useEffect } from "react";

export function DiagnosticPage() {
  useEffect(() => {
    console.log('✅ DiagnosticPage montada com sucesso!');
    console.log('- React está funcionando');
    console.log('- Routing está funcionando');
    console.log('- DOM está montado');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#0095FF' }}>✅ DrMindSetFit - Diagnóstico</h1>

      <div style={{
        background: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: '4px solid #00f',
        marginTop: '20px'
      }}>
        <h2>Status do Sistema:</h2>
        <p>✅ React: <strong>FUNCIONANDO</strong></p>
        <p>✅ TypeScript: <strong>COMPILADO</strong></p>
        <p>✅ Vite: <strong>SERVINDO</strong></p>
        <p>✅ Componente: <strong>RENDERIZADO</strong></p>
      </div>

      <div style={{
        background: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Próximos Passos:</h3>
        <p>1. Abra o Console do Navegador (F12)</p>
        <p>2. Veja se há erros JavaScript</p>
        <p>3. Verifique localStorage (Application tab)</p>
      </div>

      <button
        onClick={() => window.location.href = '/onboarding/step-1'}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#0095FF',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Ir para Onboarding
      </button>
    </div>
  );
}
