# Ideathon Management

Fundacao visual do sistema de avaliacao de ideathons da Revvolucao.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Uma base Neon Postgres

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

As telas de negocio ainda usam fixtures locais. A camada de banco e a autenticacao basica ja estao disponiveis; o cadastro de ideathons, usuarios e avaliacoes sera conectado nas fases seguintes.

## Banco de dados

O schema persistente fica em `src/db/schema.ts` e a migration inicial em `drizzle/0000_initial.sql`.

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL` com a URL pooled do Neon.
3. Preencha `DIRECT_DATABASE_URL` com a URL direta do Neon para migrations.
4. Instale as novas dependencias com `npm install`.
5. Execute `npm run db:migrate`.
6. Preencha `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`.
7. Execute `npm run db:seed-admin` para criar o primeiro admin.
8. Remova `SEED_ADMIN_PASSWORD` do ambiente depois do primeiro seed.

Comandos disponiveis:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed-admin
```

O banco agora contem o modelo de ideathons, fases configuraveis, ideias, salas, avaliadores, configuracoes por fase, avaliacoes, notas Likert e auditoria. As telas ainda serao integradas a essas tabelas nas proximas etapas.

## Deploy na Vercel

Se este projeto estiver dentro do repositorio completo do Brain Master, configure `cerebro/empresa/projetos/ideathon-management` como **Root Directory** nas configuracoes do projeto da Vercel. Se o repositorio contiver somente esta pasta, use `.`.

Use estas configuracoes:

- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** deixe vazio para a Vercel gerenciar o `.next`
- **Install Command:** `npm install`

Nao configure `public` como Output Directory. Essa pasta e usada por sites estaticos, enquanto o Next.js gera e gerencia a saida `.next` automaticamente.
