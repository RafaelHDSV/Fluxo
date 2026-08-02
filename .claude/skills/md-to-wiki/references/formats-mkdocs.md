# Format 1 — Pure HTML (MkDocs Material)

Use MkDocs with the Material theme — produces the exact GitHub docs look with search, navigation, and responsive layout.

```bash
pip install mkdocs mkdocs-material
```

Generate an `mkdocs.yml` from the selected source files:

```yaml
site_name: <Project Name> — Specs
site_description: Auto-generated documentation
repo_url: <git remote origin if available>
repo_name: <repo name>
edit_uri: ""

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.instant
    - navigation.tracking
    - navigation.sections
    - navigation.expand
    - navigation.indexes
    - search.highlight
    - search.suggest
    - content.code.copy
    - content.tabs
    - toc.follow

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.tasklist:
      custom_checkbox: true
  - admonition
  - pymdownx.details
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - tables
  - toc:
      permalink: true

nav:
  - Home: index.md
  - Project:
      - Overview: specs/project/PROJECT.md
      - Roadmap: specs/project/ROADMAP.md
      - State / Decisions: specs/project/STATE.md
  - Codebase:
      - Architecture: specs/codebase/ARCHITECTURE.md
      - Stack: specs/codebase/STACK.md
      - Conventions: specs/codebase/CONVENTIONS.md
      - Structure: specs/codebase/STRUCTURE.md
      - Testing: specs/codebase/TESTING.md
      - Integrations: specs/codebase/INTEGRATIONS.md
      - Concerns: specs/codebase/CONCERNS.md
  - Features:
      - <Feature Name>:
          - Spec: specs/features/<name>/spec.md
          - Design: specs/features/<name>/design.md
          - Tasks: specs/features/<name>/tasks.md
          - Context: specs/features/<name>/context.md
  - Quick Tasks:
      - <NNN-slug>:
          - Task: specs/quick/<NNN-slug>/TASK.md
```

Rules for nav generation:
- Skip files that don't exist or were excluded in the onboarding
- Use feature folder name as the section title (capitalize, replace `-` with space)
- Include `README.md` if present instead of or in addition to `spec.md`
- Codebase section: only include files that exist

Create `docs/index.md` as the landing page. Tailor the landing page to the onboarding answers:
- If audience is **new devs**: emphasize "Quick Start" links, architecture, conventions
- If audience is **stakeholders**: emphasize roadmap, feature overviews, dates
- If purpose is **API docs**: emphasize endpoint index, integration guides

```bash
mkdir -p docs
ln -s ../.specs docs/specs    # or cp -r if symlinks undesirable
```

Build:
```bash
mkdocs build
```

Output: `site/index.html`. Offer to serve with `mkdocs serve` for live preview.

**GitHub Pages deploy:**
```bash
mkdocs gh-deploy
```

---
