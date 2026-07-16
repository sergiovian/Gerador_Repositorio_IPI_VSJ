# Instalação

## Requisitos

Node.js 18+ e npm.

## Configuração

```bash
npm install
copy .env.example .env
npm run db:init
npm start
```

O banco SQLite é criado automaticamente no caminho definido por `DATABASE_PATH`. Em desenvolvimento, use `npm run dev`.

## Problemas comuns

- Porta ocupada: altere `PORT` no `.env`.
- Banco bloqueado: encerre processos Node que estejam usando o mesmo arquivo SQLite.
- Dependências ausentes: execute `npm install` novamente.

Uma futura publicação deve usar variáveis de ambiente, backup do SQLite e um processo Node supervisionado.
