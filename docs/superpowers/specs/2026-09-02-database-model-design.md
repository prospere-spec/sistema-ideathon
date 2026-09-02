# Modelo de Dados e Banco do Ideathon Management

**Data:** 2026-09-02  
**Status:** Aprovado para planejamento da implementação

## 1. Objetivo

Substituir as fixtures locais do primeiro módulo por um núcleo persistente e seguro para:

- administrar ideathons;
- cadastrar ideias exclusivamente pelo admin;
- configurar qualquer quantidade de fases, de uma única fase a várias rodadas;
- configurar critérios, pesos e níveis Likert por fase;
- criar salas e alocar manualmente ideias e avaliadores;
- registrar rascunhos e avaliações definitivas;
- calcular ranking ponderado de 0 a 100;
- acompanhar o progresso durante uma banca síncrona;
- preservar o histórico quando uma ideia avançar e for avaliada novamente.

## 2. Decisões técnicas

- Banco: Neon Postgres.
- ORM e migrations: Drizzle ORM e Drizzle Kit.
- Autenticação: Auth.js com sessões persistidas no Neon.
- Login inicial: o admin cria uma senha temporária para o avaliador.
- Senhas: armazenadas somente como hash; o primeiro acesso exige troca.
- IDs: UUID.
- Datas: timestamps com timezone.
- Idioma da aplicação: português do Brasil.
- Atualização do ranking: polling inicial de cinco segundos.
- Fonte de verdade do ranking: avaliações enviadas, nunca fixtures ou classificação manual.

## 3. Modelo de domínio

### 3.1 Usuários e autenticação

#### `users`

Armazena o perfil da aplicação e os dados usados pelo Auth.js.

- `id`
- `name`
- `email`, único e normalizado
- `password_hash`
- `role`: `ADMIN` ou `EVALUATOR`
- `status`: `ACTIVE` ou `INACTIVE`
- `must_change_password`
- `created_at`
- `updated_at`

As tabelas padrão necessárias ao adapter do Auth.js (`accounts`, `sessions` e `verification_tokens`) serão adicionadas conforme o modo de sessão escolhido na implementação. O papel e o status ficarão no registro de `users` e serão validados no servidor.

### 3.2 Ideathon, fases e ideias

#### `ideathons`

- `id`
- `name`
- `slug`, único
- `description`
- `status`: `DRAFT`, `READY`, `LIVE` ou `CLOSED`
- `timezone`
- `starts_at`
- `ends_at`
- `created_by`
- `created_at`
- `updated_at`

Um ideathon precisa ter pelo menos uma fase. O `slug` é usado nas URLs, mas nenhuma regra de negócio dependerá de um slug fixo.

#### `phases`

- `id`
- `ideathon_id`
- `name`
- `position`
- `status`: `DRAFT`, `READY`, `LIVE` ou `CLOSED`
- `starts_at`
- `ends_at`
- `created_at`
- `updated_at`

Restrições:

- a fase pertence a um único ideathon;
- `position` é único dentro do ideathon;
- o admin pode adicionar, renomear, reordenar e remover fases enquanto o ideathon estiver em `DRAFT`;
- não existe conjunto obrigatório de fases;
- uma única fase pode conter todas as equipes;
- um ideathon só pode ter uma fase `LIVE` por vez;
- uma fase usada não é apagada fisicamente.

#### `teams`

- `id`
- `ideathon_id`
- `name`
- `created_at`
- `updated_at`

O nome da equipe/startup é separado da ideia para evitar repetição e permitir que a mesma startup apareça em fases posteriores.

#### `team_members`

- `id`
- `team_id`
- `name`
- `role`
- `email`, opcional
- `position`

Os integrantes são dados informativos neste módulo e não possuem login.

#### `ideas`

- `id`
- `ideathon_id`
- `team_id`
- `name`
- `problem`
- `solution`
- `audience`
- `differentiation`
- `category`
- `pitch_deck_url`
- `video_pitch_url`
- `website_url`
- `status`: `ACTIVE` ou `ARCHIVED`
- `created_at`
- `updated_at`

Uma ideia pertence a um único ideathon e é cadastrada somente pelo admin. Ela pode participar de várias fases, mas não é duplicada ao avançar.

#### `phase_ideas`

Representa a participação de uma ideia em uma fase.

- `id`
- `phase_id`
- `idea_id`
- `room_id`, opcional até a alocação
- `status`: `PENDING`, `QUALIFIED` ou `ELIMINATED`
- `rank`, opcional
- `source_phase_idea_id`, opcional, referência à participação anterior
- `selected_by`, opcional
- `selected_at`, opcional
- `created_at`
- `updated_at`

