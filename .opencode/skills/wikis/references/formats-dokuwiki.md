# Format 4 — DokuWiki

Convert selected markdowns to DokuWiki syntax and generate a ready-to-import directory.

#### 4a. Install conversion tool

```bash
sudo apt install pandoc   # or brew install pandoc
```

Or use pip:
```bash
pip install python-dokuwiki
```

#### 4b. Convert files

```bash
mkdir -p wiki-export/data/pages
for md_file in $(find .specs -name "*.md"); do
  page_id=$(echo "$md_file" | sed 's/\.specs\///' | sed 's/\.md$//' | sed 's/\//:/g' | tr '[:upper:]' '[:lower:]')
  pandoc "$md_file" -f markdown -t dokuwiki -o "wiki-export/data/pages/${page_id}.txt"
done
```

#### 4c. Generate namespace structure

```
wiki-export/
├── data/
│   └── pages/
│       ├── specs:project:project.txt
│       ├── specs:project:roadmap.txt
│       ├── specs:codebase:architecture.txt
│       ├── specs:features:auth:spec.txt
│       └── ...
└── README.md   # Import instructions
```

#### 4d. Provide import instructions

Write a `wiki-export/README.md` with clear steps:
1. Copy the `data/pages/` contents into your DokuWiki instance's `data/pages/` directory
2. Or use the DokuWiki admin panel → File Manager to upload
3. Generate a start page
4. Adjust permissions after import

Output: `wiki-export/` directory ready for DokuWiki import.

---
