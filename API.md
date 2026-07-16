# API

Todas as respostas são JSON. Erros usam `error.message` e `error.status`.

## Recursos

| Recurso | Endpoints |
| --- | --- |
| Saúde | `GET /api/health` |
| Artistas | `GET, POST /api/artists`; `GET, PUT, DELETE /api/artists/:id` |
| Tags | `GET, POST /api/tags`; `GET, PUT, DELETE /api/tags/:id` |
| Músicas | `GET, POST /api/music`; `GET, PUT, DELETE /api/music/:id` |
| Tipos de culto | `GET /api/service-types` |
| Cultos | `GET, POST /api/services`; `GET, PUT, DELETE /api/services/:id` |
| Configurações | `GET, PUT /api/settings` |
| Repertórios | `POST /api/repertoires/generate`; CRUD `/api/repertoires`; `POST /:id/confirm`; `POST /:id/execute` |
| Histórico | CRUD `/api/history` |
| Dashboard | `GET /api/dashboard/summary` |

## Exemplo

```bash
curl -X POST http://localhost:3000/api/artists -H "Content-Type: application/json" -d "{\"name\":\"Exemplo\"}"
```

O histórico aceita `startDate`, `endDate`, `musicId`, `artistId`, `serviceTypeId`, `musicType`, `title`, `origin`, `page` e `limit`.

Fluxo: crie um culto, gere uma sugestão, envie seus itens para `POST /api/repertoires`, confirme e execute. A execução registra o histórico automaticamente.
