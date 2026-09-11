# Consistencia de UI/UX e Fluxo de Avaliacao

**Data:** 2026-09-11
**Status:** Aprovado para planejamento

## Objetivo

Eliminar a necessidade de retornar ao topo para concluir uma avaliacao e corrigir inconsistencias de navegacao, feedback e linguagem visual identificadas na auditoria de UI/UX.

## Escopo

### Avaliacao

- Exibir uma barra de acoes fixa no rodape da tela de avaliacao, em desktop e mobile.
- A barra mostrara progresso, estado de rede/salvamento, `Salvar rascunho` e `Enviar avaliacao`.
- Manter o cabecalho da pagina para contexto da ideia; a conclusao nao dependera dele.
- Colocar criterios e feedback no mesmo formulario semantico.
- Extrair a escala de notas para um componente de UI reutilizavel, com rotulos qualitativos acessiveis para os valores de 1 a 5.

### Envio e autosave

- Fazer a sincronizacao de rascunho retornar um resultado explicito de sucesso ou falha.
- Nunca substituir uma falha de salvamento pela mensagem de sucesso.
- Enquanto houver rascunho pendente e conexao, usar nova tentativa com atraso progressivo sem bloquear a edicao.
- Depois de enviar, redirecionar para a proxima ideia pendente da sala ou para a pagina inicial do avaliador.
- Preservar a confirmacao de envio no destino por parametro de URL e exibi-la como mensagem de sucesso.

### Navegacao e sistema visual

- Exibir uma navegacao alternativa abaixo de `lg`, sem esconder os destinos principais.
- Ajustar busca e notificacoes ao perfil em uso; o avaliador nunca recebera link administrativo.
- Padronizar todas as areas com cabecalho claro.
- Separar sucesso e erro nas telas que atualmente usam um mesmo estado visual para ambos.

## Arquitetura

- `EvaluatorVotingPage` continuara sendo responsavel pelo carregamento, autosave e envio, mas delegara a escala ao novo componente de UI e as acoes persistentes a uma secao local de barra de acoes.
- `AppShell` recebera dados derivados de `navigation` para busca, notificacoes e navegacao compacta, sem alterar rotas ou autorizacao.
- A pagina inicial do avaliador lera uma mensagem de sucesso da URL, a exibira uma vez e limpará o parametro para evitar repeticao ao atualizar.
- Telas administrativas com estado de carregamento ou mutacao separarao `notice` de `error`; excecoes renderizarao alerta de erro.

## Fluxos

1. O avaliador preenche criterios e feedback no mesmo formulario.
2. Cada alteracao entra no armazenamento local e na fila de autosave.
3. A barra fixa informa `Salvo`, `Salvando`, `Pendente`, `Sem conexao` ou erro de forma inequívoca.
4. Ao enviar, todos os criterios sao validados. Sucesso limpa o rascunho local e navega com confirmacao persistente.
5. Em mobile, a navegacao principal abre por um controle acessivel e conserva acesso aos mesmos destinos do desktop.

## Acessibilidade e responsividade

- A barra fixa respeitara area segura e adicionara espaco inferior ao conteudo para nao cobrir o feedback.
- O botao primario sera utilizavel no teclado e manterá estado `disabled` durante envio.
- A navegacao compacta tera rotulo acessivel, estado expandido e links focaveis.
- Alertas de falha usarao `role="alert"`; confirmacoes usarao `role="status"`.

## Validacao

- Testar envio da primeira e ultima ideia, incluindo redirecionamento e mensagem no destino.
- Testar autosave bem-sucedido, falho, offline e recuperacao de conexao.
- Testar navegação desktop, tablet e mobile para admin e avaliador.
- Executar `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e o fluxo e2e quando as dependencias estiverem disponiveis.

## Fora do escopo

- Alterar regras de autorizacao, persistencia, ranking ou criterios de avaliacao.
- Redesenhar toda a hierarquia visual das telas.
