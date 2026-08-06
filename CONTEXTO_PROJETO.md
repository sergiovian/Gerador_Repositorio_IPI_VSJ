# Contexto do projeto — Gestor de Cultos

Atualizado em 06/08/2026. Este arquivo é a passagem de bastão para uma nova sessão de desenvolvimento. Não contém valores de segredos.

## Objetivo do sistema

O Gestor de Cultos é uma aplicação web multi-igreja para organizar todo o ciclo de um culto: cadastro da igreja, biblioteca musical, planejamento, repertório, liturgia, ensaio, execução ao vivo, projeção no segundo monitor, controle por celular e histórico. O produto nasceu como “Louvor Inteligente”, mas o foco atual é a ordem de culto completa.

## Arquitetura e tecnologias

- Backend: Node.js 18, Express 4, CommonJS e APIs REST.
- Banco: SQLite 3 em arquivo, sem Supabase. O schema e as migrações idempotentes ficam em `backend/database/`.
- Frontend: arquivos estáticos HTML/CSS/JavaScript em `frontend/`, sem bundler ou etapa de build.
- Autenticação: cookie HttpOnly `louvor_session`, assinado com HMAC/SHA-256 por `SESSION_SECRET`, duração de 12 horas.
- Senhas: hash com `crypto.scrypt`. O salt fixo legado deve ser melhorado em uma futura migração.
- Multi-tenant: `church_id` e `AsyncLocalStorage` em `backend/constants/church-context.js`.
- Perfis: `MEMBER`, `ADMIN` e `SUPER_ADMIN`.
- Arquivos Office: `officeparser`, `adm-zip` e `fast-xml-parser`; upload via `multer`.
- Produção: Ubuntu/Oracle Cloud, Nginx como proxy reverso, Node gerenciado pelo PM2.

Fluxo principal:

`Navegador → Nginx:80 → Express:3000 → serviços/modelos → SQLite e uploads locais`

## Estrutura principal

| Caminho | Responsabilidade |
| --- | --- |
| `server.js` | Carrega ambiente e banco, garante o administrador inicial e inicia o HTTP. |
| `app.js` | Autenticação, contexto da igreja, arquivos estáticos, rotas e erros. |
| `backend/routes/` | Endpoints de autenticação, igreja, músicas, liturgia, projeção, central e administração. |
| `backend/services/` | Regras de negócio, importações, geração, edição, projeção e central do culto. |
| `backend/models/` | Acesso genérico ao SQLite. |
| `backend/database/` | `schema.sql`, `seed.sql`, inicialização/migrações e banco local ignorado. |
| `backend/constants/` | Contexto da igreja e constantes. |
| `backend/middlewares/` | Tratamento de erros e controles HTTP. |
| `backend/uploads/` | Logos, anexos e mídias persistidos; ignorado pelo Git. |
| `frontend/pages/` | Telas autenticadas do sistema. |
| `frontend/assets/js/` | Controladores e incrementos de interface por página. |
| `frontend/assets/css/` | Estilos globais e específicos. |
| `frontend/login.html` | Login e cadastro. |
| `frontend/index.html` | Visão geral/dashboard. |
| `test/smoke.test.js` | Testes integrados principais em SQLite isolado. |
| `scripts/` | Manutenções pontuais do catálogo legado. |

Existe uma pasta local aninhada `Gerador_Repositorio_IPI_VSJ/` que é outra cópia do repositório. Ela foi adicionada ao `.gitignore`; não a trate como fonte principal e não a remova sem autorização.

## Funcionalidades implementadas

