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

Para executar os fluxos locais sem Neon, use no `cmd`:

```cmd
set DEMO_MODE=true&& set NEXT_PUBLIC_DEMO_MODE=true&& npm run dev
```

Entre em `http://localhost:3000/login` com qualquer e-mail e senha preenchidos. As APIs demo usam estado somente em memória e reiniciam ao reiniciar o servidor.

Se o projeto estiver em uma pasta sincronizada (como Google Drive) e o npm falhar ao criar `node_modules`, use uma cópia local não sincronizada para o desenvolvimento. O código e o lockfile permanecem no projeto; apenas as dependências instaladas ficam fora da pasta sincronizada.

## Validacao

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

As telas de negocio ainda usam fixtures locais, com excecao do cadastro de ideias e da preparacao de salas, distribuicao por fase e alocacao de avaliadores. A camada de banco e a autenticacao basica ja estao disponiveis; o cadastro de ideathons, usuarios e avaliacoes sera conectado nas fases seguintes.

## Modo demo

Para validar os fluxos localmente sem Neon, use um terminal separado:

```cmd
set DEMO_MODE=true&& set NEXT_PUBLIC_DEMO_MODE=true&& npm run dev
```

Acesse `http://localhost:3000/login` e use qualquer e-mail e senha preenchidos para entrar no painel demo. O estado das APIs demo fica somente na memoria do processo e reinicia ao reiniciar o servidor.

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

O banco agora contem o modelo de ideathons, fases configuraveis, ideias, salas, avaliadores, configuracoes por fase, avaliacoes, notas Likert e auditoria. O cadastro de ideias em `/admin/ideathons/[id]/projetos` grava a ideia, a equipe, os integrantes e os eventos de auditoria em uma transacao.

A preparacao operacional fica separada em `/admin/ideathons/[id]/salas`, `/admin/ideathons/[id]/fases/[phaseId]/ideias` e `/admin/ideathons/[id]/avaliadores`. O avaliador so recebe ideias de salas `LIVE` nas quais esta alocado.

## Deploy na Vercel

Se este projeto estiver dentro do repositorio completo do Brain Master, configure `cerebro/empresa/projetos/ideathon-management` como **Root Directory** nas configuracoes do projeto da Vercel. Se o repositorio contiver somente esta pasta, use `.`.

Use estas configuracoes:

- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** deixe vazio para a Vercel gerenciar o `.next`
- **Install Command:** `npm install`

Nao configure `public` como Output Directory. Essa pasta e usada por sites estaticos, enquanto o Next.js gera e gerencia a saida `.next` automaticamente.
