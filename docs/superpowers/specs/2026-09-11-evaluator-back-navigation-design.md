# Retorno do navegador no painel do avaliador

## Objetivo

Quando o avaliador usar o botao Voltar do navegador a partir de uma tela de avaliacao, ele deve retornar ao painel do avaliador, e nunca a uma ideia avaliada anteriormente. O painel deve exibir imediatamente o status atualizado das avaliacoes enviadas.

## Escopo

- Interceptar a navegacao de historico iniciada na tela de avaliacao de uma ideia.
- Redirecionar o retorno para `/avaliador`.
- Atualizar os dados do painel ao chegar nessa rota, preservando a indicacao `Avaliacao enviada` para registros com status `SUBMITTED`.
- Manter o fluxo atual de avancar automaticamente para a proxima ideia pendente apos um envio bem-sucedido.

## Fluxo

1. O avaliador abre uma ideia a partir do painel.
2. A tela carrega a avaliacao e registra um listener para navegacao `popstate`.
3. Se o avaliador acionar o botao Voltar, o listener substitui a rota pela pagina `/avaliador`.
4. O painel executa novamente sua consulta de atribuicoes e avaliacoes no servidor.
5. Ideias cujo registro de avaliacao estiver como `SUBMITTED` aparecem com o status `Avaliacao enviada`; as demais continuam como `Avaliar ideia`.
6. Ao enviar uma avaliacao, o fluxo existente continua abrindo a proxima ideia pendente na mesma sala. Quando nao houver outra pendencia, ele segue para o painel com a confirmacao de envio.

## Limites e erros

- O listener e removido quando a tela de avaliacao e desmontada para evitar navegacoes duplicadas.
- O redirecionamento de retorno nao cria outra entrada no historico.
- A consulta do painel e a fonte de verdade para os status; nenhum status de envio sera mantido apenas no estado do cliente.

## Validacao

- Abrir uma ideia, enviar a avaliacao e avancar para outra ideia; usar o botao Voltar deve abrir o painel, nao a ideia anterior.
- Voltar ao painel depois de enviar uma avaliacao deve mostrar `Avaliacao enviada` para a ideia concluida.
- Confirmar que, apos envio, ainda ha avancar automatico para a proxima ideia pendente.
