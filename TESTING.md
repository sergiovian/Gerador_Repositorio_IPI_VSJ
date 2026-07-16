# Testes

Execute `npm test`.

Os testes definem `DATABASE_PATH=test/louvor-inteligente.test.db` antes de carregar a aplicação. O arquivo é criado e removido pela suíte, sem tocar no banco de desenvolvimento.

Cobertura atual: inicialização isolada, seeds, CRUD de tags, duplicidade, configurações e ausência de candidatos no motor de geração.

Uma falha indica o nome do teste, o arquivo e a linha correspondentes. Execute novamente após corrigir o problema.
