
## % Gordura Corporal — Métodos Implementados (Fase 2)

### 1) Bioimpedância
- Valor direto informado pelo usuário.
- Utilizado sem inferência adicional.

### 2) Pollock 7 Dobras (Jackson & Pollock)
- Equação de densidade corporal específica por sexo
- Conversão padrão: Siri (1961)
- Requer: sexo, idade, soma das 7 dobras (mm)

### 3) Circunferências — US Navy
- Requer:
  - Masculino: altura, cintura, pescoço
  - Feminino: altura, cintura, pescoço, quadril
- Observação: depende do posicionamento correto da fita e pontos anatômicos.

### Regras do Engine
- Sem chute.
- Sem média.
- Sem fallback estimado.
- Dados insuficientes retornam `undefined` + notes.
