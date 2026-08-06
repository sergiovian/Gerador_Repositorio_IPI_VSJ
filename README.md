# Gestor de Cultos

Aplicação web multi-igreja para planejar, ensaiar, executar e projetar cultos. O sistema reúne biblioteca de músicas, liturgia, avisos, apresentação, Bíblia, projeção controlada por celular e acompanhamento do culto ao vivo.

## Tecnologias

- Node.js 18, Express 4 e JavaScript CommonJS.
- SQLite 3 em arquivo local.
- HTML, CSS e JavaScript puro no frontend, com Bootstrap 5 em partes da interface.
- PM2 e Nginx na VM de produção.
- Importação de arquivos com `multer`, `officeparser`, `adm-zip` e `fast-xml-parser`.

## Início rápido

```powershell
npm install
Copy-Item .env.example .env
npm run db:init
npm start
```

Preencha `SESSION_SECRET` no `.env`. Em um banco novo, defina temporariamente `BOOTSTRAP_ADMIN_PASSWORD` com pelo menos 12 caracteres. Acesse `http://localhost:3000`.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm start` | Inicia a aplicação. |
| `npm run dev` | Inicia com recarga automática via Nodemon. |
| `npm test` | Executa os testes Node com SQLite isolado. |
| `npm run db:init` | Inicializa/migra o banco de forma idempotente. |
| `npm run db:seed` | Executa novamente a inicialização idempotente. |
| `npm run db:import:ipi` | Executa o importador específico legado da IPI. |

## Principais recursos

- Cadastro de igrejas e usuários com perfis `MEMBER`, `ADMIN` e `SUPER_ADMIN`.
- Identidade visual por igreja, incluindo nome e logotipo.
- Biblioteca de músicas, letras, cifras próprias, tags e artistas no fluxo da música.
- Importação Holyrics JSON, PowerPoint, Word e TXT, conforme o fluxo usado.
- Planejamento de culto, geração e edição de repertório, liturgia, anexos e comunicados.
- Central do culto com preparação de ensaio, ordem unificada e modo ao vivo.
- Projeção em segundo monitor, controle remoto por celular/QR, Bíblia e afinador.
- Exportação de culto/repertório em PDF e planilha.

## Segurança e dados

Nunca versione `.env`, bancos SQLite, uploads, backups, chaves SSH ou credenciais. O `.gitignore` cobre esses artefatos. O banco de produção e os uploads ficam somente na VM e precisam de backup independente.

## Continuidade

Leia primeiro [CONTEXTO_PROJETO.md](CONTEXTO_PROJETO.md). As regras para agentes e manutenção estão em [AGENTS.md](AGENTS.md). Alguns documentos antigos (`PROJECT.md`, `DOMAIN.md`, `DATAFLOW.md`, `API.md`, `INSTALL.md` e `TESTING.md`) ainda precisam ser alinhados com a arquitetura multi-igreja atual.
