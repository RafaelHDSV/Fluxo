# API

> **Para que serve:** rotas HTTP, CLI I/O, códigos de erro e contratos
> **Fonte da verdade:** handlers / routers / entrypoints CLI
> **Relacionados:** [arquitetura](arquitetura.md) · [banco-de-dados](banco-de-dados.md) · [seguranca](seguranca.md)

## Convenções

- Prefixo / entrypoint: ver código (`/api`, `/v1`, binário CLI, etc.)
- Auth: ver [seguranca](seguranca.md)

## Superfície

```bash
cd backend && yarn test     # parsers OFX/CSV e ciclo de crédito
cd frontend && yarn lint
cd frontend && yarn build
cd backend && yarn build
```

---

| Método / comando | Caminho | Auth | Nota |
|---|---|---|---|
| | | | Preencher a partir do código |