- Login, cadastro de igreja e sessão persistente; usuário da sessão é revalidado no banco a cada requisição.
- Identidade por igreja com nome, cidade, estado e logotipo aplicado na navegação e nos documentos.
- Administração geral de igrejas e usuários para `SUPER_ADMIN`; administração da própria igreja para `ADMIN`.
- Biblioteca de músicas/hinos com artistas integrados ao cadastro/edição, tags, energia, tom, letra e cifra própria.
- Editor de cifras com posições sobre as linhas, inclusão e remoção de acordes, além de links externos para Letras e Cifra Club.
- Importação de músicas por Holyrics JSON, PowerPoint e formatos tratados pelo importador; prevenção de duplicatas por normalização.
- Tratamento legado de hinos CTP (“Cantai Todos os Povos”) e categorização como hino.
- Planejamento de culto e geração de repertório com quantidade por perfil e regra de não repetição.
- Edição, substituição e ordenação de músicas do culto, reabertura, confirmação, execução e histórico.
- Importação/edição de liturgia por TXT, DOC/DOCX e PPT/PPTX, com páginas editáveis e anexos da apresentação.
- Avisos e comunicados com fotos/vídeos para projeção.
- PDF com igreja, logotipo, data/dia da semana e ordem escolhida; exportação de planilha.
- Projeção de liturgia e músicas, tela cheia/segundo monitor, estilo de fonte/título e controle remoto por celular/QR.
- Biblioteca bíblica/projeção, seleção de livro/capítulo/versículo e pesquisa rápida em versão pública permitida.
- Afinador de violão; captura por microfone depende de contexto HTTPS seguro.
- Dashboard com métricas, atalhos e sugestões públicas de louvores populares no YouTube.
- Central do Culto: checklist de ensaio, tom, BPM, repetições, introdução/final/notas, timeline unificada e modo ao vivo com item atual/próximo, cronômetros e integração com projeção.
- PWA/atalho Android básico com manifesto e ícone, ainda limitado pela ausência de HTTPS.

## Alterações realizadas nesta sessão

- Evolução da identidade do produto de repertório de louvor para Gestor de Cultos.
- Implementação e refinamento de identidade por igreja e painel administrativo multi-igreja.
- Edição de letra/cifra acessível a partir das músicas de um culto.
- Central de ensaio e culto ao vivo com timeline, estado persistido e integração de projeção.
- Auditoria final de documentação, dados sensíveis, ambiente e publicação.
- Remoção da senha administrativa fixa do código e dos testes.
- `BOOTSTRAP_ADMIN_PASSWORD` passou a ser variável temporária, sem valor padrão; a senha existente não é sobrescrita ao reiniciar.
- Remoção do segredo de sessão padrão: em produção, a aplicação agora exige `SESSION_SECRET` com pelo menos 32 caracteres.
- Ampliação do `.gitignore` para bloquear ambientes, chaves, tokens, credenciais, bancos, backups, uploads e logs.
- Atualização/criação de `README.md`, `AGENTS.md`, `.env.example` e deste arquivo.

Commits funcionais recentes anteriores a esta documentação:

- `92aac7c` — central de ensaio e culto ao vivo.
- `d8f16de` — identidade e administração por igreja.
- `d54c065` — edição de letra e cifra pelo culto.

## Decisões técnicas importantes

- SQLite continua sendo o banco oficial. Não há Supabase neste projeto.
- Dados de cada igreja devem sempre ser filtrados por `church_id`; somente rotas de administração geral podem cruzar igrejas.
- A identidade visual vem do perfil da igreja; a igreja inicial possui imagem legada de fallback.
- O `.hbac` protegido do Holyrics não permite extrair letras. O fluxo recomendado é exportar JSON ou PowerPoint pelo Holyrics.
- Spotify foi abandonado no produto; as sugestões atuais usam pesquisa pública do YouTube. Variáveis Spotify eventualmente existentes na VM são legadas e não são usadas pelo código atual.
- “A Mensagem” não é distribuída devido à licença. Use somente traduções bíblicas públicas/licenciadas para o projeto.
- Logos, anexos e avisos ficam no disco local da VM; Git não é backup desses arquivos.
- A VM não deve receber `git pull/reset` no estado atual. Há 127 entradas no worktree remoto devido a publicações históricas por cópia direta.
- Scripts de frontend usam versões em query string para cache. Uma alteração pode parecer ausente até atualizar essa versão e recarregar o navegador.

## Instalar, executar e testar

No Windows/PowerShell:

```powershell
git clone https://github.com/sergiovian/Gerador_Repositorio_IPI_VSJ.git
Set-Location Gerador_Repositorio_IPI_VSJ
npm install
Copy-Item .env.example .env
# Preencha SESSION_SECRET e, apenas em banco novo, BOOTSTRAP_ADMIN_PASSWORD.
npm run db:init
npm test
npm start
```

Desenvolvimento:

```powershell
npm run dev
```

Verificação antes de publicar:

```powershell
npm test
git diff --check
git status --short
```

