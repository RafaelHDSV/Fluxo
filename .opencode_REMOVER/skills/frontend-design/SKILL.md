---
name: frontend-design
description: >-
  Use when polishing local UI with Tailwind/shadcn, avoiding generic AI aesthetics,
  or creating/updating docs/DESIGN.md without Stitch MCP. Triggers: design, visual
  identity, DESIGN.md, "don't look like AI", polish UI. Do not use when the user
  mentions Stitch, Google design tool, or mockup upload — use stitch-workflow.
---

# Frontend Design — distinctive UI with `docs/DESIGN.md`

You are the design lead at a small studio: every product needs its own identity, not a template any prompt can reproduce. The client has already rejected "AI-looking" proposals. The deliverable is not just pretty code — it is a **documented**, **coherent** visual system.

## When to use

- New screen, redesign, or visual polish **without** Stitch MCP
- UI that reads as stock shadcn/Tailwind or obviously AI-generated
- User asks for `DESIGN.md`, tokens, palette, typography, or visual identity (local only)
- Before implementing significant UI in Vieira projects (React + Tailwind + shadcn)

**Not this skill:** Stitch / Google design tool / mockup upload → `stitch-workflow`. Component install only → `shadcn-ui`.

## Central artifact: `docs/DESIGN.md`

**`docs/DESIGN.md`** is the single source of truth for visual decisions. CSS/Tailwind code derives from it — never the other way around.

| Situation | Action |
|-----------|--------|
| `docs/DESIGN.md` exists | Read it first; implement aligned; propose a diff if code diverges |
| Missing and UI is trivial (one admin form) | Minimal inline tokens are OK; still note them in a comment or issue |
| Missing and there are 2+ screens or identity matters | **Create or extend `docs/DESIGN.md`** before coding |
| Direction changed | Update `docs/DESIGN.md` **and** code tokens in the same delivery |

### What belongs in `docs/DESIGN.md`

1. **Direction** — one-sentence visual thesis + audience + the interface's job
2. **Anti-defaults** — what this product will **not** be (rejected fonts, palettes, layouts)
3. **Color** — 4–8 named tokens with hex/oklch and semantic roles (`--primary`, `--surface-elevated`, etc.)
4. **Typography** — display, body, mono/data; scales and weights; import source (Google Fonts, local, etc.)
5. **Spacing & radius** — base unit (4/8px), scale, intentional `border-radius` (don't copy `0.5rem` by habit)
6. **Layout** — grid, density, mobile behavior; ASCII wireframe if helpful
7. **Signature** — **one** memorable element justified by the domain (not loose decoration)
8. **Motion** — what animates, duration, `prefers-reduced-motion`
9. **Components** — how shadcn Button, Card, etc. diverge from defaults
10. **Code map** — where tokens live (`index.css`, `tailwind.config`, shadcn variables)

## Required process

```
Brief → docs/DESIGN.md (draft) → anti-AI self-critique → code → screenshot → refine
```

### 1. Ground it in the subject

If the brief does not pin product, audience, and the screen's job, **pin them yourself** in one line each. Read `docs/context.md` and project specs when they exist.

Distinctive choices come from the subject's world — materials, instruments, gestures, domain vocabulary. A gym app, clinic, finance tool, and music app call for different palettes and rhythms.

### 2. Compact plan (in `docs/DESIGN.md` under Direction)

Before coding, define in short prose:

- **Palette:** 4–6 named colors with hex (plus neutrals if needed)
- **Type:** 2–3 roles (characterful display used with restraint, readable body, utility for data/captions)
- **Layout:** one-sentence concept + optional ASCII wire
- **Signature:** the one thing someone would remember about this UI

### 3. Anti-generic self-critique (required)

Compare the plan against this checklist. If it hits 2+ items without brief justification, **revise the plan** and record what changed in `docs/DESIGN.md`.

#### Classic AI UI tells (avoid by default)

| Cluster | Symptoms |
|---------|----------|
| **Cream + serif** | `#F4F1EA` background, high-contrast serif display, terracotta accent |
| **Dark + neon** | Near-black + single acid green or vermilion accent |
| **Broadsheet** | Hairline rules, `border-radius: 0`, dense newspaper columns |
| **SaaS default** | Inter/Roboto/system-ui, purple/indigo `#6366f1`, hero gradient, identical 3-column card grid |
| **Stock shadcn** | Unmodified shadcn tokens, all stock components, same shadow and padding everywhere |
| **Empty decoration** | `01 / 02 / 03` without a real sequence; SVG blobs; glassmorphism with no function |
| **Noisy motion** | Fade-in on everything; parallax everywhere; hover scale on every card |

The brief **always wins** when it explicitly asks for one of these looks. Otherwise, don't spend creative freedom on the defaults above.

**Uniqueness test:** "If I described only the palette and fonts, would another dev guess this is a generic fitness app?" If yes, change something fundamental — dominant hue, type pairing, or layout rhythm.

### 4. Implement from `docs/DESIGN.md`

- Map tokens from `docs/DESIGN.md` → CSS variables (`:root`, `.dark`) → Tailwind v4 `@theme inline` or `tailwind.config`
- shadcn: customize variants and radius; don't install a component and stop
- One strong signature element; keep everything else quiet and disciplined (Chanel rule: remove one accessory before shipping)
- Avoid conflicting CSS specificity (`.section` vs `.cta` canceling padding)

### 5. Quality floor (no fanfare)

- Responsive down to mobile
- Visible keyboard focus
- `prefers-reduced-motion` respected
- Screenshot or visual check when the environment supports it

## Design principles (summary)

- **Hero as thesis** — open with the most characteristic thing in the domain; "big number + label + gradient" only when it's truly the best answer
- **Typography = personality** — deliberate display/body pairing; intentional weights and tracking
- **Structure informs** — numbering, labels, and dividers only when order matters to the user
- **Motion with purpose** — one orchestrated moment beats ten random micro-animations
- **Complexity matches vision** — maximalism needs rich execution; minimalism needs millimeter precision

## Interface copy (pt-BR for Brazilian products)

Copy is design material. For apps in Brazilian Portuguese:

- User vocabulary, not system vocabulary ("Notificações", not "Webhooks")
- Active voice: "Salvar alterações", not "Enviar"
- Errors and empty states guide action — no vague apologies
- Conversational register, sentence case, no filler; correct accents (see `writing-style-rafael.mdc`)

## Vieira stack integration

| Layer | Where to apply `docs/DESIGN.md` tokens |
|-------|----------------------------------------|
| Global CSS | `frontend/src/index.css` — shadcn variables + `@theme inline` |
| Components | `frontend/src/components/ui/` — custom variants |
| Pages | Compose with tokens; avoid loose hex in JSX |
| Charts | Recharts — semantic palette colors, not library defaults |

For component install patterns: skill `shadcn-ui`. For Stitch/Figma flows: skill `stitch-workflow` (extracts or syncs `DESIGN.md`).

## Deliverables by scope

| Scope | Deliver |
|-------|---------|
| New feature with UI | Updated `docs/DESIGN.md` (Components section) + code |
| Redesign / polish | Revised `docs/DESIGN.md` + coherent visual diff |
| Consultation only | Recommendations anchored in existing `docs/DESIGN.md` or a draft section |

## Constraints

- Don't write a huge `docs/DESIGN.md` when the user only asked for one button — calibrate scope
- Don't commit unless explicitly asked
- Don't replace product spec (`docs/especificacao.md`) — `docs/DESIGN.md` is **visual**, not business logic
