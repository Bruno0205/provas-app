# Provas App

Aplicacao full-stack para gerenciar perguntas, com:
- `server` (Node.js + Express + TypeScript)
- `client` (React + Vite + TypeScript)

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+

## 1) Instalar dependencias

No terminal, dentro da pasta `provas-app`:

```bash
cd server
npm install

cd ../client
npm install
```

## 2) Rodar em desenvolvimento

Use **2 terminais**.

### Terminal 1 - Backend

```bash
cd server
npm run dev
```

Backend esperado em: `  `

### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

Frontend esperado em: `http://localhost:5173`

## 3) Como acessar

- Abra `http://localhost:5173` no navegador.
- O frontend consome a API em `http://localhost:4000`.

## Scripts disponiveis

### Server (`/server`)

- `npm run dev`: roda com recarregamento automatico (`ts-node-dev`)
- `npm run build`: compila TypeScript para `dist/`
- `npm run start`: executa versao compilada (`dist/index.js`)
- `npm run test:acceptance`: roda os testes de aceitacao com Cucumber (API end-to-end)
- `npm run test:acceptance:headed`: roda os testes de aceitacao com formato de saida alternativo

### Client (`/client`)

- `npm run dev`: inicia Vite em modo desenvolvimento
- `npm run build`: gera build de producao
- `npm run preview`: serve localmente o build gerado

## Rodar em modo producao (opcional)

### Backend

```bash
cd server
npm run build
npm run start
```

### Frontend

```bash
cd client
npm run build
npm run preview
```

## Solucao de problemas rapida

- Se a porta 4000 estiver ocupada, rode o backend com `PORT=4001` (PowerShell: `$env:PORT=4001`).
- Se mudar a porta do backend, atualize a constante `BASE` em `client/src/api.ts`.
- Se houver erro de CORS, confirme se o frontend esta em `http://localhost:5173`.

## Testes de aceitacao (Cucumber + Gherkin)

Os testes de aceitacao foram implementados no backend com Cucumber, cobrindo fluxos reais da API:

- CRUD de questoes
- criacao e geracao de provas (incluindo regras de validacao)
- preview e exportacao de correcoes em modos `STRICT` e `LENIENT`

### Onde estao os testes

- Features Gherkin: `server/acceptance/features/*.feature`
- Step definitions e setup: `server/acceptance/steps` e `server/acceptance/support`

### Pre-requisitos

- Node.js 18+
- npm 9+

### Passo a passo para executar localmente

1. Abra um terminal na raiz `provas-app`.
2. Instale dependencias do backend:

```bash
cd server
npm install
```

3. Rode os testes de aceitacao:

```bash
npm run test:acceptance
```

### Comandos uteis

- Executar suite completa:

```bash
cd server
npm run test:acceptance
```

- Executar com outro formato de output:

```bash
cd server
npm run test:acceptance:headed
```

### Observacoes importantes

- Nao e necessario subir frontend para esses testes.
- O proprio setup dos testes inicia a API automaticamente em uma porta aleatoria local.
- Para manter isolamento entre cenarios, os arquivos `server/data/questions.json` e `server/data/exams.json` sao limpos antes de cada cenario e restaurados ao final da execucao.