Restrições:

- uma ideia só pode aparecer uma vez em cada fase;
- uma ideia deve estar em no máximo uma sala dentro da fase;
- o vínculo com `source_phase_idea_id` permite auditar o avanço manual;
- a mesma ideia pode ter registros em várias fases.

### 3.3 Salas e bancas

#### `rooms`

- `id`
- `phase_id`
- `name`
- `position`
- `status`: `DRAFT`, `READY`, `LIVE` ou `CLOSED`
- `created_at`
- `updated_at`

#### `room_evaluators`

- `room_id`
- `evaluator_id`
- `created_at`

Chave única composta por `room_id` e `evaluator_id`. Um avaliador pode estar em várias salas do mesmo evento.

As ideias são vinculadas à sala por `phase_ideas.room_id`. Isso garante uma única sala por ideia dentro da fase e evita duplicidade acidental quando um avaliador está em várias salas.

O servidor deve validar que a sala informada pertence à mesma fase de `phase_ideas`. Essa relação não deve depender apenas da URL ou de uma validação no cliente.

Uma sala só pode ser iniciada quando tiver pelo menos um avaliador e uma ideia. O admin faz todas as alocações manualmente.

### 3.4 Configuração da avaliação

#### `evaluation_configs`

- `id`
- `phase_id`
- `version`
- `status`: `DRAFT`, `PUBLISHED` ou `LOCKED`
- `published_at`
- `locked_at`
- `created_at`
- `updated_at`

Cada fase possui uma configuração própria. A configuração é publicada antes de a fase ficar `LIVE` e fica bloqueada quando a fase é iniciada. Uma configuração utilizada não é editada retroativamente.

#### `evaluation_criteria`

- `id`
- `evaluation_config_id`
- `name`
- `description`
- `position`
- `weight`
- `created_at`
- `updated_at`

Restrições:

- `weight` é inteiro positivo;
- a soma dos pesos da configuração deve ser exatamente 100;
- `position` é único na configuração;
- uma configuração precisa ter pelo menos um critério.

#### `scale_levels`

- `id`
- `evaluation_config_id`
- `value`, de 1 a 5
- `label`
- `description`

Cada configuração terá cinco níveis. Os rótulos e descrições podem ser personalizados antes do bloqueio.

### 3.5 Avaliações

#### `evaluations`

- `id`
- `phase_idea_id`
- `evaluator_id`
- `room_id`
- `evaluation_config_id`
- `status`: `DRAFT` ou `SUBMITTED`
- `feedback`
- `final_score`, preenchida no envio
- `submitted_at`, opcional
- `created_at`
- `updated_at`

Chave única composta por `phase_idea_id` e `evaluator_id`. Essa regra permite uma avaliação por avaliador e ideia em cada fase, mas permite nova avaliação da mesma ideia em outra fase.

O `room_id` e o `evaluation_config_id` são armazenados como contexto histórico da avaliação. Alterações futuras de alocação ou configuração não mudam o significado de uma avaliação já enviada.

#### `evaluation_scores`

- `id`
- `evaluation_id`
- `criterion_id`
- `score`, inteiro de 1 a 5
- `created_at`
- `updated_at`

Chave única composta por `evaluation_id` e `criterion_id`. O envio exige exatamente uma nota para cada critério da configuração da fase.

O servidor deve validar que cada `criterion_id` pertence à configuração referenciada pela avaliação.

### 3.6 Auditoria

