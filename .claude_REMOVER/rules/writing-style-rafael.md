# Writing style (Rafael Vieira voice)

> **Escopo:** ativada por descrição (sem globs).
>
> **Quando:** Use when writing or reviewing user-facing pt-BR/EN text as Rafael Vieira: README, docs/, LinkedIn posts, daily standup, .issues/, emails, narrative PR/commit descriptions, or when the user asks for voice/tone/accents.

Internal references: formal docs in [`medit/docs/context.md`](medit/docs/context.md); direct README in [`medit/README.md`](medit/README.md). Professional summary: full stack (React, TypeScript, Node, MongoDB), technical team leadership, continuous evolution narrative — aligned with [linkedin.com/in/rafael-vieira1720](https://www.linkedin.com/in/rafael-vieira1720/).

## Output locale: pt-BR (Brazilian Portuguese)

When the audience is Brazilian or mixed BR, **user-facing text must be pt-BR**. Apply these rules to README, docs, posts, emails, user messages, and narrative PR/commit descriptions.

- Use **Brazilian Portuguese (pt-BR)**. **Avoid European Portuguese** vocabulary and morphology.
- **Do not** use Portugal-specific forms when the audience is BR: e.g. *podes / tens / trazes / escolheres / organizas / connosco / vos*. Prefer implicit or explicit **você**, or third person/plural as appropriate.
- Avoid PT-EU slang or Europe-literal translations; prefer **clear, professional, natural São Paulo / general BR** usage.
- Product docs (e.g. MedIT): **objective, academic-professional** tone when fitting; lists and highlights for scanability; explicit **legal/clinical disclaimers** in health domains ("does not replace a professional", "decision support", etc.).
- LinkedIn posts in PT: short paragraphs; **emoji in moderation** (e.g. achievements); hashtags at the end, few and relevant.
- **Accents (mandatory):** in pt-BR user-facing text — README, `docs/**`, CLI messages in Portuguese, `.issues/**`, posts, emails, user chat — use **cultured pt-BR with correct diacritics** (ação, não, você, após, repositório, máquinas, então, versão, etc.). Do **not** omit accents for ASCII habit or convenience. When editing a file, fix unaccented Portuguese in the same diff; do not mix accented and unaccented prose in the same paragraph.
- **Vieira / PERSONAL-Vieira:** `README.md`, `docs/contexto.md`, and other narrative docs in that repo must always use full pt-BR accentuation.

### Quick examples (voice spec — keep in pt-BR)

| Avoid (PT-EU / artificial / unaccented) | Prefer (natural pt-BR) |
|----------------------------------------|-------------------------|
| Se também organizas os clones assim | Se você também organiza os clones assim / Quem organiza os clones assim |
| nos repositórios que escolheres | nos repositórios que você escolher / nos repositórios selecionados |
| Podes ajustar o tom | Você pode ajustar o tom / Ajuste o tom |
| Feedback e contributions | Feedback e contribuições |
| apos editar / repositorio / maquinas | após editar / repositório / máquinas |
| Versao / secao / codigo | Versão / seção / código |

## Output locale: English

- Use **professional English** for bio, summary, and international materials: complete sentences, consistent tense (present for current state, past for trajectory), no excessive informality.
- Do not mix PT and EN **in the same paragraph**, except industry convention (technology names, English job titles).

## General tone

- **Confident and polite**, focus on impact, learning, and delivery quality — like LinkedIn experience descriptions.
- Avoid brochure tone, empty clichés ("passionate about code"), and **clickbait**.
- Open source or technical projects: **problem → solution → what it does → stack/link**; direct language.

## Where this rule applies most

- README, `context.md`, `docs/**`, posts, emails, user messages, PR/commit descriptions **when narrative** — **always accented pt-BR** when in Portuguese.
- In **code identifiers**, APIs, paths, env vars, and short error messages, prioritize project conventions and universal clarity (often English, often unaccented).

## Encoding

- Save text files as **UTF-8**.
- Hub `.ai/**` instructions are in **English**; generated artifacts in `.issues/**`, `.reviews/**`, daily standups, LinkedIn posts, and Vieira epics use **pt-BR with accents** (cultured norm), except code identifiers, paths, and established English technical terms.
- Avoid curly typographic quotes; prefer `"` or `'`.
