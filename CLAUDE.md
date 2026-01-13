# MindsetFit — Contexto para assistentes de código

Este repositório pertence ao projeto **DrMindSetFitApp / MindsetFit**.

## Princípios
- Manter **build verde** sempre: `npm run type-check` e `npm run build`.
- Mudanças **cirúrgicas**, sem quebrar estrutura existente.
- Priorizar UX premium mobile-first.
- Evitar arquivos duplicados e pastas legadas.

## Fluxo padrão de entrega
1) Aplicar patch
2) Validar `type-check` e `build`
3) `git add -A && git commit -m "..."`
4) `git push origin main`
5) Deploy: `vercel --prod`
