# Louvor Inteligente

Sistema web para organizar músicas, cultos e sugestões de repertório da Igreja Presbiteriana Independente de Vila São José.

## Tecnologias

Node.js, Express, SQLite, HTML5, CSS3, Bootstrap 5 e JavaScript puro.

## Início rápido

```bash
npm install
copy .env.example .env
npm start
```

Acesse `http://localhost:3000`.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm start` | Inicia a aplicação. |
| `npm run dev` | Inicia com recarga automática. |
| `npm test` | Executa testes com banco SQLite isolado. |
| `npm run db:init` | Garante schema e dados iniciais. |
| `npm run db:seed` | Executa a inicialização idempotente. |

## Funcionalidades

- Artistas, tags e catálogo unificado de músicas/hinos.
- Associação de múltiplas tags a músicas.
- Cultos, sermões, configurações e tipos de culto.
- Geração explicável de repertório com bloqueio de repetição.
- Repertórios em rascunho, confirmados e executados.
- Histórico automático e manual protegido por origem.
- Dashboard e interface responsiva.

## Fluxo principal

Cadastre músicas → crie um culto → gere a sugestão → salve o rascunho → confirme → execute → consulte o histórico.

## Limitações atuais

Não há autenticação nesta versão. O contexto da primeira igreja é centralizado no backend e não é exposto à interface.

Consulte [INSTALL.md](INSTALL.md), [API.md](API.md) e [TESTING.md](TESTING.md) para detalhes.
