# DESIGN — [Product name]

> Visual source of truth. Code derives from here. Last updated: YYYY-MM-DD.

## Direction

**Thesis (one sentence):** [e.g. "A training tool that feels like an athlete's field notebook, not a SaaS dashboard."]

| Field | Value |
|-------|-------|
| Audience | [who uses it] |
| UI job | [what the person needs to do on this screen/flow] |
| Tone | [e.g. direct, technical, warm, editorial] |

## Anti-defaults

What **this** product will not be (explicit, to prevent drift in future prompts):

- Rejected fonts: [e.g. Inter, Roboto, generic system-ui]
- Rejected palettes: [e.g. SaaS purple #6366f1, cream #F4F1EA without reason]
- Rejected layouts: [e.g. gradient hero + three identical cards]
- Rationale: [tie to the domain]

## Color

Semantic tokens. Prefer oklch in code when the project already uses it; document hex for human readability.

| Token | Hex / oklch | Role |
|-------|-------------|------|
| `--background` | | main surface |
| `--foreground` | | primary text |
| `--primary` | | primary action, strong links |
| `--primary-foreground` | | text on primary |
| `--secondary` | | secondary surfaces |
| `--muted` | | subtle backgrounds |
| `--muted-foreground` | | secondary text |
| `--accent` | | punctual highlight (use sparingly) |
| `--destructive` | | error / destructive action |
| `--border` | | dividers, input borders |
| `--ring` | | keyboard focus |

**Extra surfaces (optional):** `--surface-elevated`, `--surface-inset`, `--overlay`

**Dark mode:** describe inversion or a parallel palette (not just "invert").

## Typography

| Role | Family | Weights | Use |
|------|--------|---------|-----|
| Display | | | titles, hero |
| Body | | | paragraphs, UI |
| Mono / Data | | | numbers, sets, code |

**Scale (example):**

| Name | Size | Line-height | Letter-spacing |
|------|------|-------------|----------------|
| `text-display` | | | |
| `text-title` | | | |
| `text-body` | | | |
| `text-caption` | | | |

**Import:** [Google Fonts URL, local `@font-face`, etc.]

## Spacing & radius

| Token | Value | Notes |
|-------|-------|-------|
| Base unit | 4px or 8px | |
| `--radius` | | component default |
| `--radius-sm` / `--radius-lg` | | if needed |
| Density | compact / comfortable | card and input padding |

## Layout

**Concept:** [one sentence — e.g. "single centered column, data in horizontal bands on mobile"]

```
┌─────────────────────────────────────┐
│  [header / day context]             │
├─────────────────────────────────────┤
│  [main content]                     │
│                                     │
├─────────────────────────────────────┤
│  [primary action fixed in footer?]  │
└─────────────────────────────────────┘
```

- Critical breakpoints: [e.g. workout timer readable at 320px]
- Navigation: [tabs, sidebar, bottom bar]

## Signature

**One memorable element:** [e.g. workout progress bar with rubber texture / scoreboard-style monospace counter]

**Why it serves the domain:** [one-sentence justification]

## Motion

| Moment | Behavior | Duration | Reduced motion |
|--------|----------|----------|----------------|
| Page enter | | | |
| Set feedback | | | |
| Hover / focus | | | |

## Components (shadcn / custom)

Intentional deviations from stock shadcn:

| Component | Change |
|-----------|--------|
| `Button` | [variants, radius, no shadow] |
| `Card` | [border vs shadow, padding] |
| `Input` | [height, focus] |

## Code map

Where tokens and styles live in the repo:

| Artifact | Path |
|----------|------|
| CSS variables | `frontend/src/index.css` |
| Tailwind theme | `@theme inline` or `tailwind.config.*` |
| UI components | `frontend/src/components/ui/` |
| Illustrations / icons | [folder] |

## Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial version |
