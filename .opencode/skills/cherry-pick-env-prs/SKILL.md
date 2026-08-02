---
name: cherry-pick-env-prs
description: >-
  Ports merged main PRs into environment branches via git cherry-pick -m 1,
  opens draft PRs, resolves conflicts without unrelated pollution, and optionally
  compares productive PRs vs main for line/file divergence. Use when the user
  asks to cherry-pick a PR to production/production-server/production-selfcontract/jobs,
  port a merge commit to ambientes, open environment draft PRs from main, or
  analyze divergência between main and productive cherry-pick PRs.
---

Follow [git-github.mdc](../../rules/git-github.mdc) for all git/GitHub writes.

# Cherry-pick PRs → environment branches

Two phases. Run **Fase A** when opening/porting PRs. Run **Fase B** only when the user asks for comparative divergence analysis (not a bug-hunt review).

| Phase | When | GitHub writes |
|-------|------|---------------|
| **A — Port** | Cherry-pick / open PRs to ambientes | Push new branches + `gh pr create` **only if** the user explicitly asked to open/create those PRs |
| **B — Analysis** | Compare productive PRs vs main; explain +/− | **None** — markdown only at hub root |

Do **not** confuse Fase B with skill `pr-review` (RCs in `.reviews/`).

## Authorization (non-negotiable)

| User said | Allowed | Forbidden |
|-----------|---------|-----------|
| Open / create / cherry-pick and open PRs | `git push -u`, `gh pr create` (draft unless told otherwise) | Merge, ready-for-review, approve, comment, add reviewers/projects unless explicitly requested |
| Analyze / compare / divergência only | Read via `gh` / git / MCP | Any push, commit, PR create/update, comment |
| Corrija divergências / fix pollution | Local fix + commit/push on **existing** PR branches when fixing those drafts | New scope beyond the named pollution |

Vague “go ahead” on a plan that only describes Phase A does **not** replace an explicit open-PR request if the current message is analysis-only.

## Defaults AGX (override from prompt)

Use when the user does not specify otherwise:

| Item | Default |
|------|---------|
| Branch | `{issue}-{slug-kebab}---{ambiente}` (accents OK if the repo already uses them) |
| Title | `[{issue}] - [{produto/contexto}] {resumo} - {ambiente}` |
| PR state | `--draft` |
| Assignee | `RafaelHDSV` (or `gh api user -q .login`) |
| Label | Exactly what the user named (e.g. `Consórcio`) |
| Reviewers / projects | **None** |
| Body | Fill the repo PR template the user cites (else that repo’s `.github/pull_request_template.md`) |
| Cherry-pick | `git cherry-pick <mergeSha> -m 1` |

Ambientes are **per repo** — never assume the same list for every repository.

---

# Fase A — Port

## Preflight

1. Confirm source PR(s) are **MERGED** into the expected base (usually `main`).
2. Get merge SHA:

```bash
gh pr view <N> --repo <org>/<repo> --json number,state,mergedAt,mergeCommit,baseRefName,headRefName,title,body,url
```

Use `mergeCommit.oid` for cherry-pick. If missing, stop and ask.

3. Confirm **ambiente list per repo** from the user prompt.
4. Ensure local clone is clean; `git fetch origin <ambientes…> main`.
5. Collect or extract: board/issue URL, title pattern, branch pattern, assignee, labels, draft flag, body links (sibling PRs).

## Loop per environment (one at a time per repo)

```text
git fetch origin <ambiente>
git checkout -B <ambiente> origin/<ambiente>
git checkout -b <branch-nova>
git cherry-pick <mergeSha> -m 1
# on conflict → Conflict handling below
git push -u origin HEAD
gh pr create --draft --base <ambiente> --assignee <user> --label "<label>" \
  --title "..." --body "..."
```

- Same repo: finish one ambiente before starting the next (clean working tree).
- Independent repos: sequential is fine (e.g. core then indiky-server).
- PowerShell: do not use bash HEREDOC for commit/PR body; use here-strings (see [reference.md](reference.md)).

## Conflict handling

1. Launch a subagent with: absolute repo path, branch name, merge SHA, `git status` conflict list (UU/DU), feature goal from the main PR, and sibling env branches already resolved as optional reference.
2. Resolve by keeping **base-branch** surrounding code and integrating **only** the feature delta from the cherry-pick.
3. Port helpers already on `main` but missing on the base **only if staged callers require them** (compile/runtime). Document each port in the chat summary.
4. After `git cherry-pick --continue`, run **anti-pollution** (required):

```bash
git diff origin/<ambiente>...HEAD -- <touched-files>
```

Remove hunks that are **not** part of the main PR’s intentional delta (unrelated assignments, drive-by i18n, averbation fields, etc.). See [reference.md](reference.md).

5. Do not abort unless irreconcilable. Do not force an empty merge.

## PR body checklist

Fill the template sections the team expects, typically:

1. Issue / board link  
2. Sibling PR links (FE/BE + same-ambiente siblings when known)  
3. Description = summary of the main PR (+ “cherry-pick of #<N> to `{ambiente}`”)  
4. Deploy order (often “ao mesmo tempo” when core+indiky pair)  
5. Notes / pré-deploy / screenshots: `n/a` unless real

## Fase A chat delivery

Table: `repo | ambiente | branch | draft URL | cherry-pick: limpo | conflito resolvido`.

---

# Fase B — Divergence analysis (read-only)

Trigger examples: “compare com a main”, “divergência de linhas”, “analise os PRs produtivos vs main”.

**Deliverable:** one markdown file at the **hub root**:

```text
YYYY-MM-DD[-HH]-analise-divergencia-<slug>.md
```

**No** GitHub writes. **No** `.reviews/` (that is `pr-review`).

## Method

For each pair (main PR ↔ productive PR):

1. Totals: `additions`, `deletions`, `changedFiles`, `baseRefName`.
2. Per-file map → compute:
   - `ONLY_IN_MAIN`
   - `ONLY_IN_PROD`
   - `STAT_DIFF` (same path, different +/−)
3. Explain each delta using base prerequisites (`git cat-file` / `git grep` on `origin/<base>` vs `origin/main`).
4. Classify every material delta:

| Class | Meaning |
|-------|---------|
| necessário | Base lacked file/symbol that main already had; feature needs it |
| adaptação | Base architecture differs (e.g. jobs classic service); intentional port |
| cosmético | Formatting / +1−1 conflict noise |
| **poluição** | Hunk not in main PR intentional delta; brought by bad conflict resolution |

5. Executive table + human checklist. If poluição: describe the fix; **do not apply** unless the user asks to correct it.

Optional recheck after fixes: rewrite a new timestamped analysis file (do not silently edit history of the prior report unless the user asks to update the same file).

## Additional resources

- Pitfalls, anti-pollution checklist, 7547 example, PowerShell notes: [reference.md](reference.md)
