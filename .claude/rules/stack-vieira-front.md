# Vieira stack — front-end

> **Escopo (globs):** `**/templates/front/**/*.{ts,tsx}`, `**/templates/front/**/vite.config.ts`, `**/templates/front/**/vite.config.mts`, `**/frontend/**/*.{ts,tsx}`, `**/frontend/**/vite.config.ts`, `**/frontend/**/vite.config.mts`
>
> **Quando:** Vieira front conventions — React, Vite, TS, SASS (port 3333, @ alias)

Projects generated with `vieira front` or `frontend/` of `vieira full`. Do not reinvent tooling already in the template.

## Runtime and packages

- Node >= 22 (`.nvmrc` when present).
- **Yarn** for install/scripts (`yarn`, `yarn dev`, `yarn build`, `yarn lint`).
- React 18+, TypeScript strict, Vite 7+, SASS.

## Dev server and paths

- Dev port: **3333** (`vite.config.ts` → `server.port`).
- Alias `@` → `src/` (imports `@/components/...`).
- SCSS: partials in `src/styles/` (`_variables.scss`, `_global.scss`, `main.scss`); respect Vite `additionalData` if configured.

## Expected structure

```
src/
  main.tsx
  App.tsx
  components/
  styles/
public/
index.html
```

- Functional components; module styles (`.module.scss`) when the project already uses that pattern.
- Do not add Ant Design, i18n, routers, or product libs without explicit request.

## Code

- Strong typing; avoid `any` without justification.
- Identifiers and short error messages in **English**; README/docs for humans in **pt-BR** (see `.claude/rules/writing-style-rafael.md`).
- Reuse repo utilities and patterns before creating one-line helpers.

## Do not

- Change port to 5173 without a decision recorded in `docs/context.md` or an approved epic.
- Replace Yarn with npm/pnpm in the front template.
- Copy screens or integrations from the full portfolio (GitHub API, EmailJS, etc.).
