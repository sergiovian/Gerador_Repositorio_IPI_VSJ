# Instruções para manutenção

Antes de alterar o projeto, leia `CONTEXTO_PROJETO.md` e confira `git status --short`.

## Regras de implementação

- Preserve a arquitetura atual: Express/CommonJS, SQLite e frontend em HTML/CSS/JavaScript sem etapa de build.
- Todo dado operacional deve respeitar `church_id`. Use o contexto de igreja de `backend/constants/church-context.js` e nunca consulte dados de todas as igrejas em rotas comuns.
- Autorizações administrativas devem ser verificadas no backend; esconder um botão no frontend não é autorização.
- Preserve UTF-8 e textos em português.
- Reutilize serviços e respostas JSON existentes antes de criar endpoints paralelos.
- Ao alterar scripts do frontend referenciados por HTML, atualize o parâmetro de versão da URL para evitar cache antigo no navegador.
- Importe arquivos em memória somente dentro dos limites já definidos. Arquivos persistentes pertencem a `backend/uploads/` e não devem ser versionados.
- Faça backup do SQLite antes de qualquer migração ou manutenção de dados.

## Segurança

- Nunca registre ou versione senhas, tokens, cookies, chaves, `.env`, bancos, uploads ou backups.
- `SESSION_SECRET` é obrigatório em produção e deve ser longo e aleatório.
- `BOOTSTRAP_ADMIN_PASSWORD` é temporário: usar apenas para criar/rotacionar o administrador e remover do `.env` depois.
- Não reintroduza credenciais padrão no código ou nos testes. Testes devem gerar credenciais descartáveis em execução.
- Não exponha valores do `.env` em comandos, logs ou respostas; liste apenas nomes de variáveis quando necessário.

## Verificação

```powershell
npm install
npm test
npm run db:init
git diff --check
git status --short
```

Faça também um teste manual proporcional à mudança: login, isolamento entre igrejas, biblioteca, culto, projeção e PDF são os fluxos mais sensíveis.

## Git e publicação

- Preserve alterações do usuário e não use `git reset --hard` ou comandos destrutivos.
- O código oficial é o repositório GitHub configurado em `origin`.
- A VM foi atualizada historicamente por `scp` e seu worktree está muito divergente/sujo. Não execute `git pull`, `checkout` ou `reset` nela antes de uma reconciliação planejada.
- Até essa reconciliação, publique apenas arquivos conhecidos por `scp`, instale dependências quando `package*.json` mudar e reinicie com `pm2 restart louvor-inteligente --update-env`.
- Não copie o banco local para produção. Não sobrescreva `.env`, `backend/database/` nem `backend/uploads/`.
- Após publicar, valide `pm2 status`, logs recentes e uma rota autenticada no navegador.

O usuário normalmente espera que mudanças concluídas sejam enviadas ao Git e à VM, mas confirme o resultado dos testes antes da publicação.
