# Módulo MUSIC

Este módulo gerencia o catálogo unificado de hinos e louvores. A diferença entre eles é dada por `type`: `HINO` ou `LOUVOR`.

## Arquitetura

```text
Route → Controller → Validator → Service → Model → SQLite
```

- **Route:** associa o método HTTP ao controller.
- **Controller:** recebe dados HTTP, chama o validator e devolve JSON.
- **Validator:** normaliza e valida campos reutilizando `common.validator.js`.
- **Service:** recebe dados validados, atribui o contexto da igreja e orquestra a persistência.
- **Model:** executa exclusivamente SQL puro parametrizado.
- **SQLite:** persiste músicas, artistas e relacionamentos.

## Contexto da igreja na versão 1.0

O frontend e os endpoints não recebem nem retornam `church_id`. O `MusicService` atribui internamente a igreja padrão (`id = 1`) antes da persistência e limita consultas, atualizações e exclusões a esse contexto.

Essa regra está centralizada em `backend/constants/church-context.js`. Quando houver autenticação, o Service receberá o contexto da igreja do usuário autenticado, sem modificar o contrato da API.

## Endpoints

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/music` | Lista músicas da igreja atual. |
| GET | `/api/music/:id` | Busca uma música da igreja atual. |
| POST | `/api/music` | Cria uma música. |
| PUT | `/api/music/:id` | Atualiza integralmente uma música. |
| DELETE | `/api/music/:id` | Remove uma música. |

## Payload de criação e atualização

```json
{
  "title": "Santo, Santo, Santo",
  "artist_id": 1,
  "type": "HINO",
  "energy": 3,
  "key": "D",
  "bpm": 72,
  "duration": 240,
  "youtube_url": "https://youtube.com/watch?v=exemplo",
  "cifra_url": "https://exemplo.com/cifra",
  "notes": "Usar introdução curta.",
  "active": true
}
```

`artist_id`, BPM, duração, URLs e observações são opcionais. A duração é informada em segundos.

## Motor de Decisão

- Pesos futuros: `backend/config/weights.js`.
- Tipos de música: `backend/constants/music-types.js`.
- Escala de energia: `backend/constants/energy.js`.
- Tipos de culto e fases litúrgicas: `backend/constants/`.

O módulo MUSIC apenas prepara dados para o motor; nenhum algoritmo de seleção foi implementado nesta etapa.
