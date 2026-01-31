# MindsetFit Master Tooling (.mf_master)

## Regra máxima
**BUILD SEMPRE VERDE**. Qualquer alteração que quebre `npm run verify` é revertida.

## O que é oficial
- `mf_doctor.sh` → guardrails + sanity + `npm run verify`
- `mf_master.sh` → (se existir e estiver estável) orquestrador oficial

## Quarentena
- `.mf_master/_quarantine/legacy/` contém scripts históricos **NÃO OFICIAIS**.
- Nunca execute scripts de quarentena sem revisar e portar para o padrão atual.

## Padrão permitido
- Scripts **bash puros**.
- Geradores (node/python) devem ficar em arquivos separados (futuro: `generators/`).
- Não colar blocos híbridos no terminal. Sempre usar runner: `cat > file <<BASH` + `bash file`.

## Rotina obrigatória antes de qualquer patch
1. `./.mf_master/mf_doctor.sh`
2. Executar patch (script único, objetivo)
3. `./.mf_master/mf_doctor.sh` novamente
4. Commit + tag freeze quando estabilizar
