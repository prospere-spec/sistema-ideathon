# Ideathon Management

Fundacao visual do sistema de avaliacao de ideathons da Revvolucao.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/admin` para visualizar a dashboard demonstrativa.

Se o projeto estiver em uma pasta sincronizada (como Google Drive) e o npm falhar ao criar `node_modules`, use uma cópia local não sincronizada para o desenvolvimento. O código e o lockfile permanecem no projeto; apenas as dependências instaladas ficam fora da pasta sincronizada.

## Validacao

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Esta etapa usa fixtures locais e nao possui banco, autenticacao ou persistencia. Esses recursos serao adicionados nas fases seguintes do plano do projeto.