## Publicação

Repositório Git:

- Origin: `https://github.com/sergiovian/Gerador_Repositorio_IPI_VSJ.git`
- Branch de trabalho observada: `main`.

Fluxo Git local:

```powershell
git add <arquivos conhecidos>
git commit -m "Descreva a alteração"
git push origin main
```

Fluxo seguro atual para a VM, até reconciliar o worktree remoto:

```powershell
$key = 'C:\Users\mikae\Downloads\ssh-key-2026-07-16.key'
scp -i $key <arquivo-alterado> ubuntu@147.15.20.59:/home/ubuntu/Gerador_Repositorio_IPI_VSJ/<mesmo-caminho>
ssh -i $key ubuntu@147.15.20.59 'cd /home/ubuntu/Gerador_Repositorio_IPI_VSJ && pm2 restart louvor-inteligente --update-env && pm2 status louvor-inteligente'
```

Se `package.json` ou `package-lock.json` mudar, execute `npm ci --omit=dev` na VM antes do reinício. Nunca publique `.env`, banco, uploads ou backups por esse fluxo.

## VM e infraestrutura

| Item | Valor não sensível |
| --- | --- |
| Provedor | Oracle Cloud, camada Always Free informada. |
| Shape | `VM.Standard.E2.1.Micro`, 1 OCPU e 1 GB RAM. |
| Região | São Paulo. |
| IP público | `147.15.20.59` |
| URL atual | `http://147.15.20.59` |
| Domínio/HTTPS | Não configurados; subdomínio e certificado estão pendentes. |
| Usuário SSH | `ubuntu` |
| Porta SSH | `22` |
| Hostname | `louvor-inteligente-vnic` |
| Caminho da aplicação | `/home/ubuntu/Gerador_Repositorio_IPI_VSJ` |
| Porta interna | `3000` |
| Proxy público | Nginx na porta `80`. |
| Serviço Node | PM2: `louvor-inteligente`, modo fork. |
| Versões observadas | Node `v18.19.1`, npm `9.2.0`. |
| Disco observado | 45 GB total, aproximadamente 41 GB livres em 06/08/2026. |
| Banco de produção | `/home/ubuntu/Gerador_Repositorio_IPI_VSJ/backend/database/louvor-inteligente.db` |
| Backups | `/home/ubuntu/Gerador_Repositorio_IPI_VSJ/backend/database/backups/` |
| Uploads | `/home/ubuntu/Gerador_Repositorio_IPI_VSJ/backend/uploads/` |

Chaves SSH utilizadas, somente localização:

- Privada: `C:\Users\mikae\Downloads\ssh-key-2026-07-16.key`
- Pública: `C:\Users\mikae\Downloads\ssh-key-2026-07-16.key.pub`

O conteúdo dessas chaves nunca deve ser copiado para o repositório.

## Variáveis de ambiente

| Variável | Necessidade | Exemplo seguro |
| --- | --- | --- |
| `PORT` | Opcional | `3000` |
| `NODE_ENV` | Recomendada | `production` na VM |
| `DATABASE_PATH` | Recomendada | `./backend/database/louvor-inteligente.db` |
| `SESSION_SECRET` | Obrigatória em produção | `********` (longo e aleatório) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Temporária | `********`; remover após criar/rotacionar |

`SITE_PASSWORD` e variáveis `SPOTIFY_*` encontradas nominalmente no `.env` remoto são legadas e não aparecem em `process.env` no código atual. Remova-as manualmente do arquivo remoto depois de confirmar que nenhum processo externo depende delas. Não registre seus valores.

## Banco de dados e conexão

O banco é SQLite, acessado pelo pacote `sqlite3`; não existe host, usuário ou senha de banco. A conexão é definida apenas por `DATABASE_PATH`. `backend/database/database.js` abre o arquivo, executa `schema.sql`, `seed.sql` e migrações idempotentes complementares.

Antes de alterações de schema/dados na VM:

```bash
cd /home/ubuntu/Gerador_Repositorio_IPI_VSJ
mkdir -p backend/database/backups
cp backend/database/louvor-inteligente.db backend/database/backups/pre-migration-$(date +%Y%m%d-%H%M%S).db
```