#### `audit_logs`

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata` em JSONB
- `created_at`

Serão auditados, no mínimo, criação de usuários, mudanças de configuração, alocações, transições de fase, avanço de ideias e envio definitivo de avaliações.

## 4. Ciclo de vida

### Ideathon

```text
DRAFT → READY → LIVE → CLOSED
```

- `DRAFT`: edição de dados, fases, ideias, salas e alocações.
- `READY`: pré-condições validadas.
- `LIVE`: existe uma fase ativa.
- `CLOSED`: todas as atividades do evento foram encerradas.

### Fase

```text
DRAFT → READY → LIVE → CLOSED
```

- `DRAFT`: configuração e alocação editáveis.
- `READY`: configuração publicada e salas prontas.
- `LIVE`: avaliadores podem votar.
- `CLOSED`: somente consulta, ranking e avanço manual.

## 5. Fluxo de avaliação


1. O avaliador autentica com sua conta ativa.
2. O servidor lista somente as ideias das salas vinculadas a ele na fase `LIVE`.
3. Ao abrir uma ideia, o servidor recupera ou cria um registro `DRAFT`.
4. As notas e o feedback podem ser salvos parcialmente.
5. O envio valida sessão, papel, sala, fase, configuração, completude e faixa das notas.
6. Uma transação grava as notas, calcula `final_score`, marca `SUBMITTED` e cria o log de auditoria.
7. Uma avaliação `SUBMITTED` fica somente leitura para o avaliador.
8. O admin consulta o ranking parcial e o progresso da fase.
9. Ao fechar a fase, o admin seleciona manualmente as ideias qualificadas e cria suas participações na próxima fase.

## 6. Cálculo e ranking

Para cada critério:

```text
nota_normalizada = ((nota - 1) / 4) * 100
```

Para cada avaliação:

```text
nota_final = Σ(nota_normalizada × peso / 100)
```

O ranking por fase e ideia exibirá:

- nota final de 0 a 100;
- média por critério;
- avaliações esperadas;
- avaliações recebidas;
- percentual de conclusão;
- indicador de nota parcial;
- posição provisória;
- horário da última atualização.

Somente avaliações `SUBMITTED` participam do ranking. Empates devem ser exibidos com a mesma nota e resolvidos por regra explícita do produto antes da divulgação final; a primeira implementação não usará horário de envio como desempate silencioso.

## 7. Segurança

- `/admin/*` exige sessão com papel `ADMIN`.
- `/avaliador/*` exige sessão com papel `EVALUATOR`.
- Cada operação do avaliador valida o vínculo atual com a sala no servidor.
- IDs recebidos pela URL nunca concedem acesso por si só.
- Usuários inativos não iniciam sessão nem executam operações.
- Senhas temporárias não serão armazenadas em texto puro.
- O admin poderá redefinir a senha temporária por operação auditada.
- Mensagens de erro não expõem SQL, hashes, tokens ou dados de outras salas.

## 8. API e responsabilidades

As mutações e leituras autenticadas serão implementadas por Route Handlers no App Router. As regras de domínio ficarão em queries e serviços no servidor, não em componentes React.

Endpoints previstos:

- `POST /api/admin/ideathons`
- `PATCH /api/admin/ideathons/:id`
- `POST/PATCH/DELETE /api/admin/ideathons/:id/phases`
- `POST/PATCH /api/admin/ideathons/:id/ideas`
- `POST/PATCH /api/admin/ideathons/:id/rooms`
- `POST /api/admin/users`
- `GET /api/evaluator/phases/:phaseId/ideas`
- `GET/PATCH /api/evaluations/:id`
- `POST /api/evaluations/:id/submit`
- `GET /api/admin/ideathons/:id/results?phaseId=...`

O envio definitivo deve ser idempotente. Repetir a mesma requisição não cria nova avaliação nem altera uma avaliação já enviada.

## 9. Erros de domínio

- `401`: sessão ausente ou inválida.
- `403`: papel ou vínculo com sala insuficiente.
- `404`: recurso inexistente ou não visível para o usuário.
- `409`: estado incompatível, configuração bloqueada, avaliação já enviada ou conflito de alocação.
- `422`: dados, pesos, notas ou transição inválidos.
- `500`: erro inesperado, sem detalhes internos na resposta.

A interface manterá os dados digitados quando possível e diferenciará validação, conflito e indisponibilidade temporária.

## 10. Testes de aceite

- Criar ideathon com uma fase padrão.
- Adicionar, remover e reordenar fases em rascunho.
- Criar evento de uma fase com todas as equipes.
- Criar evento com várias fases e configurações diferentes.
- Bloquear alterações após início da fase.
- Validar pesos somando 100%.
- Impedir ideia duplicada na mesma fase.
- Permitir a mesma ideia em fases posteriores.
- Permitir avaliador em várias salas.
- Impedir acesso do avaliador a ideias fora de suas salas.
- Salvar e recuperar avaliação parcial.
- Impedir envio incompleto.
- Enviar avaliação uma única vez e rejeitar reenvio.
- Calcular corretamente nota ponderada e conversão para 0–100.
- Exibir ranking parcial e completo.
- Avançar ideias manualmente preservando o histórico.
- Atualizar resultados por polling.
- Validar permissões, migrações e seed de desenvolvimento.

## 11. Fora do escopo inicial

- Cadastro de ideias por equipes participantes.
- Importação de ideias por planilha.
- Distribuição automática de ideias ou avaliadores.
- Avaliador avaliando a mesma ideia duas vezes na mesma fase.
- Reabertura livre de avaliação enviada.
- Desempate automático não configurado pelo admin.
- Serviço externo de realtime.
- Página pública do ideathon.
