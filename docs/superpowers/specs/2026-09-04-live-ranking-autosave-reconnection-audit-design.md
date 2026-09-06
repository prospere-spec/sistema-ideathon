# Ranking em Tempo Real, Autosave, Reconexão e Auditoria

**Data:** 2026-09-04  
**Status:** Aprovado pelo usuário para implementação

## 1. Objetivo

Substituir as fixtures restantes do fluxo de avaliação por dados persistidos, permitir que o avaliador continue trabalhando durante falhas temporárias de rede e tornar o histórico de operações consultável pelo admin.

O ranking usará polling de cinco segundos, conforme a decisão técnica existente. Não será introduzido WebSocket ou SSE nesta etapa.

## 2. Avaliação e autosave

### Endpoint

```text
GET   /api/evaluator/phases/[phaseId]/ideas/[ideaId]/evaluation
PATCH /api/evaluator/phases/[phaseId]/ideas/[ideaId]/evaluation
```

O servidor deve validar sessão de avaliador ativo, fase `LIVE`, sala `LIVE`, alocação na sala, vínculo da ideia com a fase e configuração de avaliação disponível.

O `GET` recuperará ou criará a avaliação `DRAFT` usando a chave única de fase, ideia e avaliador. A resposta conterá o identificador da avaliação, a ideia, os critérios com seus pesos, scores existentes, feedback e status.

O `PATCH` aceitará scores parciais e feedback. Scores enviados devem pertencer à configuração da avaliação e estar entre 1 e 5. Uma avaliação `SUBMITTED` será somente leitura e retornará `409` para tentativa de autosave.

Criação e alterações efetivas de rascunho serão auditadas. Alterações idênticas não criarão registros de auditoria adicionais.

### Cliente

- Persistir imediatamente o último estado em `localStorage`.
- Usar uma chave por avaliação, sem armazenar credenciais ou dados de sessão.
- Enviar alterações com debounce de 800 ms.
- Manter estado e fila local quando `navigator.onLine` for falso ou a requisição falhar por rede.
- Ao receber o evento `online`, reenviar o estado pendente.
- Usar retry progressivo para falhas temporárias, sem bloquear a edição.
- Ao abrir a tela, comparar `updatedAt` local e remoto; o estado local mais novo será reenviado.
- Se o servidor estiver mais novo, ele será a fonte de verdade e a cópia local será substituída.
- Ao submeter com sucesso, limpar a cópia local e bloquear edição.
- Se o autosave receber `409` por avaliação enviada, descartar o rascunho local e exibir o estado somente leitura.

## 3. Ranking

### Endpoint

```text
GET /api/admin/ideathons/[id]/results?phaseId=uuid
```

O servidor verificará que a fase pertence ao ideathon e agregará somente avaliações `SUBMITTED` de seu contexto histórico.

Para cada ideia da fase, a resposta conterá:

- nota final média entre as avaliações enviadas;
- média por critério;
- avaliações esperadas, calculadas pelos avaliadores da sala;
- avaliações recebidas;
- percentual de conclusão;
- estado `PENDING`, `PARTIAL` ou `COMPLETE`;
- posição provisória;
- timestamp da última atualização.

Ideias sem sala ou sem avaliações continuarão visíveis como pendentes. O ranking será ordenado por nota final decrescente entre ideias com pelo menos uma avaliação. Empates terão a mesma posição e não usarão horário como desempate silencioso.

### Cliente

- Substituir as fixtures da tela de resultados pelo endpoint.
- Permitir seleção de fase quando houver mais de uma.
- Atualizar os dados a cada cinco segundos.
- Pausar polling quando a aba estiver oculta ou offline.
- Fazer nova leitura imediatamente ao voltar para a aba ou receber `online`.
- Exibir estado de conexão e horário da última atualização.
- Preservar filtros de busca/status localmente durante as atualizações.

## 4. Auditoria

### Endpoint

```text
GET /api/admin/ideathons/[id]/audit-logs
```

Somente admins poderão consultar logs do ideathon. A consulta aceitará limite e filtros por `action` e `entityType`, retornando ator, ação, entidade, metadata e data. Logs de outras entidades ou ideathons não serão expostos.

Serão exibidos, no mínimo:

- criação e alteração de ideias;
- criação, alteração e transição de salas;
- distribuição de ideias;
- alocação de avaliadores;
- criação e autosave efetivo de avaliações;
- envio definitivo de avaliações.

Uma tela administrativa em `/admin/ideathons/[id]/auditoria` exibirá os eventos mais recentes com filtros e estados de carregamento/erro.

## 5. Consistência e erros

- O servidor continuará sendo a fonte de verdade para autorização, status e cálculo.
- Autosave não poderá modificar avaliação `SUBMITTED`.
- Submit definitivo continuará idempotente e não criará auditoria duplicada.
- Erros de validação retornarão `422`; vínculo ou papel insuficiente, `401/403`; estado incompatível, `409`; falha inesperada, `500`.
- Falhas de rede no cliente não apagarão dados locais.
- Não haverá migration.

## 6. Testes

- Recuperar e criar avaliação `DRAFT` com acesso autorizado.
- Rejeitar acesso fora da sala/fase ou com sala não `LIVE`.
- Salvar scores parciais e feedback.
- Rejeitar critérios externos, notas fora da faixa e autosave após submit.
- Agregar médias, avaliações esperadas, recebidas e progresso.
- Manter empates na mesma posição.
- Atualizar ranking após nova avaliação enviada.
- Restaurar estado local mais novo e preferir estado remoto mais novo.
- Enfileirar autosave offline e reenviar após reconexão.
- Consultar auditoria com filtros e isolamento por ideathon.
