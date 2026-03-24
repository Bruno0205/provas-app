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
