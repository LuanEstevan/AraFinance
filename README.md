# Ara Finance

Controle com clareza. Viva melhor.

Ara Finance e um aplicativo de controle financeiro pessoal criado para organizar contas, lancamentos, metas e acompanhamento mensal de receitas e despesas.

Esta versao do projeto foi reorganizada para React + Vite + TypeScript, mantendo a base visual e funcional existente e preparando o app para evoluir para uma arquitetura SaaS mais segura e escalavel.

## Status atual

- Aplicativo React com Vite.
- Codigo principal convertido de JavaScript para TypeScript.
- Arquivos ativos em `.tsx`, sem uso de `.jsx`.
- Supabase configurado por variaveis de ambiente.
- Estrutura ajustada para o padrao Vite com pasta `src`.
- Configuracao inicial de TypeScript criada.
- Deploy preparado para Vercel.

## Stack

- React 18
- TypeScript
- Vite
- Supabase Auth e Database
- Recharts
- Vercel

## Estrutura do projeto

```text
.
|-- index.html
|-- package.json
|-- tsconfig.json
|-- vite.config.js
|-- vercel.json
|-- .env.example
`-- src
    |-- App.tsx
    |-- main.tsx
    `-- vite-env.d.ts
```

## O que foi feito nesta migracao

### TypeScript

- `main.jsx` foi convertido para `src/main.tsx`.
- `App.jsx` foi convertido para `src/App.tsx`.
- O import principal agora usa `import App from './App'`.
- Foi criado `src/vite-env.d.ts` para suporte ao Vite com TypeScript.
- Foi criado `tsconfig.json`.
- Foi adicionado o script `typecheck`.

### Organizacao Vite

- O `index.html` aponta para `/src/main.tsx`.
- Os arquivos principais do app ficam dentro de `src`.
- A raiz do projeto fica reservada para configuracoes, documentacao e arquivos de ambiente.

### Supabase

As credenciais do Supabase foram retiradas do codigo principal e passaram a usar variaveis de ambiente:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

O arquivo `.env.example` mostra o formato esperado.

## Configuracao local

1. Instale as dependencias:

```bash
npm install
```

2. Configure as variaveis de ambiente:

```bash
cp .env.example .env.local
```

Depois preencha:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

3. Rode o projeto:

```bash
npm run dev
```

4. Gere uma build de producao:

```bash
npm run build
```

5. Rode a checagem de TypeScript:

```bash
npm run typecheck
```

## Funcionalidades atuais

- Cadastro e login com Supabase Auth.
- Dashboard financeiro mensal.
- Lancamentos de receitas e despesas.
- Contas bancarias e cartoes.
- Categorias financeiras.
- Parcelamentos.
- Lancamentos recorrentes.
- Metas financeiras.
- Historico e busca.
- Backup e restauracao por codigo.
- Persistencia dos dados no Supabase.

## Observacoes importantes

Esta versao ainda usa uma tabela central `user_data` para armazenar os dados financeiros do usuario. Isso funciona para o aplicativo pessoal atual, mas nao e o modelo ideal para um SaaS multiusuario em producao.

Para transformar o Ara Finance em um SaaS completo, o proximo passo arquitetural e migrar para um banco relacional com tabelas como:

- `organizations`
- `organization_members`
- `profiles`
- `accounts`
- `transactions`
- `goals`
- `paid_bills`
- `audit_logs`

Tambem sera necessario implementar Row Level Security, permissoes por papel, auditoria, backups, logs, monitoramento e ambientes separados de staging/producao.

## Proximos passos recomendados

1. Rodar `npm install`.
2. Rodar `npm run build`.
3. Rodar `npm run typecheck`.
4. Corrigir eventuais erros de TypeScript.
5. Separar `App.tsx` em componentes e modulos menores.
6. Criar tipos centrais para contas, lancamentos, metas e dados do usuario.
7. Criar uma camada `src/lib/supabase.ts`.
8. Planejar a migracao de `user_data` para tabelas relacionais.
9. Implementar seguranca SaaS com RLS, organizacoes e auditoria.

## Deploy

O projeto esta preparado para deploy na Vercel usando:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Antes do deploy, configure as mesmas variaveis de ambiente na Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Versao

Versao atual do app: `1.6.1`.

Inicio do projeto: 11 de abril de 2026.
