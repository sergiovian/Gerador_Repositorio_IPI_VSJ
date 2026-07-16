# LOUVOR INTELIGENTE — Domínio da Versão 1.0

> Implementação atual: `MusicHistory` possui origem `MANUAL` ou `AUTOMATIC`; registros automáticos preservam a rastreabilidade de repertórios executados.

## Propósito e limites deste documento

Este documento descreve o **domínio de negócio**: conceitos, responsabilidades e relações que a aplicação precisa representar. Ele não cria código, tabelas, endpoints, pastas nem altera o `PROJECT.md`.

As entidades já definidas no `PROJECT.md` são tratadas como a linha de base aprovada. Onde este documento introduz uma interpretação complementar, ela é identificada como **proposta sujeita a aprovação**, com a respectiva justificativa.

## Visão de colaboração entre entidades

```text
Church ── possui ──> ChurchPreferences
  │
  ├── mantém ──> Music <── identifica ── Artist
  │                  │
  │                  └── MusicTag ──> Tag
  │
  └── realiza ──> Service <── classifica ── ServiceType
                        │  └── possui ──> Sermon
                        │  └── seleciona ──> Music
                        │
                        └── gera ──> MusicHistory ──> Music

User ── opera e confirma ──> Music / Service / ChurchPreferences
DecisionLog ── registra decisões do User e do algoritmo sobre Music e Service
```

## Entidades

### Church

**Objetivo** — Representar a igreja que utiliza o sistema e estabelecer a fronteira de seus dados.

**Responsabilidade** — Identificar a organização, manter seus dados institucionais e delimitar os itens musicais, cultos, preferências e histórico que lhe pertencem.

**Relacionamentos**

- Possui uma configuração em `ChurchPreferences`.
- Possui várias `Music` e vários `Service`.
- É o contexto de atuação dos `User`.
- É referenciada por registros de `MusicHistory` e `DecisionLog` para preservar a segregação de dados.

**Regras**

- Dados de uma igreja não podem ser consultados, alterados ou usados pelo algoritmo de outra igreja.
- Uma igreja inativa não deve receber novos cultos ou novos itens de catálogo, mas seus registros históricos devem ser preservados.

**Observações** — A entidade permite que a primeira implantação seja dedicada à IPI Vila São José sem impedir uma operação multiigreja futura.

### User

**Objetivo** — Representar uma pessoa autorizada a operar o sistema.

**Responsabilidade** — Realizar ações de gestão e decisão, como cadastrar músicas, configurar preferências, criar cultos e confirmar repertórios.

**Relacionamentos**

- Pertence a uma `Church`.
- Pode criar ou atualizar informações de `Music`, `Service` e `ChurchPreferences`.
- É o autor identificável de um `DecisionLog` quando uma ação é humana.

**Regras**

- O usuário deve atuar somente no contexto da igreja à qual está vinculado.
- O modelo de autenticação, perfis e permissões ainda não está definido e requer aprovação antes de implementação.

**Observações** — Esta entidade é obrigatória no domínio, embora sua persistência detalhada e autenticação sejam etapas futuras já previstas no `PROJECT.md`.

### Music

**Objetivo** — Representar um item do catálogo único de repertório, seja hino ou louvor.

**Responsabilidade** — Centralizar os metadados musicais necessários para busca, filtragem e escolha: título, tipo, energia, tonalidade, BPM, duração, letras, links e observações.

**Relacionamentos**

- Pertence a uma `Church`.
- Pode ser associada a um `Artist`.
- Relaciona-se com várias `Tag` por meio de `MusicTag`.
- Pode compor vários `Service`.
- Possui ocorrências em `MusicHistory`.
- Pode aparecer em `DecisionLog` como candidata, selecionada, removida ou descartada.

**Regras**

- `type` aceita somente `HINO` ou `LOUVOR`.
- `energy` deve ser um inteiro entre 1 e 5.
- Apenas músicas ativas participam de novas sugestões ou novos repertórios.
- Música inativa continua referenciável pelo histórico para não apagar fatos passados.
- `artist_id` pode ficar vazio quando o artista não for conhecido ou não se aplicar.

**Observações** — `Music` substitui completamente a separação conceitual e física entre músicas e hinos; a diferenciação existe no campo `type`.

### Artist

**Objetivo** — Representar artista, autor, intérprete ou banda associada a uma música.

**Responsabilidade** — Evitar repetição de nomes no catálogo e apoiar filtros e diversidade de repertório.

**Relacionamentos**

- Um `Artist` pode estar associado a várias `Music`.
- Uma `Music` pode não ter artista associado.

