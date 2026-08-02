# Format 3 — GitHub Tab Wiki

Push the selected markdowns to the GitHub wiki tab.

#### 3a. Discover the remote

```bash
git remote get-url origin
```

The wiki repo is at `https://github.com/<owner>/<repo>.wiki.git` (or `git@github.com:<owner>/<repo>.wiki.git`).

#### 3b. Clone wiki repo

```bash
git clone <wiki-url> .wiki
cd .wiki
```

If the wiki doesn't exist yet (404 error), tell the user to enable the Wiki in their GitHub repo Settings first.

#### 3c. Convert spec files to wiki pages

Map the selected spec files into flat wiki pages:

| Source | Wiki page |
|--------|-----------|
| `.specs/project/PROJECT.md` | `Project-Overview.md` |
| `.specs/project/ROADMAP.md` | `Roadmap.md` |
| `.specs/project/STATE.md` | `State-Decisions.md` |
| `.specs/codebase/ARCHITECTURE.md` | `Codebase-Architecture.md` |
| `.specs/features/auth/spec.md` | `Feature-Auth.md` |
| `.specs/features/auth/design.md` | `Feature-Auth-Design.md` |
| `.specs/quick/001-api-task/TASK.md` | `Quick-Task-001.md` |

Rules:
- Create a `_Sidebar.md` with navigation links based on the selected files
- Create a `Home.md` as the landing page (use onboarding answers to tailor it)
- Preserve markdown formatting
- Update relative links to work in the wiki repo

Generate the sidebar dynamically:
```markdown
## Project
- [Project Overview](Project-Overview)
- [Roadmap](Roadmap)

## Codebase
- [Architecture](Codebase-Architecture)
...

## Features
- [Auth](Feature-Auth)
...
```

#### 3d. Commit and push

```bash
git add -A
git commit -m "docs: publish specs to wiki [skip ci]"
git push origin master    # GitHub wiki uses 'master' branch
```

Output: The project's GitHub Wiki tab now has the selected specs as pages.

---
