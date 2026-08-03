---
name: linkedin-posts
description: >-
  Use when the user asks for a LinkedIn post, copy-paste LinkedIn text,
  course/certificate announcement, or professional milestone post (pt-BR output).
---

# LinkedIn posts — Rafael Vieira

Complements rule [writing-style-rafael.mdc](../../rules/writing-style-rafael.mdc) and, if needed, skill [perfil-rafael](../perfil-rafael/SKILL.md).

Public profile: [linkedin.com/in/rafael-vieira1720](https://www.linkedin.com/in/rafael-vieira1720/)

## Trigger

Run when the user asks for LinkedIn text, course/certificate post, project launch, or professional milestone post.

## Output locale

**Post body and "Texto para copiar" section: pt-BR** (natural São Paulo / general BR). File metadata headings may use pt-BR labels below.

## Minimum input

Collect (ask if missing):

- **Type:** Udemy course | certificate | launch (product/repo/extension) | other
- **Title** of course or project
- **Personal context** (why, prior experience, highlight)
- **Duration**, **instructor/author**, **completion date** (courses)
- **Links:** certificate (ude.my/...), Udemy course, repo, marketplace
- If a **similar prior post** exists — vary opening and structure

Optional: fetch Udemy course page for faithful content bullets.

## Required output

Create or update a Markdown file at **workspace root**:

`linkedin-post-{slug}.md`

File structure:

```markdown
# Post LinkedIn — {título curto}

Anexe o certificado ou imagem ao publicar (se aplicável).

Certificado: {url ou N/A}
Curso/Projeto: {url}

---

## Texto para copiar

{corpo pronto para colar no LinkedIn — sem markdown de negrito}
```

Also deliver the **Texto para copiar** block in chat.

## LinkedIn format rules

- **No bold** (`**text**`) in final text — LinkedIn does not render it; use **emoji and line breaks** for hierarchy.
- Natural pt-BR; confident, polite tone, no clickbait.
- Short paragraphs; lists with `→` and emoji per item when fitting.
- Hashtags **only at the end**, 8–12, relevant, avoid repeating across consecutive posts.
- CTA with `👉` + link on its own line with `🔗`.
- Emoji in moderation — per block, not every word.

### Emoji map (blocks)

| Block | Suggested emoji |
|-------|-----------------|
| Opening / context | 💻 🚀 📍 |
| Completion / certificate | ✅ 🎓 |
| Duration | ⏱️ |
| Learned content | 📚 |
| List items | → + thematic emoji (🔐 🛒 📝 💰 🎯) |
| Insight / closing | 💡 🎯 |
| CTA | 👉 🔗 |
| Instructor thanks | 🙏 |

## Post types

### 1. Udemy course / certificate

**Personal** opening (why the course; what you already did). Avoid copying the last course post word for word.

Skeleton (output pt-BR):

```
{emoji} {contexto pessoal — 1–2 frases}

{emoji} Conclui {nome do curso} ({instrutor}, Udemy). {emoji duração} {X h}: {escopo em uma linha}.

{emoji} Na prática, saí com / O que o curso passa:

→ {tópico 1}
→ {tópico 2}
→ {3–6 tópicos, baseados no curso real}

{emoji} {insight — o que mudou para você; complementa ou difere do que já usa}

{emoji} {CTA pergunta ou convite}

🔗 {link Udemy ou lnkd.in}

{emoji opcional} Obrigado, {instrutor}...

#hashtags
```

- Thank **Jamilton Damasceno** when he is the instructor.
- Bullets aligned with Udemy "What you'll learn" when available.
- If user posted a similar course (e.g. Cursor and Lovable), show **complementarity** without repeating the same hook.

### 2. Launch (extension, repo, product)

Skeleton (reference: Dev Shortcuts; output pt-BR):

```
{emoji} Problema no dia a dia (1 parágrafo)

{emoji} Inspiração ou decisão

{emoji} O que lançou + proposta de valor (parágrafo)

- bullets de funcionalidades (hífen ou →)
- links de instalação / repo

#hashtags
```

### 3. Long achievement (e.g. full frontend track)

More narrative; real duration and numbers (hours, projects, modules); thanks to instructors; course link.

## Avoid

- Always opening with "Recentemente finalizei..."
- Generic lists that fit any AI course
- English mixed in the same paragraph (tech names ok)
- Promising what the certificate or course does not cover
- Brochure tone or "apaixonado por código"
- Identical hashtags and closing lines to the immediate prior post

## Frequent hashtags (combine by theme)

`#DesenvolvimentoWeb` `#Frontend` `#VibeCoding` `#InteligênciaArtificial` `#Cursor` `#Lovable` `#NoCode` `#Udemy` `#AprendizadoContínuo` `#CarreiraEmTI` `#IA` `#SaaS` `#Produtividade` `#EngenhariaDeSoftware` `#OpenSource` `#TypeScript` `#React`

Pick a coherent subset; include `#Udemy` for Udemy courses.

## Tone references (do not copy literally)

- Course with prior context + bullets + insight: Cursor AI and Lovable posts (workspace)
- Technical launch: `dev-shortcuts/docs/linkedin-post-dev-shortcuts-1.0.md`
- Long track + numbers: Web Frontend Completo post on LinkedIn profile

## Pre-delivery checklist

- [ ] Text without `**bold**`
- [ ] Emoji per block, list with `→`
- [ ] Valid links (certificate, course, repo)
- [ ] Different from last same-type post if user noted repetition
- [ ] File `linkedin-post-{slug}.md` at workspace root
- [ ] "Texto para copiar" section ready to paste
