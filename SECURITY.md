# Política de segurança

## Como reportar uma vulnerabilidade

Se você encontrou uma vulnerabilidade no **Fluxo**:

- **Não** abra uma issue pública.
- Prefira [GitHub Security Advisories](https://github.com/RafaelHDSV/Fluxo/security/advisories/new) (privado) ou contato direto com o mantenedor ([Rafael Vieira](https://github.com/RafaelHDSV)).
- Inclua: passos para reproduzir, impacto estimado e, se possível, sugestão de correção.

Resposta inicial em até **7 dias úteis**. Após a correção, você pode ser creditado se desejar.

## Escopo

Inclui, entre outros:

- Exposição de dados financeiros de outro usuário (falha de RLS / Auth)
- Vazamento de secrets no repositório ou em logs
- XSS / CSRF / injeção que afete contas autenticadas
- Escalação de privilégio no BFF

Fora do escopo típico: DoS trivial em ambiente local; questões apenas cosméticas de UI.

## Versões suportadas

Apenas a branch principal (`main`) recebe correções de segurança.

## Boas práticas (contribuidores)

- Nunca commite secrets (`.env`, tokens, chaves privadas, connection strings com credenciais).
- Use o `.gitignore` do projeto; mantenha apenas `.env.example` com placeholders.
- Não imprima valores de `DATABASE_URL`, `JWT_SECRET` ou chaves Supabase em logs de sucesso.
- Não versionar dumps, OFX, scripts one-shot com `user_id` real ou IDs de projeto em nuvem.
- Atualize dependências com PRs pequenos quando possível.

## Relacionado

- [Código de Conduta](./CODE_OF_CONDUCT.md)
- [Contribuindo](./CONTRIBUTING.md)
