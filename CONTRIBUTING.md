# Contribuindo

Obrigado pelo interesse em contribuir com o **Fluxo**.

## Antes de começar

1. Leia [`docs/context.md`](./docs/context.md) e [`docs/especificacao.md`](./docs/especificacao.md).
2. Para UI, siga [`docs/DESIGN.md`](./docs/DESIGN.md).
3. Respeite o [Código de Conduta](./CODE_OF_CONDUCT.md).

## Fluxo de trabalho

1. Abra uma **issue** descrevendo o problema ou a melhoria (ou referencie a epic [#1](https://github.com/RafaelHDSV/Fluxo/issues/1)).
2. Faça um fork do repositório e crie uma branch:

```bash
git checkout -b feat/sua-feature
```

3. Implemente a mudança seguindo os padrões do projeto.
4. Garanta que lint, testes e build passam:

```bash
cd frontend && yarn lint && yarn build
cd ../backend && yarn test && yarn build
```

5. Abra um **Pull Request** descrevendo o problema, a solução e como testar (checklist de verificação manual ajuda — especialmente em ~320px se a mudança for de UI).

## Padrões

- Mensagens de commit objetivas em português (pt-BR acentuado) ou inglês — foque no *porquê*.
- Código claro: prefira legibilidade a astúcia.
- Mantenha PRs pequenos quando possível.
- **Não** commite secrets (`.env`, tokens, chaves). Use apenas `.env.example` com placeholders.
- Não atribua ferramentas de IA como autor/coautor em commits ou PRs.
- Texto de produto e docs em **pt-BR com acentuação correta**.

## Escopo e decisões

Mudanças que alterem decisões fixas de `docs/context.md` (ex.: Open Finance, multi-moeda) devem ser discutidas na issue antes da implementação.

## Segurança

Vulnerabilidades: **não** abra issue pública — veja [SECURITY.md](./SECURITY.md).
