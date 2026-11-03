# Frontend

> **Para que serve:** mapa da SPA e regra de indexação do Fluxo.
> **Fonte da verdade:** `frontend/src/App.tsx`, `frontend/index.html`, `frontend/public/robots.txt`.

## SEO e indexação

Metadados de crawler (title, description, Open Graph, canonical, ícones) ficam no `frontend/index.html`. LinkedIn e WhatsApp não executam JavaScript.

`frontend/public/robots.txt` permite `/` e as rotas públicas; `Disallow` só nas rotas logadas (sem `Disallow: /`, que bloqueava LinkedIn/OG). `sitemap.xml` lista as rotas públicas em `https://fluxo.getvieira.com`.

`AuthShell` aplica `<Seo>` (Entrar / Criar conta). `Layout` aplica o título da rota logada e `noindex`.
