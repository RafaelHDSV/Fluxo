# Política de segurança

## Como reportar uma vulnerabilidade

Se você encontrou uma vulnerabilidade no **Fluxo**, por favor:

- **Não** abra uma issue pública.
- Entre em contato direto com o mantenedor por e-mail ou mensagem privada (perfil: [Rafael Vieira](https://github.com/RafaelHDSV)).
- Inclua passos para reproduzir, impacto estimado e, se possível, uma sugestão de correção.

A resposta inicial ocorre em até **7 dias úteis**. Após a correção, você será creditado se desejar.

## Escopo

Inclui, entre outros:

- Exposição de dados financeiros de outro usuário (falha de RLS / Auth)
- Vazamento de secrets no repositório ou em logs
- XSS / CSRF / injeção que afete contas autenticadas
- Escalação de privilégio no BFF

Fora do escopo típico: negação de serviço trivial em ambiente local de desenvolvimento; questões apenas cosméticas de UI.

## Versões suportadas

Apenas a versão mais recente da branch principal recebe correções de segurança.

## Boas práticas (contribuidores)

- Nunca commite secrets (`.env`, tokens, chaves privadas, connection strings com credenciais).
- Use o `.gitignore` do projeto e mantenha apenas `.env.example` com placeholders.
- Não imprima valores de `DATABASE_URL`, `JWT_SECRET` ou chaves Supabase em logs de sucesso.
- Atualize dependências regularmente e prefira PRs pequenos para facilitar revisão.

## Relacionado

- [Código de Conduta](./CODE_OF_CONDUCT.md)
- [Contribuindo](./CONTRIBUTING.md)