Não copie o banco de produção para o Git. Backups conhecidos criados anteriormente incluem arquivos prefixados com `before-church-profile-` e `before-service-center-`.

## Problemas conhecidos

- Não há domínio nem HTTPS. O navegador exibe “Não seguro”; microfone, PWA e algumas APIs modernas ficam limitados.
- Em desenvolvimento sem `SESSION_SECRET`, um segredo descartável é criado a cada processo; reiniciar invalida as sessões locais. Em produção a variável é obrigatória e validada.
- A senha antiga do administrador apareceu historicamente em arquivos versionados. Ela foi removida do estado atual, mas permanece no histórico Git e deve ser rotacionada manualmente.
- O hash de senha usa salt fixo legado. Planejar migração para salts individuais e política de senha mais forte (cadastro ainda aceita mínimo de seis caracteres).
- O worktree da VM está muito sujo/divergente (127 entradas observadas, HEAD remoto `c94db15`) por causa de publicações via SCP.
- `backend/services/mvp.service.js` é legado, condensado e contém padrões/definições duplicadas difíceis de manter.
- Várias páginas e scripts são minificados em linhas únicas e dependem de `MutationObserver` e ordem de carregamento, aumentando o risco de regressões/modais presos.
- Documentos antigos (`PROJECT.md`, `DOMAIN.md`, `DATAFLOW.md`, `API.md`, `INSTALL.md`, `TESTING.md` e `backend/README-MUSIC.md`) podem contradizer autenticação e multi-tenancy atuais.
- Não há testes E2E/browser. O teste automatizado atual é principalmente smoke/integrado do backend.
- Importação Office/Holyrics ainda pode ter casos de ordem, separação e conteúdo especial não cobertos por testes.
- `.hbac` criptografado não fornece letras; alguns arquivos temporários/uploads precisam de política periódica de limpeza.
- QR code, Bootstrap e outros recursos podem depender de serviços/CDNs externos; modo offline não é completo.
- Armazenamento de bancos, logos, anexos e mídias é local e não possui backup externo automatizado.

## Tarefas pendentes

Prioridade alta:

1. Rotacionar a senha atual do administrador e remover `BOOTSTRAP_ADMIN_PASSWORD` do `.env` após a rotação.
2. Confirmar/rotacionar `SESSION_SECRET` com valor forte e restringir o `.env` da VM a `chmod 600`.
3. Reconciliar a VM com Git em diretório novo ou por release atômico, preservando banco/uploads; depois parar de publicar em worktree sujo.
4. Configurar subdomínio, DNS e HTTPS (Let’s Encrypt), então validar microfone, PWA, cookies `Secure` e projeção remota.
5. Automatizar backup externo criptografado do SQLite e de `backend/uploads/`, com teste de restauração.

Produto e qualidade:

6. Criar tela segura para troca/reset de senha e recuperação de acesso.
7. Adicionar testes de isolamento multi-igreja, permissões, importações Office e fluxos E2E de culto/projeção.
8. Refatorar `mvp.service.js` e consolidar scripts/observadores do frontend por domínio.
9. Atualizar os documentos técnicos antigos e gerar uma referência real das APIs atuais.
10. Revisar importação de PowerPoint/Word com arquivos reais e preservar rigorosamente a ordem e a unidade versículo/texto.
11. Criar rotina configurável de limpeza de temporários e anexos órfãos.
12. Atualizar Node para uma versão LTS suportada após homologação das dependências nativas do SQLite.

## Próximos passos recomendados

1. Execute `npm test` e confirme que o commit final está limpo.
2. Publique o patch de segurança e a documentação no Git e na VM.
3. Faça a rotação manual da credencial administrativa sem revelar o novo valor em chat ou Git.
4. Planeje uma janela curta para migrar a aplicação para um diretório de release limpo na VM.
5. Configure domínio/HTTPS e só então retome funções dependentes de microfone/PWA.
6. Na próxima entrega funcional, priorize testes de isolamento multi-igreja e do fluxo completo Planejar → Ensaio → Ao vivo → Projeção.

## Estado para retomada

O código funcional está operacional na VM e a documentação central está consolidada aqui. Uma nova sessão deve começar lendo este arquivo, `AGENTS.md`, `README.md` e `git status --short`; depois deve confirmar a tarefa desejada pelo usuário e testar antes de publicar.
