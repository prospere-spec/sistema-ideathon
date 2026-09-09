# Retorno da fase para rascunho

## Contexto

Uma fase `LIVE` pode precisar ser completamente reconfigurada. Atualmente, retornar a fase para um estado editável não redefine o status das salas vinculadas, o que mantém bloqueadas as alterações de sala, distribuição de ideias e composição da banca.

## Objetivo

Permitir que o administrador use `LIVE -> DRAFT` para reabrir a preparação completa da fase. Todas as salas vinculadas devem acompanhar a transição e voltar para `DRAFT`.

## Transição e cascata

A rota `PATCH /api/admin/ideathons/[id]/phases/[phaseId]` aceitará `LIVE -> DRAFT`. A alteração e a cascata ocorrerão na mesma transação:

1. Atualizar o status da fase para `DRAFT`.
2. Atualizar para `DRAFT` todas as salas cujo `phaseId` corresponde à fase.
3. Preservar vínculos em `phaseIdeas` e `roomEvaluators`, ordem de apresentação e avaliações.
4. Registrar `PHASE_UPDATED` para a fase e `ROOM_UPDATED` para cada sala afetada.

O modo demo aplicará a mesma cascata em memória. As outras transições existentes permanecem inalteradas, incluindo `CLOSED -> READY`.

## Interface e permissões

Fases `LIVE` exibirão a ação `Voltar para rascunho`, com confirmação informando que as salas também serão redefinidas. Depois da operação:

- A gestão de salas permitirá editar nome, posição e status, respeitando as validações de cada status.
- A distribuição de ideias da fase aceitará novas atribuições e alterações.
- A composição de avaliadores das salas aceitará alterações.
- Nenhum vínculo será removido automaticamente.

Uma sala só poderá voltar a `LIVE` quando a fase estiver `LIVE`, conforme as regras existentes do endpoint de salas.

## Testes e validação

Os testes cobrirão `LIVE -> DRAFT`, a rejeição de `CLOSED -> DRAFT`, a cascata de todas as salas no modo demo e a preservação dos vínculos de ideias e avaliadores. A validação final executará testes, lint, typecheck e build.