**Regras**

- O nome deve ser único no catálogo de artistas, conforme a linha de base do `PROJECT.md`.
- A exclusão de um artista com músicas associadas deve ser impedida ou substituída por desassociação controlada; o comportamento definitivo deve ser aprovado antes da implementação.

**Observações** — O algoritmo poderá usar artista como fator de diversidade, evitando concentrar sugestões na mesma autoria ou intérprete.

### Tag

**Objetivo** — Classificar músicas com termos livres e uma cor de identificação visual.

**Responsabilidade** — Expressar critérios como tema, momento litúrgico, estilo ou contexto, sem ampliar a estrutura de `Music` a cada nova classificação.

**Relacionamentos**

- Relaciona-se com várias `Music` por meio de `MusicTag`.

**Regras**

- O nome deve ser único.
- A cor deve ser válida para a interface quando informada/persistida, conforme a definição já documentada.
- Uma tag não pode ser associada duas vezes à mesma música.

**Observações** — Tags são importantes para traduzir tema de sermão, tipo de culto e preferências do usuário em filtros do algoritmo.

### MusicTag

**Objetivo** — Representar a associação muitos-para-muitos entre `Music` e `Tag`.

**Responsabilidade** — Permitir que uma música receba múltiplas classificações e que uma tag reúna múltiplas músicas.

**Relacionamentos**

- Aponta para uma `Music` e uma `Tag`.
- Juntas, as duas referências identificam uma única associação.

**Regras**

- O par música–tag deve ser único.
- Uma associação só pode existir se ambas as entidades existirem.
- A remoção de uma associação não remove a música nem a tag.

**Observações** — É uma entidade associativa; não possui significado de negócio isolado fora do vínculo que representa.

### Service

**Objetivo** — Representar um culto planejado ou realizado.

**Responsabilidade** — Reunir contexto, data, tipo de culto, sermão, repertório confirmado e ocorrências históricas de execução.

**Relacionamentos**

- Pertence a uma `Church`.
- É classificado por um `ServiceType`.
- Pode possuir no máximo um `Sermon`.
- Seleciona várias `Music` em uma ordem de repertório.
- Gera registros de `MusicHistory` para músicas efetivamente utilizadas.
- É o contexto principal de `DecisionLog` para as escolhas de repertório.

**Regras**

- Deve ter igreja, tipo e data antes de ser confirmado.
- A ordem de cada música dentro do culto deve ser única.
- Uma música só deve entrar no histórico após confirmação/realização do culto, não apenas por ter sido sugerida.

**Observações** — O vínculo ordenado com `Music` é persistido pela estrutura já especificada como `service_music`. Esta documentação não propõe mudança nesse nome ou modelagem.

### ServiceType

**Objetivo** — Representar o contexto litúrgico de um culto.

**Responsabilidade** — Padronizar categorias usadas no planejamento e permitir que o algoritmo considere o contexto da celebração.

**Relacionamentos**

- Um `ServiceType` classifica vários `Service`.

**Regras**

- O nome é único.
- A carga inicial documentada inclui: Culto Normal, Santa Ceia, Batismo, Natal, Páscoa, Missões, Jovens, Mulheres, Homens e Evangelístico.

**Observações** — Novos tipos devem ser tratados como dados configuráveis, não como novos campos ou regras codificadas.

### Sermon

**Objetivo** — Registrar o conteúdo de pregação associado a um culto.

**Responsabilidade** — Oferecer tema e referência bíblica para consulta humana e, futuramente, para enriquecer a recomendação de repertório.

**Relacionamentos**

- Pertence a um único `Service`.
- Um `Service` possui zero ou um `Sermon`.
- Seu tema pode ser usado como contexto para seleção de `Music` por tags.

**Regras**

- O sermão é opcional.
- Quando livro, capítulo e versículos forem informados, a referência precisa ser coerente: números positivos e versículo final maior ou igual ao inicial.

**Observações** — O algoritmo não deve depender da existência de sermão: um culto pode gerar repertório apenas por tipo, preferências e filtros manuais.

### MusicHistory

**Objetivo** — Representar uma ocorrência efetiva de uso de uma música em um culto.

**Responsabilidade** — Fornecer ao sistema uma memória confiável para impedir repetição excessiva, produzir relatórios e explicar a pontuação de candidatos.

**Relacionamentos**

- Pertence ao contexto de uma `Church`.
- Refere-se a um `Service` e a uma `Music`.
- É consultada pelo algoritmo em conjunto com `ChurchPreferences`.

**Regras**

