# Salas, Bancas e Regras de Acesso

**Data:** 2026-09-04  
**Status:** Aprovado pelo usuário para implementação

## 1. Objetivo

Permitir que o admin prepare a operação de avaliação por fase, criando salas, distribuindo ideias e alocando avaliadores. O avaliador só poderá consultar e avaliar ideias das salas às quais estiver vinculado.

As operações usarão as tabelas existentes `rooms`, `phase_ideas` e `room_evaluators`. Não será necessária migration.

## 2. Telas administrativas

### 2.1 Salas

Rota: `/admin/ideathons/[id]/salas`

- Listar salas do ideathon agrupadas ou filtradas por fase.
- Criar sala com nome, fase e posição.
- Renomear e reordenar salas enquanto a fase permitir edição.
- Preparar, iniciar e encerrar uma sala.
- Exibir quantidade de ideias e avaliadores por sala.
- Bloquear edição da composição depois que a sala estiver `LIVE`.

### 2.2 Ideias por fase

Rota: `/admin/ideathons/[id]/fases/[phaseId]/ideias`

- Listar ideias ativas do ideathon e sua participação na fase.
- Criar o vínculo `phase_ideas` para incluir uma ideia na fase.
- Atribuir ou remover a ideia de uma sala.
- Mostrar conflitos quando a ideia já estiver em outra sala da mesma fase.
- Preservar o vínculo com a fase ao remover uma ideia da sala.

### 2.3 Avaliadores

Rota: `/admin/ideathons/[id]/avaliadores`

- Listar usuários ativos com papel `EVALUATOR`.
- Exibir as salas atribuídas a cada avaliador.
- Atribuir e remover avaliadores de uma sala.
- Permitir que um avaliador esteja em várias salas do mesmo ideathon.
- Bloquear alterações da banca depois que a sala estiver `LIVE`.

## 3. APIs administrativas

### Salas

```text
GET  /api/admin/ideathons/[id]/rooms
POST /api/admin/ideathons/[id]/rooms
PATCH /api/admin/ideathons/[id]/rooms/[roomId]
DELETE /api/admin/ideathons/[id]/rooms/[roomId]
```

O `POST` criará a sala em `DRAFT`. O `PATCH` permitirá nome, posição e transições de status. Uma sala `READY` exigirá ao menos uma ideia e um avaliador. Uma sala `LIVE` exigirá também fase `LIVE`. Salas usadas não serão apagadas fisicamente; uma sala vazia em `DRAFT` poderá ser excluída, e uma sala usada será encerrada.

### Ideias por fase

```text
GET /api/admin/ideathons/[id]/phases/[phaseId]/ideas
PUT /api/admin/ideathons/[id]/phases/[phaseId]/ideas/[ideaId]/room
```

O `PUT` receberá `{ "roomId": "uuid" | null }`. Se a ideia ainda não participar da fase, o servidor criará o registro `phase_ideas`; se `roomId` for nulo, preservará a participação e removerá somente a sala. O servidor validará que a fase, a ideia e a sala pertencem ao mesmo ideathon, que a sala pertence à fase e que a sala ainda aceita alterações. A operação será idempotente para o mesmo `roomId`.

### Avaliadores

```text
GET /api/admin/ideathons/[id]/evaluators
PUT /api/admin/ideathons/[id]/rooms/[roomId]/evaluators
```

O `PUT` receberá `{ "evaluatorIds": ["uuid"] }` e substituirá atomicamente a composição da banca. O servidor aceitará somente usuários ativos com papel `EVALUATOR`, validará que a sala pertence ao ideathon e rejeitará alteração em sala `LIVE` ou `CLOSED`.

## 4. Regras de estado

- `DRAFT`: sala e composição editáveis.
- `READY`: exige pelo menos uma ideia e um avaliador; composição ainda pode ser ajustada.
- `LIVE`: exige fase `LIVE`, composição válida e bloqueia assignments.
- `CLOSED`: somente consulta.

A transição para `READY` ou `LIVE` será validada no servidor, nunca inferida apenas pela interface. Uma fase pode ter várias salas operando simultaneamente, desde que cada uma tenha composição válida. A regra de uma única fase `LIVE` por ideathon continua sendo aplicada pela configuração existente.

## 5. Acesso do avaliador

Será criado ou completado o endpoint:

```text
GET /api/evaluator/phases/[phaseId]/ideas
```

Ele retornará somente ideias de `phase_ideas` que:

- pertençam à fase solicitada;
- estejam vinculadas a uma sala `LIVE`;
- estejam em uma fase `LIVE`;
- pertençam a uma sala relacionada ao avaliador autenticado em `room_evaluators`.

O endpoint de envio de avaliação também exigirá `room.status = LIVE`, além das validações já implementadas de fase, configuração e vínculo do avaliador. Requisições de admin para endpoints de avaliador e vice-versa serão rejeitadas por papel.

## 6. Transações e auditoria

- Criação, edição e transição de sala serão transacionais.
- Atribuição de ideia criará ou atualizará somente o `room_id` do `phase_idea` dentro da fase validada.
- Atribuição de avaliadores removerá e recriará os vínculos da sala na mesma transação.
- Cada mutação criará registro em `audit_logs` com ator, sala/fase e composição afetada.
- Conflitos de alocação retornarão `409` sem alterar parte da operação.

## 7. Testes

- Criar sala vinculada à fase correta.
- Rejeitar sala de ideathon ou fase inexistente.
- Rejeitar nomes e posições duplicados.
- Impedir `READY` sem ideia ou avaliador.
- Impedir `LIVE` fora de fase `LIVE`.
- Impedir atribuição de ideia de outro ideathon ou outra fase.
- Impedir ideia em duas salas na mesma fase.
- Permitir remoção de sala preservando `phase_ideas`.
- Aceitar somente avaliadores ativos com papel correto.
- Permitir um avaliador em várias salas.
- Bloquear alterações após `LIVE`.
- Retornar somente ideias das salas do avaliador.
- Verificar auditoria e atomicidade das mutações.
