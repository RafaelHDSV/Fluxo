---
name: stitch-workflow
description: >-
  Use when the user mentions Stitch, Google Stitch / Google design tool, upload
  mockup, code-to-design, stitch-loop, or migrate UI via Stitch MCP. Do not use for
  local Tailwind polish or DESIGN.md without Stitch — use frontend-design instead.
---

# Stitch Workflow (meta-skill)

Sub-skills live in `.opencode/skills-lib/stitch/` (not auto-discovered). **Read the matching SKILL.md** before executing.

## Decision tree

| User intent | Read first |
|-------------|------------|
| Save/migrate existing React/Vite/HTML app to Stitch | [code-to-design/SKILL.md](../../skills-lib/stitch/code-to-design/SKILL.md) |
| Generate new screen from prompt or image in Stitch | [generate-design/SKILL.md](../../skills-lib/stitch/generate-design/SKILL.md) |
| Autonomous multi-step site build loop | [stitch-loop/SKILL.md](../../skills-lib/stitch/stitch-loop/SKILL.md) |
| Stitch HTML to React (Vite) components | [react-components/SKILL.md](../../skills-lib/stitch/react-components/SKILL.md) |
| Stitch HTML to React Native | [react-native/SKILL.md](../../skills-lib/stitch/react-native/SKILL.md) |
| Extract DESIGN.md from frontend source | [extract-design-md/SKILL.md](../../skills-lib/stitch/extract-design-md/SKILL.md) |
| Analyze Stitch project into DESIGN.md | [design-md/SKILL.md](../../skills-lib/stitch/design-md/SKILL.md) |
| Premium anti-generic DESIGN.md standards | [taste-design/SKILL.md](../../skills-lib/stitch/taste-design/SKILL.md) |
| Create/update Stitch design system via MCP | [manage-design-system/SKILL.md](../../skills-lib/stitch/manage-design-system/SKILL.md) |
| Polish vague UI prompt for Stitch | [enhance-prompt/SKILL.md](../../skills-lib/stitch/enhance-prompt/SKILL.md) |
| Upload HTML/images to Stitch project | [upload-to-stitch/SKILL.md](../../skills-lib/stitch/upload-to-stitch/SKILL.md) |
| Walkthrough video from Stitch (Remotion) | [remotion/SKILL.md](../../skills-lib/stitch/remotion/SKILL.md) |

## Pipelines (chained)

**Code to Stitch (full):** `code-to-design` orchestrates:
1. [extract-static-html/SKILL.md](../../skills-lib/stitch/extract-static-html/SKILL.md)
2. [extract-design-md/SKILL.md](../../skills-lib/stitch/extract-design-md/SKILL.md)
3. [upload-to-stitch/SKILL.md](../../skills-lib/stitch/upload-to-stitch/SKILL.md)

**Generate then upload:** `generate-design` may delegate to `upload-to-stitch`.

## Rules

- Follow the loaded sub-skill completely; do not skip steps it marks required.
- Scripts stay in each sub-skill folder under `skills-lib/stitch/`.
- Requires Stitch MCP (`user-stitch`) when the sub-skill uses MCP tools.
