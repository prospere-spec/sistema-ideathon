# Ranking por fase e sala

## Comportamento aprovado

- Manter a Classificação Geral como visualização inicial, reunindo todas as ideias elegíveis da fase, de todas as salas.
- Exibir um seletor de fase permanente e a alternância Geral da fase / Por sala.
- Na visualização Por sala, mostrar uma tabela por sala da fase, com posições independentes, notas e progresso. Incluir salas vazias e um grupo Sem sala quando necessário.
- Usar as regras atuais de notas: média das avaliações enviadas, empates como 1, 1, 3 e ausência de posição para ideias sem nota. A posição local não altera a posição geral.
- Manter as fases separadas: não somar notas de fases diferentes. Consultar também fases encerradas.
- Atualizar a cada cinco segundos; ao trocar de fase, descartar a exibição anterior e ignorar respostas atrasadas.
- Busca e status apenas filtram a exibição, sem recalcular posições. CSV exporta o mesmo recorte exibido, com fase, sala, visualização e posição correspondente.

## Implementação

`buildRankingResults` reaproveita `buildRanking` para calcular o geral e cada sala separadamente. A API retorna `data` e `summary` gerais, mais `roomRankings`. O modo demo usa o mesmo agregador. A página compartilha `RankingTable` entre as duas visualizações e identifica explicitamente o resumo geral e os resumos locais.

Não há alteração de schema ou migration. Os testes de regressão cobrem posições independentes, empates, preservação do geral, médias, progresso, pendentes, salas vazias e ideias sem sala. Execução local de testes e build permanece indisponível no ambiente de dependências informado pelo usuário; revisão estática e `git diff --check` são realizadas antes do commit.
