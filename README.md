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

## Deploy na Vercel

Se este projeto estiver dentro do repositorio completo do Brain Master, configure `cerebro/empresa/projetos/ideathon-management` como **Root Directory** nas configuracoes do projeto da Vercel. Se o repositorio contiver somente esta pasta, use `.`.

Use estas configuracoes:

- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** deixe vazio para a Vercel gerenciar o `.next`
- **Install Command:** `npm install`

Nao configure `public` como Output Directory. Essa pasta e usada por sites estaticos, enquanto o Next.js gera e gerencia a saida `.next` automaticamente.