- Cada música pode ter apenas uma ocorrência histórica por culto.
- A igreja do histórico deve corresponder à igreja do culto e da música.
- Registros não devem ser removidos para preservar a fidelidade histórica; correções devem ser rastreáveis.

**Observações** — **Proposta de nomenclatura, sem alteração aplicada:** `MusicHistory` é o nome da entidade de domínio solicitado. O modelo físico já documentado usa a tabela `service_history`. Esta documentação os trata como o mesmo conceito; não propõe renomear a tabela. A justificativa é manter o vocabulário de negócio claro sem criar uma duplicidade física desnecessária.

### ChurchPreferences

**Objetivo** — Representar as regras configuráveis de seleção de repertório de uma igreja.

**Responsabilidade** — Definir `dias_sem_repetir`, `quantidade_hinos`, `quantidade_louvores`, `energia_minima` e `energia_maxima` usados como parâmetros pelo algoritmo.

**Relacionamentos**

- Pertence exclusivamente a uma `Church`.
- É consultada pelo processo que sugere músicas para um `Service`.
- Seus valores e alterações podem ser registrados em `DecisionLog` para rastreabilidade futura.

**Regras**

- Existe no máximo uma configuração por igreja.
- Quantidades e dias sem repetir não podem ser negativos.
- Energias mínima e máxima devem estar entre 1 e 5, com mínima menor ou igual à máxima.

**Observações** — Preferências são parâmetros, não comandos absolutos: o usuário pode ajustar uma sugestão manualmente, e a exceção deve poder ser explicada pelo `DecisionLog`.

### DecisionLog

**Objetivo** — Registrar decisões relevantes tomadas pelo algoritmo ou por um usuário durante a montagem de um repertório.

**Responsabilidade** — Permitir auditoria e explicabilidade: informar quais critérios levaram uma música a ser sugerida, selecionada, removida, rejeitada ou ajustada.

**Relacionamentos**

- Pertence ao contexto de uma `Church`.
- Refere-se a um `Service` quando a decisão ocorrer em um planejamento de culto.
- Pode referir-se a uma `Music` específica.
- Pode identificar o `User` autor de uma decisão humana; decisões automáticas não exigem usuário.
- Usa `ChurchPreferences` e `MusicHistory` como fontes contextuais de justificativa, sem necessariamente criar dependências físicas diretas para cada leitura.

**Regras**

- Um registro deve informar a origem da decisão: algoritmo ou usuário.
- Deve conter um tipo de decisão e justificativa/critério legível.
- O log é somente de inclusão: não deve ser alterado ou apagado em fluxos normais.
- O log não substitui o histórico de execução: registrar uma sugestão não significa que a música foi tocada.

**Observações** — **Proposta sujeita a aprovação:** `DecisionLog` ainda não consta no modelo físico do `PROJECT.md`. Sua inclusão é justificada pela necessidade de explicar decisões do algoritmo e intervenções humanas, requisito importante em um sistema de recomendação. Nenhuma tabela, campo ou estrutura será criada até aprovação explícita.

## Conversa entre as entidades no ciclo de repertório

1. Um `User`, no contexto de uma `Church`, mantém `Artist`, `Tag` e `Music`.
2. `MusicTag` torna as classificações de cada `Music` disponíveis para filtros.
3. A `Church` define limites em `ChurchPreferences`.
4. O `User` cria um `Service` e seleciona seu `ServiceType`; pode associar um `Sermon`.
5. O algoritmo consulta `Music`, `MusicTag`, `Artist`, `ChurchPreferences` e `MusicHistory` para propor músicas.
6. Cada recomendação e ajuste relevante pode ser explicado por `DecisionLog`, quando este conceito for aprovado para persistência.
7. O repertório aprovado associa `Music` a `Service` em ordem.
8. Após a execução, cada música confirmada gera um `MusicHistory`, que servirá ao próximo ciclo.

## Pendências que exigem aprovação antes de implementação

| Item | Proposta | Justificativa |
| --- | --- | --- |
| Persistência de `DecisionLog` | Criar entidade/tabela de auditoria | Explicabilidade e rastreabilidade de recomendações e ajustes. |
| Perfil e permissões de `User` | Definir papéis e regras de acesso | Segurança e segregação de responsabilidades. |
| Exclusão de `Artist` e `Tag` | Definir bloqueio, desassociação ou arquivamento | Evitar perda de integridade de catálogo e histórico. |
| Estado de um `Service` | Definir ciclo planejado, confirmado e realizado | Distinguir sugestão de execução histórica. |

Nenhuma dessas propostas altera a estrutura principal do sistema sem aprovação prévia.
