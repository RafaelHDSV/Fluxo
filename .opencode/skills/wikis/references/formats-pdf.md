# Format 5 — PDF Document

Generate a single PDF book from the selected spec markdowns.

#### 5a. Install tools

```bash
# Option A: Pandoc + WeasyPrint (recommended)
pip install weasyprint
sudo apt install pandoc

# Option B: Pandoc + wkhtmltopdf (fallback)
sudo apt install wkhtmltopdf pandoc
```

#### 5b. Concatenate selected files in order

Build a single markdown document ordered by the onboarding scope. Default order:

1. Title page (project name, date, auto-generated notice)
2. Table of contents
3. Project Overview (PROJECT.md)
4. Roadmap (ROADMAP.md)
5. State / Decisions (STATE.md)
6. Codebase docs (if included)
7. Each feature (spec.md, design.md, tasks.md) — grouped by feature
8. Quick tasks (if included)

```bash
{
  echo "# <Project Name> — Specifications"
  echo ""
  echo "*Generated on $(date +%Y-%m-%d)*"
  echo ""
  echo "\\newpage"
  echo ""

  for md in .specs/project/PROJECT.md .specs/project/ROADMAP.md; do
    if [ -f "$md" ]; then
      cat "$md"
      echo ""
      echo "\\newpage"
      echo ""
    fi
  done

  for feature_dir in .specs/features/*/; do
    name=$(basename "$feature_dir")
    echo "## Feature: $(echo $name | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')"
    echo ""
    for f in "$feature_dir"spec.md "$feature_dir"design.md "$feature_dir"tasks.md; do
      if [ -f "$f" ]; then
        cat "$f"
        echo ""
        echo "\\newpage"
        echo ""
      fi
    done
  done
} > specs-book.md
```

#### 5c. Convert to PDF

```bash
pandoc specs-book.md -f markdown --pdf-engine=weasyprint \
  -o specs-book.pdf \
  --metadata title="<Project Name> — Specifications" \
  --toc --toc-depth=3
```

Fallback:
```bash
pandoc specs-book.md -f markdown --pdf-engine=wkhtmltopdf \
  -o specs-book.pdf \
  --metadata title="<Project Name> — Specifications" \
  --toc --toc-depth=3
```

#### 5d. Verify

- Check PDF renders correctly
- Verify the table of contents has correct page numbers
- Confirm code blocks are readable
- Check that images (diagrams) are embedded

Output: `specs-book.pdf`.

