---
name: skill-discovery
allowed-tools: Bash, Read, Write
description: >-
  Use when the user asks to find or install skills, or when no local skill/rule
  covers the task. Searches skills.rest index. Do not use if stitch-workflow,
  wikis, or another local skill already applies.
---

# Skill Discovery & Manager

This skill allows Claude to dynamically expand its capabilities by searching vetted skills from the `skills.rest` ecosystem. It finds specialized tools containing domain knowledge and executable scripts to solve complex tasks.

## Execution Workflow

### [STEP 1: QUERY GENERATION]
Construct a **STRICT** 3-sentence English paragraph to match the search index. **Ensure the query is sanitized and contains NO sensitive or PII data.**
1.  **S1: Problem**: Action + Object (State exactly what problem the skill solves).
2.  **S2: Context**: Scope & Scenario (State the specific application domain).
3.  **S3: Requirements**: Tech/Functional Needs (Describe specific features).
*Style: Strictly declarative. Start with verbs. NO conversational fillers.*

### [STEP 2: SEARCH API]
Execute the following command using `Bash`. Configure parameters based on actual needs.

```bash
curl -s -X POST https://search.skills.rest \
  -H "Content-Type: application/json" \
  -d '{
    "query": "<YOUR_GENERATED_QUERY>",
    "top_k": 5,
    "complexity": "<OPTIONAL>",
    "author_type": "<OPTIONAL>",
    "client": "<OPTIONAL>",
    "system": "<OPTIONAL>"
  }'
```

**Parameter Guide:**
*   **`top_k`**: Range 5-20 (Default 5). Increase for obscure tasks.
*   **`complexity`** (`Basic`|`Intermediate`|`Advanced`): Higher complexity implies more refined implementations. Use `'Advanced'` if the task requires **execution capabilities** (scripts/code); use `'Basic'` for simple knowledge. **Omit** to keep the widest search range.
*   **`author_type`** (`Official`|`Community`): Set to `'Official'` for first-party skills. **Omit** to search the full ecosystem (Recommended).
*   **`client`** (`codex`|`gemini cli`): **Omit** by default. Use `'codex'` or `'gemini cli'` **ONLY** if identifying as those specific agents to adjust the installation folder name.
*   **`system`** (`windows`): **Omit** by default (for Mac/Linux/Bash). Set to `'windows'` **ONLY** if the user environment is explicitly Windows to generate PowerShell commands.

### [STEP 3: DECIDE & CONFIRM]
1.  **Analyze**: Read the JSON `results`. Evaluate `description`, `dependencies`, and `components`.
2.  **Present Options**: You **MUST** present the best matches to the user, summarizing their features and authors.
3.  **Ask for Confirmation**: Ask the user: *"Which skill would you like to install?"*
4.  **Install**: Once the user confirms, execute the chosen skill's `install_command` **VERBATIM** using `Bash`.

### [STEP 4: ACTIVATION]
After installation is successful, you **MUST** inform the user in this exact format:

> "Skill **[Name]** (by **[Author]**) installed. It **[briefly describe utility]**. It is ready to use immediately. "
```

---
