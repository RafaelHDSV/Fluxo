# cherry-pick-env-prs — reference

## Why `-m 1` on the merge commit

Merged PRs on GitHub are usually **merge commits** with two parents:

1. Parent 1 = tip of the base (`main`) at merge time  
2. Parent 2 = tip of the feature branch  

`git cherry-pick <mergeSha> -m 1` applies the diff of the feature relative to that main parent — i.e. **only the PR changes**, not an entire side history.

Do not cherry-pick random commits from the feature branch unless the user asks; prefer the merge OID from `gh pr view --json mergeCommit`.

## Example (board 7547 — condensed)

| Repo | Main PR | Merge SHA (illustrative) | Ambientes |
|------|---------|--------------------------|-----------|
| core | #8454 | `74b8698…` | production, production-server, production-selfcontract, jobs |
| indiky-server | #5650 | `0d90ba8…` | production, production-server, jobs |

Branch pattern used:

```text
7547-conexia-novo-objetivo-carta-contemplada-na-simulação---{ambiente}
```

Title pattern:

```text
[7547] - [Conexia] Novo objetivo Carta Contemplada na simulação - {ambiente}
```

Drafts: assignee `RafaelHDSV`, label `Consórcio`, no reviewers/projects, body from `core/.github/pull_request_template.md` (also used for indiky drafts in that run).

## Common causes of +/− differences (not always bugs)

| Cause | Example | Pollution? |
|-------|---------|------------|
| File only bumped on main; whole file added on prod | `ConsortiumSimulationObjectives.ts` (+2 on main vs +100 add on prod) | No — necessário |
| Helper already on main, missing on base | `getChosenLetter` on `ProposalModel` | No — port if callers need it |
| Templates/deps missing on `jobs` | `consortiumBeviData.ts` / `consortiumBeviStyles.ts` | No — necessário for compile |
| Base architecture older | jobs keeps classic `ConsortiumSimulationService`; FE production lacks SDC UX that main already had | No — adaptação (smoke) |
| Formatting-only conflict resolution | Prettier wrapping of `throwlhos.err_*` | No — cosmético |
| Cleanup only applicable on main | incidental `BottomNavigation` −1 | Usually ignore |
| Unrelated hunk from conflict / main context | `averbationHub*` persistence on selfcontract/jobs when not in main PR delta | **Yes — poluição** |

## Anti-pollution checklist (after every conflicted cherry-pick)

Run before push:

```bash
git diff origin/<ambiente>...HEAD
```

For each touched file:

1. Is every added hunk required by the **main PR summary** or by a **direct caller** of that PR’s code?
2. Does the base already have this behavior? If yes, the productive PR should not re-add it (file may disappear from the PR file list — OK).
3. Did conflict resolution insert fields/imports from surrounding main code that the base intentionally lacked? → remove.
4. Compare productive PR file list to main PR: `ONLY_IN_PROD` should be explainable (ports/deps); unexplained adds are suspect.

When fixing pollution on an open draft: commit on the PR branch, push, optionally re-run Fase B as a new timestamped report.

## Subagent prompt skeleton (conflicts)

```text
Repo: <abs path>
Branch: <feature---ambiente>
Cherry-pick in progress: <mergeSha> -m 1
Base: origin/<ambiente>
Conflicts: <paths + UU/DU>
Feature goal: <from main PR>
Reference siblings (optional): <other ---ambiente branches already done>
Rules: keep base code; integrate feature only; port missing deps only if callers need them;
       after continue, strip unrelated hunks; do not push; do not create PR.
```

## PowerShell notes (Windows hub)

Bash HEREDOC often fails in PowerShell:

```powershell
# BAD in PowerShell
git commit -m "$(cat <<'EOF'
msg
EOF
)"
```

Prefer:

```powershell
$msg = @"
Why this change matters.

"@
git commit -m $msg
```

Same idea for `gh pr create --body $body`.

When writing JSON from `gh api` to disk, force UTF-8 **without BOM** (BOM breaks `JSON.parse` in Node):

```powershell
[System.IO.File]::WriteAllText($path, $json, [System.Text.UTF8Encoding]::new($false))
```

## Fase B report skeleton

```markdown
# Análise de divergência — <slug>

## Resumo executivo
| Repo | Prod PR | vs main | Risco |

## Baselines (main)
## Pré-condições nas bases
## Per-repo sections (ONLY_IN_MAIN / ONLY_IN_PROD / STAT_DIFF + class)
## Por que as linhas diferem?
## Checklist residual
```

## Related rules / skills

- Writes / push / PR create: [git-github.mdc](../../rules/git-github.mdc)
- Structured RC reviews (different deliverable): skill `pr-review` → `.reviews/`
- Commits when fixing pollution: skill `commit`
