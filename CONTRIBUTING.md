# Contribuindo

Obrigado pelo interesse em contribuir com o **Fluxo**.

## Antes de começar

1. Leia o [README.md](./README.md) — setup, stack e **decisões de produto**.
2. Respeite o [Código de Conduta](./CODE_OF_CONDUCT.md).
3. Para UI: siga os tokens e componentes já usados em `frontend/` (Tailwind + shadcn). Evite paletas “SaaS purple”, stacks genéricas (Inter/Roboto) e layouts de marketing genérico no app autenticado.

## Fluxo de trabalho

1. Abra uma **issue** descrevendo o problema ou a melhoria.
2. Fork + branch:

```bash
git checkout -b feat/sua-feature
```

3. Implemente seguindo os padrões do código existente.
4. Garanta que passa:

```bash
cd frontend && yarn lint && yarn build
cd ../backend && yarn test && yarn build
```

5. Abra um **Pull Request** com: problema, solução e como testar (checklist manual ajuda — em UI, valide também ~320px).

## Padrões

- Commits objetivos em **pt-BR** ou inglês — foque no *porquê*.
- Prefira legibilidade a astúcia; PRs pequenos quando possível.
- **Não** commite secrets (`.env`, tokens, chaves). Só `.env.example` com placeholders.
- **Não** atribua ferramentas de IA como autor/coautor em commits ou PRs.
- Texto de produto em **pt-BR com acentuação**.
- Migrations novas em `backend/migrations/` com próximo número sequencial; documente no PR o que a migration faz.

## Decisões sensíveis

Alterações que mudem âncora de saldo, Open Finance, multi-moeda, comportamento de `paid` ou modelo de caixinhas devem ser **discutidas na issue** antes do código. Resumo no [README](./README.md#decisões-de-produto-para-contribuidores).

## Segurança

Vulnerabilidades: **não** abra issue pública — veja [SECURITY.md](./SECURITY.md).

## O que não versionar

Pastas como `docs/` e `backend/scripts/` são locais/pessoais e estão no `.gitignore`. Não as force no PR.
