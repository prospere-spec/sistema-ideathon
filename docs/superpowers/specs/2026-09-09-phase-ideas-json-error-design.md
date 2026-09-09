# Correcao do carregamento de ideias por fase

## Contexto

Ao abrir a pagina de atribuicao de ideias a uma sala, o componente tenta executar `response.json()` sem validar o corpo retornado. O endpoint consulta a coluna `phase_ideas.presentation_order`, adicionada pela migration `0001_add_presentation_order.sql`; quando a consulta falha, o Next pode devolver uma resposta sem JSON e o erro original e mascarado por `Unexpected end of JSON input`.

## Objetivo

Fazer o endpoint retornar um erro JSON controlado quando o carregamento falhar e fazer o componente tratar respostas vazias ou nao-JSON sem gerar uma excecao opaca. Respostas bem-sucedidas e a funcionalidade de ordem de apresentacao devem permanecer inalteradas.

## Fluxo proposto

1. O endpoint `GET /api/admin/ideathons/[id]/phases/[phaseId]/ideas` executa suas consultas dentro de um `try/catch`.
2. Em caso de falha, registra o erro no servidor e retorna `NextResponse.json` com mensagem funcional e status `500`.
3. O componente usa um leitor de resposta tolerante: tenta interpretar JSON e, se o corpo estiver vazio ou invalido, usa uma mensagem padrao baseada no contexto.
4. O mesmo tratamento e aplicado ao carregamento inicial e as operacoes de atribuicao e atualizacao da ordem.

## Compatibilidade e migration

O contrato de sucesso continua contendo `phase`, `rooms` e `data`, incluindo `presentationOrder`. A migration `0001_add_presentation_order.sql` continua obrigatoria no banco persistente e deve ser executada no ambiente que apresenta a falha; o tratamento de erro nao deve ocultar uma divergencia de schema.

## Validacao

- Executar `npm run lint`.
- Executar `npm run typecheck`.
- Executar `npm test`.
- Executar `npm run build` se o ambiente permitir.
- Revisar o diff para confirmar que somente o fluxo de carregamento e mutacao da pagina foi alterado.
