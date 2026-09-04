# Cálculo Ponderado e Envio Idempotente de Avaliações

**Data:** 2026-09-04  
**Status:** Aprovado pelo usuário para implementação

## 1. Objetivo

Implementar no backend o envio definitivo de uma avaliação, calculando sua nota ponderada de 0 a 100 e garantindo comportamento idempotente em repetições da requisição.

O ranking continuará sendo responsabilidade de uma etapa posterior. Nesta etapa, a fonte de verdade será `evaluations.final_score` para cada avaliação individual.

## 2. Fórmula

Cada nota recebida deve ser um inteiro de 1 a 5. A normalização será:

```text
nota_normalizada = ((nota - 1) / 4) * 100
```

A nota final será:

```text
nota_final = soma(nota_normalizada * peso / 100)
```

Os pesos precisam pertencer à configuração referenciada pela avaliação e somar exatamente 100. O resultado será arredondado para duas casas decimais e armazenado em `evaluations.final_score`.

## 3. Endpoint

```text
POST /api/evaluations/[id]/submit
```

Payload:

```json
{
  "scores": [
    { "criterionId": "uuid", "score": 4 }
  ],
  "feedback": "Observações opcionais"
}
```

O `evaluatorId` será obtido da sessão, nunca do payload.

## 4. Regras de autorização e domínio

- Exigir sessão de usuário com papel `EVALUATOR` e status `ACTIVE`.
- A avaliação deve existir e estar vinculada ao avaliador autenticado.
- `phase_ideas`, `phases`, `rooms` e `evaluation_configs` devem formar o mesmo contexto da avaliação.
- A sala da avaliação deve estar vinculada à fase e o avaliador deve estar alocado nela.
- A fase deve estar em `LIVE`.
- A configuração referenciada deve estar em `PUBLISHED` ou `LOCKED`.
- O payload deve conter exatamente um score para cada critério da configuração.
- Cada `criterionId` deve pertencer à configuração referenciada.
- Cada `score` deve ser um inteiro entre 1 e 5.
- A avaliação `SUBMITTED` fica somente leitura.

## 5. Transação e idempotência

O envio será executado em uma transação:

1. Recuperar a avaliação pelo seu identificador com bloqueio de linha dentro da transação.
2. Se ela já estiver `SUBMITTED`, retornar os dados persistidos com `200`, sem atualizar scores, `final_score`, feedback ou auditoria.
3. Se estiver `DRAFT`, validar o conjunto completo de critérios.
4. Fazer upsert dos scores da avaliação.
5. Calcular e gravar `final_score`.
6. Alterar o status para `SUBMITTED` e preencher `submitted_at`.
7. Criar um único registro `EVALUATION_SUBMITTED` em `audit_logs`.

A restrição única existente em `(phase_idea_id, evaluator_id)` continua sendo a proteção de banco contra avaliações duplicadas. Requisições repetidas, inclusive após timeout do cliente, retornam o mesmo resultado persistido.

## 6. Respostas

- `200`: envio concluído ou repetição idempotente.
- `401`: sessão ausente, inválida ou usuário inativo.
- `403`: usuário não é avaliador ou não está alocado na sala.
- `404`: avaliação ou contexto não encontrado.
- `409`: avaliação em estado incompatível ou fase/configuração não permite envio.
- `422`: payload incompleto, critério inválido, peso inválido ou nota fora da faixa.
- `500`: erro inesperado sem detalhes internos.

## 7. Testes

- Normalizar os cinco valores possíveis da escala.
- Calcular corretamente uma configuração de critério único com peso 100.
- Calcular múltiplos critérios e arredondamento.
- Rejeitar pesos cuja soma não seja 100.
- Rejeitar score ausente, duplicado, não inteiro ou fora de 1–5.
- Rejeitar critério de outra configuração.
- Rejeitar envio fora da fase `LIVE` ou sem alocação do avaliador.
- Enviar uma avaliação `DRAFT` e verificar scores, nota final, status, timestamp e auditoria.
- Repetir o envio e verificar resposta `200` com os mesmos dados, sem nova auditoria e sem alteração.
