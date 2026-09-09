# Reabrir e pausar fases do ideathon

## Contexto

A tela de gestão de fases permite iniciar uma fase, mas não oferece uma ação explícita para tirar uma fase `LIVE` da operação, encerrá-la ou reabrir uma fase `CLOSED`. A API de fases já recebe atualizações de status, porém precisa aplicar as transições de forma consistente com a operação administrativa.

## Objetivo

Permitir que um administrador controle o ciclo operacional de uma fase diretamente na tela `/admin/ideathons/[id]/fases`:

- Pausar uma fase `LIVE` e retorná-la para `READY`, deixando-a editável.
- Concluir uma fase `LIVE`, alterando-a para `CLOSED`.
- Reabrir uma fase `CLOSED`, retornando-a para `READY`.

Dados existentes, incluindo avaliações já submetidas, devem ser preservados.

## Estados e transições

A rota `PATCH /api/admin/ideathons/[id]/phases/[phaseId]` continua sendo a autoridade para alterações de status. As transições permitidas são:

| Estado atual | Estado novo |
| --- | --- |
| `DRAFT` | `READY` |
| `READY` | `LIVE` |
| `LIVE` | `READY` |
| `LIVE` | `CLOSED` |
| `CLOSED` | `READY` |

Qualquer outra alteração de status deve retornar `409`. Alterações de nome e posição continuam permitidas conforme o comportamento atual, sem serem confundidas com uma transição de status.

Quando a fase deixa `LIVE`, os endpoints do avaliador deixam de disponibilizá-la para novas avaliações porque eles exigem `phase.status = LIVE`. Nenhum dado associado deve ser apagado.

O modo demo deve aplicar as mesmas transições do banco persistente.

## Interface

Na lista de fases:

- Fases `LIVE` exibem `Voltar para edição` e `Concluir fase`.
- Fases `CLOSED` exibem `Reabrir fase`.
- `Voltar para edição` muda diretamente para `READY`.
- `Concluir fase` e `Reabrir fase` pedem confirmação antes da requisição.
- Ações ficam desabilitadas enquanto a atualização estiver em andamento.
- Após sucesso, a lista local é atualizada e a mensagem de sucesso existente é exibida.
- Erros retornados pela API continuam sendo exibidos na mensagem de erro existente.

## Auditoria

As transições usam a auditoria já existente:

- `LIVE -> READY`: `PHASE_UPDATED`
- `LIVE -> CLOSED`: `PHASE_CLOSED`
- `CLOSED -> READY`: `PHASE_UPDATED`

## Testes e validação

Os testes devem cobrir as cinco transições válidas e rejeitar transições inválidas, incluindo `CLOSED -> LIVE` e `CLOSED -> DRAFT`. A validação final executará lint, typecheck, testes automatizados e build.
