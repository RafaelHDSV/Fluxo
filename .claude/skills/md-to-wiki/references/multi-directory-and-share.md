## Multi-Directory Input

If the user wants to include markdown from multiple sources (e.g., `.specs/` + `docs/` + `notes/`), merge them:

```bash
mkdir -p merged-specs
cp -r .specs/* merged-specs/
cp -r docs/* merged-specs/
```

Then use `merged-specs/` as the source.

## Sharing

To share with colleagues, copy the `md-to-wiki/` folder into their `.config/opencode/skills/` (global) or `.opencode/skills/` (project-local). Dependencies vary by format:
- Pure HTML: `mkdocs`, `mkdocs-material`
- Swagger: `node` + `npx`, or just a browser
- GitHub Wiki: `git`
- DokuWiki: `pandoc`
- PDF: `pandoc` + `weasyprint` or `wkhtmltopdf`
